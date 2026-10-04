import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {

  readonly username = signal('');
  readonly password = signal('');

  readonly errorCampos = signal(false);
  readonly errorCredenciales = signal(false);

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  login() {

    // LIMPIAR ERRORES
    this.errorCampos.set(false);
    this.errorCredenciales.set(false);

    // VALIDAR CAMPOS VACÍOS
    if (this.username() === '' || this.password() === '') {
      this.errorCampos.set(true);
      return;
    }

    // DATOS QUE ESPERA EL BACKEND
    const datos = {
      usuario: this.username(),
      contrasena: this.password()
    };

    // CONECTAR CON EL BACKEND
    this.authService.login(datos).subscribe({

      next: (respuesta) => {

        // GUARDAR EL TOKEN
        localStorage.setItem(
          'access_token',
          respuesta.access_token
        );

        // GUARDAR ESTADO DEL LOGIN
        localStorage.setItem('loggedIn', 'true');

        // GUARDAR NOMBRE DE USUARIO
        localStorage.setItem(
          'usuario',
          this.username()
        );

        // PROBAR /auth/me
        this.authService.me().subscribe({

          next: (usuario) => {

            console.log(
              'Usuario autenticado:',
              usuario
            );

            this.router.navigate(['/dashboard']);
          },

          error: (error) => {

            console.error(
              'Error en /auth/me:',
              error
            );

          }

        });

      },

      error: (error) => {

        console.error(
          'Error al iniciar sesión:',
          error
        );

        this.errorCredenciales.set(true);
      }

    });
  }
}