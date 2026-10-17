import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Medicine } from '../models/medicine';

@Injectable({ providedIn: 'root' })
export class MedicineService {

  // estado privado: solo el servicio lo modifica
  private readonly _medicines = signal<Medicine[]>([
    { id: 'MED-001', name: 'Ibuprofeno 400mg', laboratory: 'Genfar', description: 'Analgésico', stock: 120, purchasePrice: 2500, salePrice: 3800, status: 'Activo' },
    { id: 'MED-002', name: 'Acetaminofén 500mg', laboratory: 'Bayer', description: 'Antipirético', stock: 15, purchasePrice: 1200, salePrice: 1900, status: 'Bajo stock' },
    { id: 'MED-003', name: 'Amoxicilina 500mg', laboratory: 'MK', description: 'Antibiótico', stock: 0, purchasePrice: 4800, salePrice: 7200, status: 'Sin stock' }
  ]);

  // los demás solo pueden leerla (forma nueva)
  readonly medicines = this._medicines.asReadonly();

  // se mantiene para no romper los archivos que aún usan medicines$
  readonly medicines$ = toObservable(this.medicines);

  // CRUD

  // agregar medicamento
  addMedicine(medicine: Medicine) {
    const nuevo = { ...medicine, status: this.calcularEstado(medicine.stock) };
    this._medicines.update(current => [...current, nuevo]);
  }

  // eliminar
  deleteMedicine(id: string) {
    this._medicines.update(current => current.filter(m => m.id !== id));
  }

  // modificar (se debe seleccionar primero)
  updateMedicine(updatedMedicine: Medicine) {
    const actualizado = {
      ...updatedMedicine,
      status: this.calcularEstado(updatedMedicine.stock)
    };
    this._medicines.update(current =>
      current.map(m => (m.id === actualizado.id ? actualizado : m))
    );
  }

  private calcularEstado(stock: number): 'Activo' | 'Bajo stock' | 'Sin stock' {
    if (stock === 0) return 'Sin stock';
    if (stock < 20) return 'Bajo stock';
    return 'Activo';
  }
}