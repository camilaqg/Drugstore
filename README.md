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

Hoy la URL está **escrita en el código**, en el campo `apiUrl` de cada servicio:

| Archivo | Endpoint |
| --- | --- |
| `src/app/services/auth.service.ts:31` | `/auth` |
| `src/app/services/medicamento.service.ts:22` | `/medicamento` |
| `src/app/services/venta` (`sales.service.ts:14-15`) | `/venta`, `/medicamento` |
| `src/app/services/compra.service.ts:18` | `/compra` |
| `src/app/services/usuario.service.ts:15` | `/usuario` |

Para apuntar a otro host hay que editar esos cinco archivos: el proyecto no tiene
`src/environments/` todavía. Es una limitación conocida, no una decisión de diseño.

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
