import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {

  readonly name = signal('');
  readonly email = signal('');
  readonly username = signal('');
  readonly password = signal('');
  readonly confirmPassword = signal('');

  private readonly router = inject(Router);
  private readonly usuarioService = inject(UsuarioService);

  register() {

    if (
      !this.name() ||
      !this.email() ||
      !this.username() ||
      !this.password() ||
      !this.confirmPassword()
    ) {
      alert('Todos los campos son obligatorios');
      return;
    }

    if (this.password().length < 8) {
      alert('La contraseña debe tener mínimo 8 caracteres');
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      alert('Las contraseñas no coinciden');
      return;
    }

    const usuario = {
      nombre: this.name(),
      correo: this.email(),
      usuario: this.username(),
      contrasena: this.password(),
      rol: 'cliente'
    };

    this.usuarioService.crear(usuario).subscribe({
      next: () => {
        alert('Usuario registrado correctamente');

        this.router.navigate(['/login']);
      },

      error: (error) => {
        console.error('Error al registrar usuario:', error);

        alert('No se pudo registrar el usuario');
      }
    });
  }
}