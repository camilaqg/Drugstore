import { environment } from '../../environments/environment';

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrearVenta, Medicamento, Sale } from '../models/sale';

@Injectable({
  providedIn: 'root'
})
export class SalesService {

  private readonly http = inject(HttpClient);

  private readonly apiVentas = `${environment.apiUrl}/venta`;
  private readonly apiMedicamentos = `${environment.apiUrl}/medicamento`;

  obtenerVentas(): Observable<Sale[]> {
    return this.http.get<Sale[]>(this.apiVentas);
  }

  obtenerMedicamentos(): Observable<Medicamento[]> {
    return this.http.get<Medicamento[]>(this.apiMedicamentos);
  }

  crearVenta(datos: CrearVenta): Observable<Sale> {
    return this.http.post<Sale>(this.apiVentas, datos);
  }
}
