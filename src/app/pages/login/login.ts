import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
})
export class Login {

  username: string = '';
  password: string = '';
  error: boolean = false;

  constructor(private router: Router) {}

  login() {
    if (this.username === 'admin' && this.password === '1234') {
      this.error = false;
      this.router.navigate(['/dashboard']);
    } else {
      this.error = true;
    }
  }
}