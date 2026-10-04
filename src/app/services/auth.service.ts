import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginDatos {
  usuario: string;
  contrasena: string;
}

export interface UsuarioActual {
  id: number;
  nombre: string;
  correo: string;
  usuario: string;
  rol: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:3000/auth';

  login(datos: LoginDatos) {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      datos
    );
  }

  me() {
    return this.http.get<UsuarioActual>(
      `${this.apiUrl}/me`
    );
  }
}