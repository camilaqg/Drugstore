import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {

  // usuario que inició sesión
  usuarioActual: string = '';

  // rol del usuario (admin o cliente)
  rol: string = '';

  // router para cambiar de página
  private router = inject(Router);

  constructor() {

    // obtener usuario guardado
    this.usuarioActual = localStorage.getItem('usuario') || '';

    // obtener rol guardado
    this.rol = localStorage.getItem('rol') || '';
  }

  // función para salir
  salir() {

    // limpiar sesión
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');

    // volver al login
    this.router.navigate(['/login']);
  }
}