import { Component, inject, ViewEncapsulation } from '@angular/core';
import { MedicineService } from '../../services/medicine.service';
import { Medicine } from '../../models/medicine';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './purchases.html',
  styleUrl: './purchases.css',
  encapsulation: ViewEncapsulation.None
})
export class Purchases {
  private medService = inject(MedicineService);
  private router = inject(Router);

  // variables globales del componente
  tablaTemporal: any[] = [];
  listaMedicamentos: Medicine[] = [];
  medEncontrado?: Medicine;

  // modelo para el formulario
  newPurchase: any = {
    date: '',
    provider: '',
    invoiceNumber: '',
    medicineId: '',
    quantity: 0,
    purchasePrice: 0,
    salePrice: 0
  };

  constructor() {
    // para tener los medicamentos actualizados
    this.medService.medicines$.subscribe(data => {
      this.listaMedicamentos = data;
    });
  }

  // busca los datos cuando se elige en el select
  buscarMed() {
    this.medEncontrado = this.listaMedicamentos.find(m => m.id === this.newPurchase.medicineId);
    
    if (this.medEncontrado) {
      this.newPurchase.purchasePrice = this.medEncontrado.purchasePrice;
      this.newPurchase.salePrice = this.medEncontrado.salePrice;
    }
  }

  // mete el registro a la tabla de abajo
  meterALista() {
    if (this.newPurchase.medicineId != '' && this.newPurchase.quantity > 0) {
      this.tablaTemporal.push({ ...this.newPurchase });
      
      // limpio solo los datos del medicamento para agregar otro
      this.newPurchase.medicineId = '';
      this.newPurchase.quantity = 0;
      this.medEncontrado = undefined;
    } else {
      alert('Debe seleccionar producto y cantidad');
    }
  }

  // procesa la compra y actualiza el inventario
  guardarCompra() {
    if (this.tablaTemporal.length > 0) {
      this.tablaTemporal.forEach(item => {
        let m = this.listaMedicamentos.find(aux => aux.id === item.medicineId);
        if (m) {
          // sumo lo que compre al stock que ya habia
          m.stock = m.stock + item.quantity;
          this.medService.updateMedicine(m);
        }
      });
      alert('Se registro la compra correctamente');
      this.tablaTemporal = []; 
    } else {
      alert('La tabla de detalle esta vacia');
    }
  }

  // metodos auxiliares para mostrar texto en la tabla
  obtenerNombre(id: string) { return this.listaMedicamentos.find(m => m.id === id)?.name || '---'; }
  obtenerLab(id: string) { return this.listaMedicamentos.find(m => m.id === id)?.laboratory || '---'; }
  obtenerDesc(id: string) { return this.listaMedicamentos.find(m => m.id === id)?.description || '---'; }

  regresar() {
    this.router.navigate(['/dashboard']);
  }
 
  salir() {
    this.router.navigate(['/dashboard']);
  }
}