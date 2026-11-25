import { environment } from '../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Compra, CrearCompra } from '../models/purchase';

// Servicio HTTP de compras contra el backend (Fase 4). Los endpoints
// de /detalle-compra que mutan ya no existen: el detalle viaja dentro
// de la compra (S6).
@Injectable({
  providedIn: 'root'
})
export class CompraService {

  private readonly http = inject(HttpClient);

  // URL del backend centralizada en environments.
  private readonly apiUrl = `${environment.apiUrl}/compra`;

  // GET /compra exige token de cualquier rol (lo agrega el interceptor)
  // y devuelve las compras con sus detalles.
  listar(): Observable<Compra[]> {
    return this.http.get<Compra[]>(this.apiUrl);
  }

  buscarPorId(id: number): Observable<Compra> {
    return this.http.get<Compra>(`${this.apiUrl}/${id}`);
  }

  // POST /compra exige rol admin. Corre en transacción en el backend:
  // incrementa el stock, actualiza precioCompra/precioVenta del
  // catálogo y calcula los totales (el total del cliente se ignora).
  crear(dto: CrearCompra): Observable<Compra> {
    return this.http.post<Compra>(this.apiUrl, dto);
  }

  // DELETE /compra/:id exige rol admin. Descuenta el stock y puede
  // responder 409 si parte de la compra ya se vendió. Responde 204
  // sin cuerpo.
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
