import { Component, inject } from '@angular/core';
import { MedicineService } from '../../services/medicine.service';
import { Medicine } from '../../models/medicine';
import { Purchase } from '../../models/purchase';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './purchases.html',
  styleUrl: './purchases.css'
})
export class Purchases {
  private medicineService = inject(MedicineService);

  // Objeto para el formulario basado en el nuevo mockup
  newPurchase: Purchase = {
    id: '',
    date: '',
    provider: '',
    invoiceNumber: '',
    medicineId: '',
    quantity: 0,
    purchasePrice: 0,
    salePrice: 0,
    total: 0
  };

  // Para buscar el medicamento
  medicineFound?: Medicine;

  buscarMedicamento() {
    // Buscamos en el servicio de medicinas usando el ID (string)
    this.medicineService.medicines$.subscribe(medicines => {
      this.medicineFound = medicines.find(m => m.id === this.newPurchase.medicineId);
      if (this.medicineFound) {
        this.newPurchase.purchasePrice = this.medicineFound.purchasePrice;
        this.newPurchase.salePrice = this.medicineFound.salePrice;
      }
    });
  }

  addPurchase() {
    if (this.newPurchase.medicineId && this.newPurchase.quantity > 0) {
      this.newPurchase.total = this.newPurchase.quantity * this.newPurchase.purchasePrice;
      
      // Actualizamos el stock en el inventario
      if (this.medicineFound) {
        this.medicineFound.stock += this.newPurchase.quantity;
        // IMPORTANTE: Usamos el nombre correcto del método que definimos antes
        this.medicineService.updateMedicine(this.medicineFound);
      }

      alert('Compra registrada y stock actualizado');
      this.limpiarForm();
    }
  }

  limpiarForm() {
    this.newPurchase = { id: '', date: '', provider: '', invoiceNumber: '', medicineId: '', quantity: 0, purchasePrice: 0, salePrice: 0, total: 0 };
    this.medicineFound = undefined;
  }
}