import { Component } from '@angular/core';
import { SalesService } from '../../services/sales.service';
import { Sale } from '../../models/sale';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './sales.html',
})
export class Sales {

  sales$: Observable<Sale[]>;

  newSale: Sale = {
    id: 0,
    medicineId: 0,
    quantity: 0,
    total: 0,
    date: new Date()
  };

  constructor(private salesService: SalesService) {
    this.sales$ = this.salesService.sales$;
  }

  addSale() {
    if (this.newSale.medicineId > 0 && this.newSale.quantity > 0) {
      this.newSale.id = Date.now();
      this.newSale.total = this.newSale.quantity;
      this.newSale.date = new Date();

      this.salesService.addSale(this.newSale);

      this.newSale = {
        id: 0,
        medicineId: 0,
        quantity: 0,
        total: 0,
        date: new Date()
      };
    }
  }
}