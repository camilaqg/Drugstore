import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Sale } from '../models/sale';

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private _sales = new BehaviorSubject<Sale[]>([]);
  sales$ = this._sales.asObservable();

  addSale(sale: Sale) {
    const current = this._sales.getValue();
    this._sales.next([...current, sale]);
  }
}