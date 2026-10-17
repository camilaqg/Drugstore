import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const roleGuard: CanActivateFn = (route) => {

  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // Si estamos en el servidor, dejamos continuar
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // Comprobar si existe el token
  const token = localStorage.getItem('access_token');

  if (!token) {
    return router.createUrlTree(['/login']);
  }

  // Obtener el rol del usuario
  const rol = localStorage.getItem('rol');

  // Si no existe el rol, regresar al login
  if (!rol) {
    return router.createUrlTree(['/login']);
  }

  // Obtener los roles permitidos para la ruta
  const roles = route.data['roles'];

  // Comprobar si el rol está autorizado
  if (Array.isArray(roles) && roles.includes(rol)) {
    return true;
  }

  // Si tiene un rol, pero no permiso, regresar al dashboard
  return router.createUrlTree(['/dashboard']);
};
