import { Component, OnInit, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MedicamentoService } from '../../services/medicamento.service';
import { Medicamento } from '../../models/medicamento';
import { CompraService } from '../../services/compra.service';
import { CrearCompra, CrearDetalleCompra } from '../../models/purchase';

// Ítem del detalle de la compra actual. `lineaId` es un id propio de
// línea (no repite el medicamentoId) para que @for no falle con
// NG0955 cuando se agrega dos veces el mismo medicamento.
interface ItemCompra {
  lineaId: number;
  medicamentoId: string;
  nombre: string;
  laboratorio: string;
  cantidad: number;
  precioCompra: number;
  precioVenta: number;
}

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './purchases.html',
  styleUrl: './purchases.css',
  encapsulation: ViewEncapsulation.None
})
export class Purchases implements OnInit {

  private readonly medService = inject(MedicamentoService);
  private readonly compraService = inject(CompraService);
  private readonly router = inject(Router);

  // Catálogo del backend: se recarga después de guardar para que el
  // stock y los precios mostrados reflejen la compra (S7).
  readonly listaMedicamentos = signal<Medicamento[]>([]);
  readonly cargandoCatalogo = signal(false);
  readonly errorCarga = signal<string | null>(null);

  // Productos agregados a la compra actual.
  readonly tablaTemporal = signal<ItemCompra[]>([]);

  // Medicamento elegido en el select, para mostrar su stock.
  readonly medEncontrado = signal<Medicamento | null>(null);

  // Total de la compra (se recalcula solo).
  readonly total = computed(() =>
    this.tablaTemporal().reduce(
      (acc, item) => acc + item.precioCompra * item.cantidad,
      0
    )
  );

  readonly guardando = signal(false);

  // Avisos inline que reemplazan los alert(): error y éxito.
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  // Contador para los ids de línea del detalle.
  private siguienteLineaId = 1;

  // Modelo para el formulario (se queda normal por ngModel).
  newPurchase = {
    date: new Date().toISOString().split('T')[0],
    provider: '',
    invoiceNumber: '',
    medicineId: '',
    quantity: 1,
    purchasePrice: 0,
    salePrice: 0
  };

  ngOnInit(): void {
    this.cargarCatalogo();
  }

  cargarCatalogo(): void {
    this.cargandoCatalogo.set(true);
    this.errorCarga.set(null);

    this.medService.listar().subscribe({
      next: (datos) => {
        this.listaMedicamentos.set(datos);
        this.cargandoCatalogo.set(false);
      },
      error: () => {
        this.cargandoCatalogo.set(false);
        this.errorCarga.set(
          'No se pudo cargar el catálogo de medicamentos. ' +
          'Verifica que el backend esté funcionando.'
        );
      }
    });
  }

  // Busca los datos del medicamento cuando se elige en el select y
  // precarga sus precios actuales del catálogo.
  buscarMed(): void {
    this.limpiarAvisos();

    const med = this.listaMedicamentos().find(
      m => m.id === this.newPurchase.medicineId
    );

    this.medEncontrado.set(med ?? null);

    if (med) {
      this.newPurchase.purchasePrice = med.precioCompra;
      this.newPurchase.salePrice = med.precioVenta;
    }
  }

  // Aviso inline del stock actual del medicamento elegido.
  avisoStock(): string | null {
    const med = this.medEncontrado();

    if (!med) {
      return null;
    }

    if (med.estado === 'Sin stock') {
      return `Stock actual: ${med.stock} unidades. La compra va a incrementar el stock del catálogo.`;
    }

    if (med.estado === 'Bajo stock') {
      return `Bajo stock: hay ${med.stock} unidades. La compra va a incrementar el stock del catálogo.`;
    }

    return `Stock actual: ${med.stock} unidades. La compra va a incrementar el stock del catálogo.`;
  }

  // Valida y agrega el medicamento a la lista de la compra.
  meterALista(): void {
    this.limpiarAvisos();

    const med = this.medEncontrado();

    if (!this.newPurchase.medicineId || !med) {
      this.mostrarError('Selecciona un medicamento del catálogo.');
      return;
    }

    const cantidad = Number(this.newPurchase.quantity);

    if (!Number.isInteger(cantidad) || cantidad < 1) {
      this.mostrarError('La cantidad debe ser un número entero mayor que cero.');
      return;
    }

    const precioCompra = Number(this.newPurchase.purchasePrice);
    const precioVenta = Number(this.newPurchase.salePrice);

    if (!Number.isFinite(precioCompra) || precioCompra < 0 ||
        !Number.isFinite(precioVenta) || precioVenta < 0) {
      this.mostrarError('Los precios no pueden ser negativos.');
      return;
    }

    this.tablaTemporal.update(lista => [
      ...lista,
      {
        lineaId: this.siguienteLineaId++,
        medicamentoId: med.id,
        nombre: med.nombre,
        laboratorio: med.laboratorio,
        cantidad,
        precioCompra,
        precioVenta
      }
    ]);

    // Limpia solo los campos del producto.
    this.newPurchase.medicineId = '';
    this.newPurchase.quantity = 1;
    this.newPurchase.purchasePrice = 0;
    this.newPurchase.salePrice = 0;
    this.medEncontrado.set(null);
  }

  quitarItem(lineaId: number): void {
    this.tablaTemporal.update(
      lista => lista.filter(item => item.lineaId !== lineaId)
    );
  }

  // Valida la cabecera y envía la compra al backend.
  guardarCompra(): void {
    if (this.guardando()) {
      return;
    }

    this.limpiarAvisos();

    const proveedor = this.newPurchase.provider.trim();
    const numeroFactura = this.newPurchase.invoiceNumber.trim();

    if (!proveedor) {
      this.mostrarError('El proveedor es obligatorio.');
      return;
    }

    if (!numeroFactura) {
      this.mostrarError('El número de factura es obligatorio.');
      return;
    }

    if (this.tablaTemporal().length === 0) {
      this.mostrarError('Agrega al menos un producto a la compra.');
      return;
    }

    // El servidor calcula los totales, incrementa el stock y actualiza
    // los precios del catálogo; el cliente solo envía los datos de la
    // cabecera y del detalle.
    const dto: CrearCompra = {
      fecha: this.newPurchase.date,
      proveedor,
      numeroFactura,
      detalles: this.tablaTemporal().map<CrearDetalleCompra>(item => ({
        medicamentoId: item.medicamentoId,
        cantidad: item.cantidad,
        precioCompra: item.precioCompra,
        precioVenta: item.precioVenta
      }))
    };

    this.guardando.set(true);

    this.compraService.crear(dto).subscribe({
      next: (compraGuardada) => {
        this.guardando.set(false);

        // Limpia el formulario y el detalle actual.
        this.tablaTemporal.set([]);
        this.newPurchase.provider = '';
        this.newPurchase.invoiceNumber = '';
        this.newPurchase.medicineId = '';
        this.newPurchase.quantity = 1;
        this.newPurchase.purchasePrice = 0;
        this.newPurchase.salePrice = 0;
        this.medEncontrado.set(null);

        // Recarga el catálogo para que se vea el stock nuevo y los
        // precios actualizados, sin recargar la página.
        this.cargarCatalogo();

        this.mensajeExito.set(
          `Compra ${compraGuardada.numeroFactura} registrada correctamente. ` +
          `Total: $${compraGuardada.total}.`
        );
      },
      error: (error) => {
        this.guardando.set(false);

        console.error('Error al guardar la compra:', error);

        // Fallo de red: no hay respuesta del backend.
        if (error.status === 0) {
          this.mostrarError(
            'No se pudo conectar con el servidor. ' +
            'Verifica tu conexión e inténtalo de nuevo.'
          );
          return;
        }

        // 409 factura duplicada, 404 medicamento inexistente, 403, 400...
        // El mensaje exacto del backend se muestra tal cual.
        const mensaje = error.error?.message;

        this.mostrarError(
          Array.isArray(mensaje)
            ? mensaje.join('\n')
            : (mensaje ?? 'No se pudo guardar la compra. Verifica el backend y los datos.')
        );
      }
    });
  }

  mostrarError(mensaje: string): void {
    this.mensajeExito.set(null);
    this.mensajeError.set(mensaje);
  }

  limpiarAvisos(): void {
    this.mensajeError.set(null);
    this.mensajeExito.set(null);
  }

  regresar() {
    this.router.navigate(['/dashboard']);
  }
}
