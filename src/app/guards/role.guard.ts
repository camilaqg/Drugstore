import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = async (route) => {

  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);

  // Si estamos en el servidor, dejamos continuar
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // Comprobar si existe el token
  const token = localStorage.getItem('access_token');

  if (!token) {
    return router.createUrlTree(['/login']);
  }

  // El rol que decide el acceso viene SIEMPRE del backend (respuesta de
  // GET /auth/me, confirmada por AuthService). El valor guardado en
  // localStorage es solo para mostrar en las pantallas, nunca para
  // autorizar, porque es manipulable desde las devtools.
  // Si el backend no confirma un rol (token vencido/inválido o error
  // de conexión), volvemos al login. El backend, además, vuelve a
  // validar el rol en cada llamada protegida.
  const rol = await authService.rolConfirmado();

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
