import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MedicineService } from '../../services/medicine.service';
import { Medicine } from '../../models/medicine';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css'
})
export class Inventory {

  // llamamos al servicio y al router
  private readonly servicio = inject(MedicineService);
  private readonly router = inject(Router);

  // lista completa que viene del servicio
  readonly medicamentos = signal<Medicine[]>([]);

  // texto que se escribe en el buscador
  readonly filtro = signal('');

  // lista que se muestra en la tabla (se recalcula sola)
  readonly listaMeds = computed(() => {
    const texto = this.filtro().toLowerCase();
    return this.medicamentos().filter(m =>
      m.name.toLowerCase().includes(texto) ||
      m.id.toLowerCase().includes(texto)
    );
  });

  // objeto para limpiar o llenar el formulario (se queda normal por ngModel)
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
    // nos traemos los datos del servicio apenas cargue la pagina
    this.servicio.medicines$
      .pipe(takeUntilDestroyed())
      .subscribe(datos => this.medicamentos.set(datos));
  }

  // genera un codigo aleatorio para el producto
  generarId() {
    return 'MED-' + Math.floor(Math.random() * 500);
  }

  // este es el que llamas en el boton Registrar
  registrar() {
    if (this.newMedicine.name != '') {
      // le ponemos un id antes de guardar
      this.newMedicine.id = this.generarId();
      this.servicio.addMedicine({ ...this.newMedicine });

      alert('Guardado con exito');
      this.limpiar();
    } else {
      alert('El nombre no puede estar vacio');
    }
  }

  // cuando haces clic en la fila de la tabla
  seleccionar(m: Medicine) {
    this.newMedicine = { ...m };
  }

  // este es el del boton Modificar
  actualizar() {
    if (this.newMedicine.id) {
      this.servicio.updateMedicine({ ...this.newMedicine });
      alert('Se actualizaron los datos');
      this.limpiar();
    }
  }

  // este es el del boton Eliminar
  borrar() {
    if (this.newMedicine.id) {
      if (confirm('¿Desea borrar este medicamento?')) {
        this.servicio.deleteMedicine(this.newMedicine.id);
        this.limpiar();
      }
    } else {
      alert('Primero seleccione un producto de la tabla');
    }
  }

  // para el buscador
  buscar(event: Event) {
    const input = event.target as HTMLInputElement;
    this.filtro.set(input.value);
  }

  // limpia los cuadros de texto
  limpiar() {
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

  // boton Salir
  irAlMenu() {
    this.router.navigate(['/dashboard']);
  }

  salir() {
    this.router.navigate(['/dashboard']);
  }
}