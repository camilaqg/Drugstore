import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActualizarUsuario, Usuario } from '../models/usuario';

// Reexportado para no romper a quien importaba `Usuario` desde acá.
export type { Usuario };

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:3000/usuario';

  // Público en el backend: siempre crea rol 'cliente' (lo fuerza el
  // servidor). Lo usa la pantalla de registro; NO la gestión de usuarios.
  crear(usuario: Usuario) {
    return this.http.post<Usuario>(this.apiUrl, usuario);
  }

  // Solo admin en el backend.
  listar() {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  buscarPorId(id: number) {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  // Solo admin. Acepta nombre, correo, rol y opcionalmente contrasena
  // (mínimo 8 caracteres; la hashea el servidor).
  actualizar(id: number, datos: ActualizarUsuario) {
    return this.http.patch<Usuario>(`${this.apiUrl}/${id}`, datos);
  }

  // Solo admin. Devuelve 200 cuando el borrado funcionó.
  eliminar(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
