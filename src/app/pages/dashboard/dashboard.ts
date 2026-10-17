import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {

  // Usuario que inició sesión
  readonly usuarioActual = signal('');

  // Rol del usuario
  readonly rol = signal('');

  // Router para cambiar de página
  private readonly router = inject(Router);

  constructor() {

    // Verificar que estamos en el navegador
    if (typeof localStorage !== 'undefined') {

      // Obtener usuario guardado
      this.usuarioActual.set(
        localStorage.getItem('usuario') || ''
      );

      // Obtener rol guardado
      this.rol.set(
        localStorage.getItem('rol') || ''
      );
    }
  }

  // Función para salir
  salir() {

    if (typeof localStorage !== 'undefined') {

      // Limpiar sesión
      localStorage.removeItem('loggedIn');
      localStorage.removeItem('usuario');
      localStorage.removeItem('rol');
      localStorage.removeItem('access_token');
    }

    // Volver al login
    this.router.navigate(['/']);
  }
}