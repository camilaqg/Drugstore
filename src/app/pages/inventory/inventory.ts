import { Component, inject } from '@angular/core';
import { MedicineService } from '../../services/medicine.service';
import { Observable } from 'rxjs';
import { Medicine } from '../../models/medicine';
import { AsyncPipe, NgFor, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [AsyncPipe, NgFor, FormsModule, CommonModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css' 
})
export class Inventory {

  // servicio donde se guardan los medicamentos
  private medicineService = inject(MedicineService);

  // router para moverse entre paginas
  private router = inject(Router);

  // lista de medicamentos en tiempo real
  medicines$: Observable<Medicine[]>;

  // objeto para el formulario
  newMedicine: Medicine = {
    id: '',
    name: '',
    laboratory: '',
    description: '',
    stock: 0,
    purchasePrice: 0,
    salePrice: 0
  };

  constructor() {
    // se conecta con el servicio
    this.medicines$ = this.medicineService.medicines$;
  }

  // registrar producto
  addMedicine() {
    // valida que tenga datos basicos
    if (this.newMedicine.name && this.newMedicine.salePrice >= 0) {

      // genera id si no existe
      if (!this.newMedicine.id) {
        this.newMedicine.id = 'MED-' + Math.floor(Math.random() * 1000);
      }

      // guarda el producto
      this.medicineService.addMedicine({ ...this.newMedicine });

      // limpia formulario
      this.limpiarForm();

    } else {
      alert('Ingrese el nombre y el precio');
    }
  }

  // cargar datos de la tabla al formulario
  seleccionarMed(med: Medicine) {
    // copia para no modificar directo la lista
    this.newMedicine = { ...med };
  }

  // eliminar producto
  eliminarMed() {
    if (this.newMedicine.id) {

      // confirmacion simple
      if (confirm('Seguro que desea eliminar este producto')) {
        this.medicineService.deleteMedicine(this.newMedicine.id);
        this.limpiarForm();
      }

    } else {
      alert('Seleccione un producto');
    }
  }

  // modificar producto
  modificarMed() {
    if (this.newMedicine.id) {

      // actualiza datos
      this.medicineService.updateMedicine({ ...this.newMedicine });

      alert('Producto actualizado');
      this.limpiarForm();

    } else {
      alert('Seleccione un producto');
    }
  }

  // limpiar formulario
  limpiarForm() {
    this.newMedicine = {
      id: '',
      name: '',
      laboratory: '',
      description: '',
      stock: 0,
      purchasePrice: 0,
      salePrice: 0
    };
  }

  // volver al dashboard
  salir() {
    this.router.navigate(['/dashboard']);
  }
}