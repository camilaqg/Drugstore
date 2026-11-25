# Despliegue del frontend en el VPS

Runbook **específico de este repositorio** (Angular 21 SSR, repo `Drugstore`).
La primera puesta en marcha del VPS — usuario, llave SSH, Node 22, Caddy,
firewall, sudoers y rollback del backend — está en el runbook del backend:

> `drogueria-backend/deploy/DESPLIEGUE.md`

Este documento solo cubre lo que hace falta **por el lado del frontend**. Lo
que corre en el VPS no se repite acá: Caddy ya resuelve el modelo de tráfico —
`/api/*` (prefijo quitado) al backend en `127.0.0.1:3000`, el resto a este
frontend en `127.0.0.1:4000` — con el mismo origen, así que no hay CORS en
producción.

## 1. Qué necesita este servicio en el servidor

Los pasos 1 y 2 del runbook del backend (usuario `drogueria`, Node 22,
Caddy) dejan el servidor listo salvo **tres** cosas específicas del frontend:

```bash
sudo mkdir -p /srv/drogueria/frontend
sudo chown drogueria:drogueria /srv/drogueria/frontend
```

**Unidad de systemd:**

```bash
sudo install -m 644 deploy/drugstore-frontend.service /etc/systemd/system/
sudo systemctl daemon-reload
```

**Sudoers del frontend:** el `/etc/sudoers.d/drogueria-backend` del runbook
solo autoriza reiniciar el backend. Para el reinicio del frontend hace falta
la variante espejo (misma forma, otro servicio):

```bash
echo 'drogueria ALL=(root) NOPASSWD: /usr/bin/systemctl restart drugstore-frontend, /usr/bin/journalctl -u drugstore-frontend -n * --no-pager' \
  | sudo tee /etc/sudoers.d/drogueria-frontend
sudo chmod 440 /etc/sudoers.d/drogueria-frontend
sudo visudo -c -f /etc/sudoers.d/drogueria-frontend   # "parsed OK"
```

No hay archivo de variables: **el frontend no lleva secretos** (la base y los
datos viven en el backend) y `PORT`/`NODE_ENV` los fija la unidad. Lo que el
organizador decide también explicitamente: el SSR escucha en todas las
interfaces de `127.0.0.1:4000`, igual que el backend, y el aislamiento lo
mantiene el firewall del VPS (§3 del runbook del backend), no el código.

## 2. Secretos y variables de GitHub (de ESTE repo)

*Settings → Secrets and variables → Actions*, en el repo `Drugstore`:

| Nombre | Tipo | Valor |
| --- | --- | --- |
| `VPS_HOST` | secret | dominio o IP del VPS |
| `VPS_USER` | secret | `drogueria` |
| `VPS_SSH_KEY` | secret | contenido completo de `~/.ssh/drogueria_despliegue` (la **privada**) |
| `VPS_KNOWN_HOSTS` | secret | salida de `ssh-keyscan` del runbook del backend (§4) |
| `DEPLOY_ENABLED` | **variable** | vacío hasta que el VPS exista; `true` para encender el deploy automático |

⚠️ **El repo `Drugstore` y `drogueria-backend` pertenecen a cuentas de GitHub
distintas** (`camilaqg` y `laura210610`), así que los secretos no se comparten
entre repos: **la misma llave SSH privada** (la de la misma línea del runbook,
`~/.ssh/drogueria_despliegue`) hay que cargarla **también** en el otro repo,
junto con el mismo `VPS_HOST`, `VPS_USER` y `VPS_KNOWN_HOSTS`. La pública de
esa llave es la única instalada en el `authorized_keys` del usuario
`drogueria` del VPS.

El pipeline apunta con `StrictHostKeyChecking=yes` a ese `known_hosts`
pinneado: si el host key cambia, el deploy falla en vez de confiar a ciegas.

## 3. Cómo llega el build al VPS (y por qué no se compila allá)

El job `desplegar` (`.github/workflows/deploy.yml`) hace, en orden:

1. `npx ng build` **en CI**: los artefactos no sobreviven entre jobs, así que
   hay que recompilar en el job de deploy antes de sincronizar.
2. `rsync -az --delete` de `dist`, `package.json` y `package-lock.json` a
   `/srv/drogueria/frontend/` (excluye `node_modules/`).
3. Remoto: `npm ci --omit=dev` (el servidor SSR importa `express` en runtime,
   que vive en `dependencies`), `sudo systemctl restart drugstore-frontend`,
   y un healthcheck de hasta 30s contra `http://127.0.0.1:4000/`; si no
   responde, imprime las 50 últimas líneas del journal y falla el job.

**Compilar en CI y no en el VPS es deliberado:** así el servidor nunca
necesita el toolchain de Angular ni el pico de ~1 GB de RAM que alcanza el
build de producción; solo recibe los artefactos ya construidos y menos
dependencias. A cambio, cambiar la app siempre pasa por CI (ver §4).

## 4. Dónde vive la URL de la API

| Valor | Cuándo | Dónde |
| --- | --- | --- |
| `http://localhost:3000` | desarrollo (`npm start`, `ng test`) | `src/environments/environment.ts` |
| `/api` | **build** (`ng build`) | `src/environments/environment.prod.ts` |

En producción la URL **se hornea en el bundle**: apuntar el frontend a otro
backend no es tocar una variable ni reiniciar — es editar
`environment.prod.ts`, comprometer, y dejar que CI recompile y redespliegue
(§3). El job `verificar` lo pinnea: si el bundle referencia `localhost:3000`,
falla con mensaje explícito.

## 5. Rollback (frontend)

**Preferido:** *Actions → CI/CD frontend → elegir un run anterior de `main`
cuyo commit sea el bueno → re-run del job `desplegar`*. El `rsync --delete`
deja el árbol del VPS idéntico al de ese run; el frontend no toca la base, así
que no hay consideraciones de datos.

**Manual (`git reset --hard`)** — sobre un clon fresco, nunca sobre el árbol
de trabajo propio (`reset --hard` descarta cambios locales):

```bash
git clone git@github.com:camilaqg/Drugstore.git $(mktemp -d)/drugstore
cd .../drugstore && git reset --hard <sha-del-buen-commit>
npx ng build
rsync -az --delete dist package.json package-lock.json \
  drogueria@VPS_HOST:/srv/drogueria/frontend/
ssh drogueria@VPS_HOST 'cd /srv/drogueria/frontend && npm ci --omit=dev \
  && sudo systemctl restart drugstore-frontend'
```

## Lo que este runbook no puede probar sin el VPS

El deploy por SSH/curl/sudo, el healthcheck real y el rollback sobre el
servidor están **sin probar**: el repo solo demuestra el lado CI (`ng build`,
una corrida de tests y el parseo del YAML/la unidad de systemd); la validación
end-to-end es la tarea T7 del plan de despliegue, contra el VPS real.
