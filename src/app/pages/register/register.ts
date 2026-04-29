import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {

  name = '';
  email = '';
  username = '';
  password = '';
  confirmPassword = '';

  constructor(private router: Router) { }

  register() {

    // VALIDAR CAMPOS VACÍOS
    if (!this.name || !this.email || !this.username || !this.password || !this.confirmPassword) {
      alert('Todos los campos son obligatorios');
      return;
    }

    // VALIDAR LONGITUD DE CONTRASEÑA
    if (this.password.length < 6) {
      alert('La contraseña debe tener mínimo 6 caracteres');
      return;
    }

    // VALIDAR QUE COINCIDAN
    if (this.password !== this.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    // GUARDAR USUARIO
    const user = {
      name: this.name,
      email: this.email,
      username: this.username,
      password: this.password
    };

    localStorage.setItem('user', JSON.stringify(user));

    alert('Usuario registrado correctamente');

    // REDIRIGIR AL LOGIN
    this.router.navigate(['/login']);
  }
}