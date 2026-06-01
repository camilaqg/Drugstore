import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Sale } from '../models/sale';

@Injectable({
  providedIn: 'root'
})

export class SalesService {

  // LISTA DE VENTAS
  private _sales = new BehaviorSubject<Sale[]>(this.obtenerVentas());

  // OBSERVABLE
  sales$ = this._sales.asObservable();

  constructor() { }

  // OBTENER VENTAS DESDE LOCALSTORAGE
  obtenerVentas(): Sale[] {

    return JSON.parse(localStorage.getItem('ventas') || '[]');

  }

  // AGREGAR VENTA
  addSale(sale: Sale): void {

    // OBTENER VENTAS ACTUALES
    const current = this.obtenerVentas();

    // AGREGAR NUEVA VENTA
    current.push(sale);

    // GUARDAR EN LOCALSTORAGE
    localStorage.setItem('ventas', JSON.stringify(current));

    // ACTUALIZAR BEHAVIORSUBJECT
    this._sales.next(current);

  }

}