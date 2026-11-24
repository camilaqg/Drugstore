import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

  // Camino único de cierre de sesión
  private readonly authService = inject(AuthService);

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

    // Mismo camino único que App: borra las 4 claves, incluido access_token
    this.authService.cerrarSesion();

    // Volver al login
    this.router.navigate(['/']);
  }
}