import { Component, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MedicineService } from '../../services/medicine.service';
import { Medicine } from '../../models/medicine';

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './purchases.html',
  styleUrl: './purchases.css',
  encapsulation: ViewEncapsulation.None
})
export class Purchases {

  private readonly medService = inject(MedicineService);
  private readonly router = inject(Router);

  // productos agregados a la compra actual
  readonly tablaTemporal = signal<any[]>([]);

  // medicamentos del servicio (siempre actualizados, sin subscribe)
  readonly listaMedicamentos = this.medService.medicines;

  // medicamento elegido en el select
  readonly medEncontrado = signal<Medicine | undefined>(undefined);

  // total de la compra (se recalcula solo)
  readonly total = computed(() =>
    this.tablaTemporal().reduce(
      (acc, item) => acc + item.purchasePrice * item.quantity,
      0
    )
  );

  // modelo para el formulario (se queda normal por ngModel)
  newPurchase: any = {
    date: new Date().toISOString().split('T')[0],
    provider: '',
    invoiceNumber: '',
    medicineId: '',
    quantity: 0,
    purchasePrice: 0,
    salePrice: 0
  };

  // busca los datos cuando se elige en el select
  buscarMed() {
    const med = this.listaMedicamentos().find(
      m => m.id === this.newPurchase.medicineId
    );

    this.medEncontrado.set(med);

    if (med) {
      this.newPurchase.purchasePrice = med.purchasePrice;
      this.newPurchase.salePrice = med.salePrice;
    }
  }

  // mete el registro a la tabla de abajo
  meterALista() {
    if (
      this.newPurchase.purchasePrice < 0 ||
      this.newPurchase.salePrice < 0
    ) {
      alert('Los precios no pueden ser negativos');
      return;
    }

    if (this.newPurchase.quantity <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    if (this.newPurchase.medicineId != '') {
      this.tablaTemporal.update(lista => [
        ...lista,
        {
          ...this.newPurchase,
          nombre: this.medEncontrado()?.name,
          laboratorio: this.medEncontrado()?.laboratory
        }
      ]);
    } else {
      alert('Debe seleccionar producto');
    }
  }

  // procesa la compra y actualiza el inventario
  guardarCompra() {
    const items = this.tablaTemporal();

    if (items.length > 0) {

      // ACTUALIZAR STOCK
      items.forEach(item => {
        const m = this.listaMedicamentos().find(
          aux => aux.id === item.medicineId
        );

        if (m) {
          // sumo lo que compré al stock que ya había
          this.medService.updateMedicine({
            ...m,
            stock: m.stock + item.quantity
          });
        }
      });

      // OBTENER COMPRAS GUARDADAS
      const comprasGuardadas =
        JSON.parse(localStorage.getItem('compras') || '[]');

      // CREAR NUEVA COMPRA
      const nuevaCompra = {
        fecha: this.newPurchase.date,
        proveedor: this.newPurchase.provider,
        factura: this.newPurchase.invoiceNumber,
        productos: items,
        total: this.total()
      };

      // GUARDAR COMPRA
      comprasGuardadas.push(nuevaCompra);

      localStorage.setItem(
        'compras',
        JSON.stringify(comprasGuardadas)
      );

      // LIMPIAR TABLA
      this.tablaTemporal.set([]);

    } else {
      alert('La tabla de detalle esta vacia');
    }
  }

  // METODO DEL BOTON DEL CARRITO
  guardarCompraConMensaje() {
    if (this.tablaTemporal().length > 0) {
      this.guardarCompra();
      alert(' Compra guardada exitosamente');
    } else {
      alert(' No hay productos en el carrito');
    }
  }

  // metodos auxiliares para mostrar texto en la tabla
  obtenerNombre(id: string) {
    return this.listaMedicamentos().find(m => m.id === id)?.name || '---';
  }

  obtenerLab(id: string) {
    return this.listaMedicamentos().find(m => m.id === id)?.laboratory || '---';
  }

  obtenerDesc(id: string) {
    return this.listaMedicamentos().find(m => m.id === id)?.description || '---';
  }

  regresar() {
    this.router.navigate(['/dashboard']);
  }

  salir() {
    this.router.navigate(['/dashboard']);
  }
}