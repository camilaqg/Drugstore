import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Medicine } from '../models/medicine';

@Injectable({
  providedIn: 'root'
})
export class MedicineService {

  private medicines = new BehaviorSubject<Medicine[]>([
    { id: 1, name: 'Paracetamol', price: 2000, stock: 10 },
    { id: 2, name: 'Ibuprofen', price: 3000, stock: 5 }
  ]);

  medicines$ = this.medicines.asObservable();

  addMedicine(medicine: Medicine) {
    const current = this.medicines.value;
    this.medicines.next([...current, medicine]);
  }

  // 👇 ESTE MÉTODO FALTABA
  updateMedicines(medicines: Medicine[]) {
    this.medicines.next(medicines);
  }
}