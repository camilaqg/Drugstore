import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Usuario {
  id?: number;
  nombre: string;
  correo: string;
  usuario: string;
  rol: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:3000/usuario';

  crear(usuario: Usuario) {
    return this.http.post<Usuario>(this.apiUrl, usuario);
  }

  listar() {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  buscarPorId(id: number) {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }
}