import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  FiltrosMedicamento,
  Medicamento,
  MedicamentoFormulario,
} from '../models/medicamento';

// Reemplazo del MedicineService en memoria (Fase 2). Ese servicio NO se
// borra todavía porque pages/purchases/purchases.ts depende de él; se
// elimina en la Fase 4.
@Injectable({
  providedIn: 'root'
})
export class MedicamentoService {

  private readonly http = inject(HttpClient);

  // Misma convención hardcodeada que el resto de los servicios; sin
  // environment por decisión de esta fase.
  private readonly apiUrl = 'http://localhost:3000/medicamento';

  // GET /medicamento exige token de cualquier rol (lo agrega el interceptor).
  listar(filtros?: FiltrosMedicamento): Observable<Medicamento[]> {
    let params = new HttpParams();

    if (filtros?.nombre) {
      params = params.set('nombre', filtros.nombre);
    }
    if (filtros?.laboratorio) {
      params = params.set('laboratorio', filtros.laboratorio);
    }
    if (filtros?.estado) {
      params = params.set('estado', filtros.estado);
    }

    return this.http.get<Medicamento[]>(this.apiUrl, { params });
  }

  buscarPorId(id: string): Observable<Medicamento> {
    return this.http.get<Medicamento>(`${this.apiUrl}/${id}`);
  }

  // POST /medicamento exige rol admin. El cuerpo NO lleva `estado`.
  crear(dto: MedicamentoFormulario): Observable<Medicamento> {
    return this.http.post<Medicamento>(this.apiUrl, dto);
  }

  // PATCH /medicamento/:id exige rol admin. Enviamos solo los campos
  // modificables (sin el id, que es la clave y no cambia, y sin `estado`,
  // que deriva el servidor).
  actualizar(
    id: string,
    dto: Omit<MedicamentoFormulario, 'id'>
  ): Observable<Medicamento> {
    return this.http.patch<Medicamento>(`${this.apiUrl}/${id}`, dto);
  }

  // DELETE /medicamento/:id exige rol admin. Responde 204 sin cuerpo.
  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
