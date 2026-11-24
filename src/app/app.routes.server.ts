import { RenderMode, ServerRoute } from '@angular/ssr';

// Las rutas se renderizan en el cliente.
//
// Antes estaba en RenderMode.Prerender y el build fallaba: el prerender ejecutaba
// ngOnInit de las páginas durante la compilación, y varias de ellas hacen peticiones
// HTTP al backend (localhost:3000) y leen localStorage, cosas que no existen en el
// proceso de build. El resultado era "An error occurred while prerendering route '/sales'".
//
// Con RenderMode.Client el navegador construye la aplicación: las páginas protegidas
// no se generan en el build y no queda HTML de admin expuesto en el servidor.
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];
