import { Component } from '@angular/core';
import { PurchaseService } from '../../services/purchase.service';
import { Purchase } from '../../models/purchase';
import { MedicineService } from '../../services/medicine.service';
import { Medicine } from '../../models/medicine';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './purchases.html',
  styleUrl: './purchases.css',
})
export class Purchases {

  purchases$!: Observable<Purchase[]>; 
  medicines: Medicine[] = [];

  newPurchase: Purchase = {
    id: 0,
    medicineId: 0,
    quantity: 0,
    total: 0,
    date: new Date()
  };

  constructor(
    private purchaseService: PurchaseService,
    private medicineService: MedicineService
  ) {
    this.purchases$ = this.purchaseService.purchases$; // 👈 aquí correcto
    this.medicineService.medicines$.subscribe(data => this.medicines = data);
  }

  addPurchase() {
    if (this.newPurchase.medicineId && this.newPurchase.quantity > 0) {

      const medicine = this.medicines.find(m => m.id === this.newPurchase.medicineId);

      if (medicine) {
        this.newPurchase.total = medicine.price * this.newPurchase.quantity;
        this.newPurchase.id = Date.now();
        this.newPurchase.date = new Date();

        this.purchaseService.addPurchase({ ...this.newPurchase });

        // 📦 SUMAR STOCK
        medicine.stock += this.newPurchase.quantity;
        this.medicineService.updateMedicines(this.medicines);

        // 🔄 reset
        this.newPurchase = {
          id: 0,
          medicineId: 0,
          quantity: 0,
          total: 0,
          date: new Date()
        };
      }
    }
  }

  getMedicineName(id: number) {
    const med = this.medicines.find(m => m.id === id);
    return med ? med.name : 'Desconocido';
  }
}