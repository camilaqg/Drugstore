import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);
  const router = inject(Router);

  // En el servidor no tocamos localStorage ni redirigimos
  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  const token = localStorage.getItem('access_token');

  const request = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  return next(request).pipe(
    catchError((error: unknown) => {

      // Sesión vencida o token inválido: 401 (vencido o ausente) y 403.
      if (
        error instanceof HttpErrorResponse &&
        (error.status === 401 || error.status === 403)
      ) {

        // El propio intento de login NO dispara la limpieza ni la
        // redirección: ahí la pantalla de login debe mostrar
        // "credenciales inválidas", no navegar.
        const esLogin = req.method === 'POST' && req.url.includes('/auth/login');

        if (!esLogin) {

          // Limpiar toda la sesión (incluido access_token) por el
          // camino único de AuthService
          authService.cerrarSesion();

          // Mandar a login (evitando una navegación redundante si ya
          // estamos en esa página)
          if (router.url !== '/login') {
            router.navigate(['/login']);
          }

        }

      }

      return throwError(() => error);

    })
  );
};
