import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

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
  readonly errorServidor = signal(false);

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  login(): void {

    this.errorCampos.set(false);
    this.errorCredenciales.set(false);
    this.errorServidor.set(false);

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

            // Confirmar ante el AuthService el rol que devolvió el
            // backend (es el que autoriza, ver role.guard.ts)
            this.authService.recordarRol(usuario.rol);

            // Guardar el rol en localStorage: SOLO para mostrar en
            // las pantallas, nunca para autorizar
            localStorage.setItem(
              'rol',
              usuario.rol
            );

            // Ir al Dashboard
            this.router.navigate(['/dashboard']);

          },

          error: () => {

            // Limpiar los datos de la sesión (token incluido)
            this.authService.cerrarSesion();

            // Si falla /auth/me después de un login exitoso, no son
            // credenciales inválidas: es un problema del servidor o
            // de conexión (el caso 401 de sesión vencida lo REDIRIGE
            // y limpia el interceptor)
            this.errorServidor.set(true);

          }

        });

      },

      error: (error: unknown) => {

        // Distinguir credenciales inválidas (401 del backend) de un
        // problema de conexión o del servidor
        if (
          error instanceof HttpErrorResponse &&
          error.status === 401
        ) {
          this.errorCredenciales.set(true);
        } else {
          this.errorServidor.set(true);
        }

      }

    });
  }
}
