# Droguería Pili — Frontend

Interfaz web del sistema de gestión de droguería. Angular 21 (componentes
standalone, signals) con SSR en modo cliente. Consume la API del repositorio
`drogueria-backend`; **sin ese backend corriendo la aplicación no funciona**: no
hay datos ni autenticación locales.

## Requisitos

- Node.js 22 o superior (probado con Node 22 y 26)
- npm 10 o superior
- El backend corriendo en `http://localhost:3000`

## Puesta en marcha

Terminal 1 — el backend:

```bash
cd ../drogueria-backend/backend
npm install && npm run start:dev
```

Terminal 2 — el frontend:

```bash
npm install
npm start          # ng serve → http://localhost:4200
```

La pantalla inicial es `/login`. Las cuentas salen de la base del backend: si no
hay ninguna, corré `npm run seed` (o `crear-admin.ts`) en el repositorio del
backend. Los usuarios registrados desde `/register` se crean siempre con rol
`cliente`.

## URL del backend

La URL no está escrita en el código: sale de `src/environments/`.

| Archivo | Cuándo se usa | `apiUrl` |
| --- | --- | --- |
| `environment.ts` | desarrollo (`npm start`, `ng test`) | `http://localhost:3000` |
| `environment.prod.ts` | producción (`ng build`) | `/api` |

`angular.json` reemplaza el primero por el segundo en la configuración `production`
(`fileReplacements`), y los cinco servicios leen `environment.apiUrl`. En producción
la URL es **relativa**: Caddy publica el backend bajo el mismo dominio, en `/api`
(ver `deploy/Caddyfile` del repositorio del backend), así que no hay CORS ni host en
el bundle.

Ojo con una cosa: Angular **hornea la URL en el bundle durante el build**. Cambiarla
exige recompilar y volver a desplegar; tocar una variable en el servidor no hace nada.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm start` | Servidor de desarrollo en `http://localhost:4200` |
| `npm run build` | Build de producción en `dist/` |
| `npm test` | Tests unitarios (Vitest + jsdom). En CI usar `npx ng test --watch=false` |
| `npm run serve:ssr:drugstore-system` | Sirve el build SSR |

No hay script de lint ni configuración de ESLint en este repositorio.

## Rutas y permisos

El guard `roleGuard` (`src/app/guards/role.guard.ts`) no confía en el
`localStorage`: pide `GET /auth/me` al backend y usa el rol que responde. Un rol
inventado en el navegador no habilita nada.

| Ruta | Roles |
| --- | --- |
| `/login`, `/register` | públicas |
| `/dashboard` | `admin`, `cliente` |
| `/inventory` | `admin` |
| `/sales` | `admin` |
| `/purchases` | `admin` |
| `/purchase-history` | `admin` |
| `/reports` | `admin` |
| `/usuarios` | `admin` |
| `/`, `**` | redirigen a `/login` |

El interceptor (`src/app/interceptors/auth.interceptor.ts`) agrega el token a cada
petición y, ante un 401/403, limpia la sesión y manda a `/login`.

## Tests

```bash
npm test                     # 94 tests, 14 archivos
npx ng test --watch=false    # una sola corrida, para verificación
```

El setup de tests (`src/app/testing/local-storage-setup.spec.ts`) existe porque
Vitest no instala el getter de `localStorage` cuando Node ya lo define. Sin ese
archivo los tests fallan según la versión de Node.

## Estructura

```
src/app/
├── components/chatbot/        # asistente de demostración (no llama a la API)
├── guards/role.guard.ts
├── interceptors/auth.interceptor.ts
├── models/                    # medicamento, purchase, sale, usuario
├── pages/                     # dashboard, inventory, login, purchases,
│                              # purchase-history, register, reports, sales, usuarios
├── services/                  # auth, medicamento, compra, venta, usuario
├── app.routes.ts              # rutas + roles
└── app.config.ts              # providers HTTP y router
```

## Despliegue

En producción corre en un VPS detrás de Caddy, bajo systemd, y se despliega solo con
cada push a `main` (GitHub Actions). El runbook del servidor y el detalle de secretos
están en [`deploy/DESPLIEGUE.md`](./deploy/DESPLIEGUE.md); la puesta en marcha completa
del VPS vive en el repositorio del backend.

## Limitaciones conocidas

- **SSR en modo cliente**: `app.routes.server.ts` renderiza todo en el cliente, así
  que el HTML que devuelve el servidor no trae datos. Se eligió así para
  desbloquear el build (las páginas dependen de `localStorage` y del backend).
- **Dashboard**: muestra el usuario y el rol de la sesión; todavía no pide datos a
  la API.
- **Chatbot**: usa un catálogo de ejemplo en memoria, sin llamadas al backend, y se
  renderiza en todas las rutas, incluidas `/login` y `/register`.
- **Sin pantalla 404**: la ruta comodín redirige a `/login`.
- **Sin "anular venta" en la interfaz**: el backend expone `PATCH` y `DELETE
  /venta/:id`, pero la pantalla de ventas solo lista y registra.
- La compra anulada desde la interfaz devuelve el stock, pero no revierte los
  precios que esa compra actualizó (limitación del backend).

## Problemas comunes

- **La pantalla queda vacía o los listados dan error**: el backend no está
  corriendo o está en otro puerto. Revisá `http://localhost:3000`.
- **Error de CORS en la consola**: el backend solo acepta el origen de
  `CORS_ORIGIN` (por defecto `http://localhost:4200`). Si servís en otro puerto,
  agregalo ahí.
- **`ng test` queda esperando**: es el modo watch. Usá `npx ng test --watch=false`.
