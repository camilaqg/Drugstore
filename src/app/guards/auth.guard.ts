import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = () => {

  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // Si estamos en el servidor, dejamos continuar
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // Si estamos en el navegador, revisamos el token
  const token = localStorage.getItem('access_token');

  if (token) {
    return true;
  }

  return router.createUrlTree(['/']);
};