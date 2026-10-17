
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
    if (
      this.username().trim() === '' ||
      this.password() === ''
    ) {
      this.errorCampos.set(true);
      return;
    }

    // DATOS QUE ESPERA EL BACKEND
    const datos = {
      usuario: this.username().trim(),
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
          this.username().trim()
        );

        // CONSULTAR LOS DATOS DEL USUARIO AUTENTICADO
        this.authService.me().subscribe({

          next: (usuario) => {

            console.log(
              'Usuario autenticado:',
              usuario
            );

            // GUARDAR EL ROL DEL USUARIO
            localStorage.setItem(
              'rol',
              usuario.rol
            );

            // IR AL DASHBOARD
            this.router.navigate(['/dashboard']);

          },

          error: (error) => {

            console.error(
              'Error en /auth/me:',
              error
            );

            // LIMPIAR LOS DATOS DE LA SESIÓN
            localStorage.removeItem('access_token');
            localStorage.removeItem('loggedIn');
            localStorage.removeItem('usuario');
            localStorage.removeItem('rol');

            // MOSTRAR ERROR DE CREDENCIALES
            this.errorCredenciales.set(true);

          }

        });

      },

      error: (error) => {

        console.error(
          'Error al iniciar sesión:',
          error.error
        );

        console.log(
          'Mensaje del backend:',
          error.error?.message
        );

        this.errorCredenciales.set(true);
      }

    });
  }
}
