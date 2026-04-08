import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Medicine } from '../models/medicine';

@Injectable({ providedIn: 'root' })
export class MedicineService {
  
  private initialMedicines: Medicine[] = [
    { id: 'MED-001', name: 'Ibuprofeno 400mg', laboratory: 'Genfar', description: 'Analgésico', stock: 120, purchasePrice: 2500, salePrice: 3800, status: 'Activo' },
    { id: 'MED-002', name: 'Acetaminofén 500mg', laboratory: 'Bayer', description: 'Antipirético', stock: 15, purchasePrice: 1200, salePrice: 1900, status: 'Bajo stock' },
    { id: 'MED-003', name: 'Amoxicilina 500mg', laboratory: 'MK', description: 'Antibiótico', stock: 0, purchasePrice: 4800, salePrice: 7200, status: 'Sin stock' }
  ];

  private medicines = new BehaviorSubject<Medicine[]>(this.initialMedicines);
  medicines$ = this.medicines.asObservable();

  //crud 
  // medicamentos agregado 
  addMedicine(medicine: Medicine) {
    const current = this.medicines.value;
    
    // calcula el estado antes de guardar 
    medicine.status = this.calcularEstado(medicine.stock);
    
    this.medicines.next([...current, medicine]);
  }

  // -eliminar 
  deleteMedicine(id: string) {
    const current = this.medicines.value;
    const updated = current.filter(m => m.id !== id);
    this.medicines.next(updated);
  }

  // modifica pero se debe seleccionar 
  updateMedicine(updatedMedicine: Medicine) {
    const current = this.medicines.value;
    updatedMedicine.status = this.calcularEstado(updatedMedicine.stock);
    
    const index = current.findIndex(m => m.id === updatedMedicine.id);
    if (index !== -1) {
      current[index] = updatedMedicine;
      this.medicines.next([...current]);
    }
  }


  private calcularEstado(stock: number): 'Activo' | 'Bajo stock' | 'Sin stock' {
    if (stock === 0) return 'Sin stock';
    if (stock < 20) return 'Bajo stock';
    return 'Activo';
  }
}