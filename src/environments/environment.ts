// Entorno de desarrollo (el que usan `npm start` y `ng test`).
//
// En desarrollo el backend corre aparte, en su propio puerto, y el navegador
// lo llama directo: por eso la URL absoluta. El backend permite este origen
// por CORS (CORS_ORIGIN, por defecto http://localhost:4200).
//
// En producción este archivo se reemplaza por environment.prod.ts mediante
// `fileReplacements` de angular.json, donde apiUrl pasa a ser `/api` porque
// Caddy sirve el backend bajo el mismo dominio (ver deploy/Caddyfile del
// repositorio del backend).
export const environment = {
  produccion: false,
  apiUrl: 'http://localhost:3000',
};
