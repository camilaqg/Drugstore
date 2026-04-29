import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; 
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink], 
  templateUrl: './login.html',
  styleUrls: ['./login.css'] 
})
export class Login {

  username: string = '';
  password: string = '';

  errorCampos: boolean = false;
  errorCredenciales: boolean = false;

  constructor(private router: Router) {}

  login() {

    // VALIDAR CAMPOS VACÍOS
    if (!this.username || !this.password) {
      this.errorCampos = true;
      this.errorCredenciales = false;
      return;
    }

    this.errorCampos = false;

    // LOGIN ADMIN
    if (this.username === 'admin' && this.password === '1234') {
      this.errorCredenciales = false;
      localStorage.setItem('loggedIn', 'true');
      this.router.navigate(['/dashboard']);
      return;
    }

    // OBTENER USUARIO REGISTRADO
    const userGuardado = localStorage.getItem('user');

    if (!userGuardado) {
      this.errorCredenciales = true;
      return;
    }

    const user = JSON.parse(userGuardado);

    // VALIDAR USUARIO REGISTRADO
    if (this.username === user.username && this.password === user.password) {

      this.errorCredenciales = false;

      // GUARDAR SESIÓN
      localStorage.setItem('loggedIn', 'true');

      // REDIRIGIR AL DASHBOARD
      this.router.navigate(['/dashboard']);

    } else {
      this.errorCredenciales = true;
    }
  }
}