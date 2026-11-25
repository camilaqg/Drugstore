// Entorno de producción: `ng build` (configuración production) reemplaza
// environment.ts por este archivo.
//
// apiUrl es relativo a propósito: Caddy publica el frontend en `/` y el backend
// en `/api/*` bajo el MISMO dominio, así que no hay CORS ni URL de host en el
// bundle. Si algún día el backend vive en otro dominio, este es el único valor
// que hay que cambiar (y volver a compilar: la URL se hornea en el bundle).
export const environment = {
  produccion: true,
  apiUrl: '/api',
};
