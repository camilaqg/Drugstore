import { Component } from '@angular/core';
import { MedicineService } from '../../services/medicine.service';
import { Observable } from 'rxjs';
import { Medicine } from '../../models/medicine';
import { AsyncPipe, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [AsyncPipe, NgFor, FormsModule],
  templateUrl: './inventory.html',
})
export class Inventory {

  medicines$: Observable<Medicine[]>;

  newMedicine: Medicine = {
    id: 0,
    name: '',
    price: 0,
    stock: 0
  };

  constructor(private medicineService: MedicineService) {
    this.medicines$ = this.medicineService.medicines$;
  }
  addMedicine() {
    if (
      this.newMedicine.name &&
      this.newMedicine.price > 0 &&
      this.newMedicine.stock >= 0
    ) {
      this.newMedicine.id = Date.now();

      this.medicineService.addMedicine(this.newMedicine);

      // limpiar formulario
      this.newMedicine = {
        id: 0,
        name: '',
        price: 0,
        stock: 0
      };
    }
  }
}