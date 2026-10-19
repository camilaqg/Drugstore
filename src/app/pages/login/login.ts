
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

  login(): void {

    this.errorCampos.set(false);
    this.errorCredenciales.set(false);

    // Validar campos vacíos
    if (
      this.username().trim() === '' ||
      this.password() === ''
    ) {
      this.errorCampos.set(true);
      return;
    }

    // Datos que espera el backend
    const datos = {
      usuario: this.username().trim(),
      contrasena: this.password()
    };

    // Iniciar sesión
    this.authService.login(datos).subscribe({

      next: (respuesta) => {

        // Guardar el token
        localStorage.setItem(
          'access_token',
          respuesta.access_token
        );

        // Guardar estado del login
        localStorage.setItem('loggedIn', 'true');

        // Guardar nombre de usuario
        localStorage.setItem(
          'usuario',
          this.username().trim()
        );

        // Consultar datos del usuario autenticado
        this.authService.me().subscribe({

          next: (usuario) => {

            // Guardar el rol del usuario
            localStorage.setItem(
              'rol',
              usuario.rol
            );

            // Ir al Dashboard
            this.router.navigate(['/dashboard']);

          },

          error: () => {

            // Limpiar los datos de la sesión
            localStorage.removeItem('access_token');
            localStorage.removeItem('loggedIn');
            localStorage.removeItem('usuario');
            localStorage.removeItem('rol');

            this.errorCredenciales.set(true);

          }

        });

      },

      error: () => {

        // Mostrar error sin imprimir información en consola
        this.errorCredenciales.set(true);

      }

    });
  }
}
