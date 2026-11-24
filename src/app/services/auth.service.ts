import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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

  // Rol de autoridad: se completa SOLO con la respuesta de GET /auth/me
  // (backend). Nunca se lee de localStorage para autorizar, porque ahí es
  // manipulable desde las devtools. La copia en localStorage es solo para
  // mostrar en las pantallas.
  private rolAutoridad: string | null = null;

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

  // Guardar el rol confirmado por el backend (respuesta de GET /auth/me)
  recordarRol(rol: string): void {
    this.rolAutoridad = rol;
  }

  // Devuelve el rol confirmado por el backend para decidir el acceso.
  // Si no está en memoria (por ejemplo, después de recargar la página),
  // lo vuelve a pedir a GET /auth/me. Devuelve null si no hay token o
  // si la consulta falla.
  async rolConfirmado(): Promise<string | null> {

    if (this.rolAutoridad !== null) {
      return this.rolAutoridad;
    }

    const token = localStorage.getItem('access_token');

    if (!token) {
      return null;
    }

    try {
      const usuario = await firstValueFrom(this.me());
      this.rolAutoridad = usuario.rol;
      return usuario.rol;
    } catch {
      return null;
    }

  }

  // Camino ÚNICO para cerrar la sesión: borra todas las claves del
  // localStorage, incluido access_token, y limpia el rol de autoridad.
  // Lo usan App (botón "Salir"), el Dashboard y el interceptor.
  cerrarSesion(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');
    this.rolAutoridad = null;
  }
}
