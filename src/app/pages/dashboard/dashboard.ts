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

  // variable para mostrar el usuario
  usuarioActual: string = '';

  // router para poder cambiar de pagina
  private router = inject(Router);

  constructor() {

    // obtener usuario guardado
    this.usuarioActual = localStorage.getItem('usuario') || '';
  }

  // funcion para salir
  salir() {

    // volver al login
    this.router.navigate(['/login']); 
  }
}