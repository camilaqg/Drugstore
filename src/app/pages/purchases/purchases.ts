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
    date: new Date().toISOString().split('T')[0],
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

    this.medEncontrado = this.listaMedicamentos.find(
      m => m.id === this.newPurchase.medicineId
    );

    if (this.medEncontrado) {

      this.newPurchase.purchasePrice =
        this.medEncontrado.purchasePrice;

      this.newPurchase.salePrice =
        this.medEncontrado.salePrice;

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
this.tablaTemporal.push({

  ...this.newPurchase,

  nombre: this.medEncontrado?.name,

  laboratorio: this.medEncontrado?.laboratory

});
    } else {

      alert('Debe seleccionar producto');

    }

  }

  // procesa la compra y actualiza el inventario
  guardarCompra() {

    if (this.tablaTemporal.length > 0) {

      // ACTUALIZAR STOCK
      this.tablaTemporal.forEach(item => {

        let m = this.listaMedicamentos.find(
          aux => aux.id === item.medicineId
        );

        if (m) {

          // sumo lo que compre al stock que ya habia
          const actualizado = {
            ...m,
            stock: m.stock + item.quantity
          };

          this.medService.updateMedicine(actualizado);

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

        productos: this.tablaTemporal,

        total: this.tablaTemporal.reduce(
          (acc, item) =>
            acc + (item.purchasePrice * item.quantity),
          0
        )

      };


      // GUARDAR COMPRA
      comprasGuardadas.push(nuevaCompra);


      localStorage.setItem(
        'compras',
        JSON.stringify(comprasGuardadas)
      );


      // LIMPIAR TABLA
      this.tablaTemporal = [];


    } else {

      alert('La tabla de detalle esta vacia');

    }

  }


  // METODO DEL BOTON DEL CARRITO
  guardarCompraConMensaje() {

    if (this.tablaTemporal.length > 0) {

      this.guardarCompra();

      alert('✅ Compra guardada exitosamente');

    } else {

      alert('⚠️ No hay productos en el carrito');

    }

  }


  // metodos auxiliares para mostrar texto en la tabla
  obtenerNombre(id: string) {

    return this.listaMedicamentos.find(
      m => m.id === id
    )?.name || '---';

  }

  obtenerLab(id: string) {

    return this.listaMedicamentos.find(
      m => m.id === id
    )?.laboratory || '---';

  }

  obtenerDesc(id: string) {

    return this.listaMedicamentos.find(
      m => m.id === id
    )?.description || '---';

  }

  regresar() {

    this.router.navigate(['/dashboard']);

  }

  salir() {

    this.router.navigate(['/dashboard']);

  }

}