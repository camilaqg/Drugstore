import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './login.html',
  styleUrl: './login.css' 
})
export class Login {

  username: string = '';
  password: string = '';

  // 
  errorCampos: boolean = false;
  errorCredenciales: boolean = false;

  constructor(private router: Router) {}

  login() {

    //  validar campos vacíos
    if (this.username === '' || this.password === '') {
      this.errorCampos = true;
      this.errorCredenciales = false;
      return;
    }

    // si los campos están llenos
    this.errorCampos = false;

    // 🔹 validar credenciales
    if (this.username === 'admin' && this.password === '1234') {

      this.errorCredenciales = false;
      this.router.navigate(['/dashboard']);

    } else {

      this.errorCredenciales = true;
    }
  }
}