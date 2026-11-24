import {Component,OnInit,inject,signal,PLATFORM_ID} from '@angular/core';
import {FormGroup,FormBuilder,Validators,ReactiveFormsModule} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SalesService } from '../../services/sales.service';
import { Medicamento, CrearVenta } from '../../models/sale';

interface ProductoSeleccionado {
  medicamentoId: string;
  Codigo: string;
  Medicamento: string;
  Laboratorio: string;
  Cantidad: number;
  Precio: number;
  Total: number;
}

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './sales.html',
  styleUrls: ['./sales.css']
})
export class SalesComponent implements OnInit {

  private readonly form = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly salesService = inject(SalesService);
  private readonly platformId = inject(PLATFORM_ID);

  // Comprueba si el código se está ejecutando en el navegador.
  private esNavegador(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  FormularioVentas: FormGroup = this.form.group({
    fechaVenta: ['', Validators.required],
    Cliente: ['', Validators.required],
    Factura: ['', Validators.required],
    Codigo: ['', Validators.required],
    Medicamento: ['', Validators.required],
    Laboratorio: ['', Validators.required],
    // Nota: fechaCaducidad se quitó del formulario porque el detalle de
    // venta no tiene ese campo en el backend: nunca se guarda ni se envía.
    Cantidad: [1, [Validators.required, Validators.min(1)]],
    Precio: [0, [Validators.required, Validators.min(1)]],
    Total: [0]
  });

  readonly detalleVenta = signal<ProductoSeleccionado[]>([]);
  // El total local es solo para mostrar en pantalla: la venta la
  // calcula el servidor (recalcula precios, totales y descuenta stock).
  readonly totalGeneral = signal(0);
  readonly ventaConfirmada = signal(false);

  // Avisos inline que reemplazan los alert(): error y éxito.
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);
  // Total que devolvió el servidor tras confirmar la venta.
  readonly totalServidor = signal<number | null>(null);
  // Medicamento elegido en el selector, para mostrar su stock.
  readonly medicamentoSeleccionado = signal<Medicamento | null>(null);

  readonly ventasHoy = signal(0);
  readonly transacciones = signal(0);
  readonly productosVendidos = signal(0);
  readonly ventasMes = signal(0);

  medicamentos: Medicamento[] = [];
  cargandoMedicamentos = false;
  guardandoVenta = false;

  ngOnInit(): void {
    this.cargarEstadisticas();
    this.cargarMedicamentos();
  }

  cargarEstadisticas(): void {
    // localStorage solo existe en el navegador.
    if (!this.esNavegador()) {
      return;
    }

    const data = localStorage.getItem('estadisticasVentas');

    if (!data) {
      return;
    }

    try {
      const stats = JSON.parse(data);

      this.ventasHoy.set(stats.ventasHoy ?? 0);
      this.transacciones.set(stats.transacciones ?? 0);
      this.productosVendidos.set(stats.productosVendidos ?? 0);
      this.ventasMes.set(stats.ventasMes ?? 0);
    } catch {
      console.error('No se pudieron cargar las estadísticas.');
    }
  }

  cargarMedicamentos(): void {
    this.cargandoMedicamentos = true;

    this.salesService.obtenerMedicamentos().subscribe({
      next: (datos) => {
        // Se venden también los de estado "Bajo stock": solo quedan fuera
        // los que no tienen existencias (o los estados SIN stock).
        this.medicamentos = datos.filter(
          medicamento => medicamento.stock > 0
        );

        this.cargandoMedicamentos = false;
      },
      error: (error) => {
        this.cargandoMedicamentos = false;

        console.error('Error al consultar medicamentos:', error);

        this.mostrarError(
          'No se pudieron cargar los medicamentos. ' +
          'Verifica que el backend esté funcionando.'
        );
      }
    });
  }

  // Stock que queda disponible para agregar un medicamento,
  // descontando las unidades ya agregadas en esta venta.
  stockDisponible(medicamento: Medicamento): number {
    const cantidadAgregada = this.detalleVenta()
      .filter(item => item.medicamentoId === medicamento.id)
      .reduce((suma, item) => suma + item.Cantidad, 0);

    return medicamento.stock - cantidadAgregada;
  }

  buscarMedicamento(): void {
    this.limpiarAvisos();

    const codigo = String(
      this.FormularioVentas.get('Codigo')?.value ?? ''
    ).trim();

    const medicamento = this.medicamentos.find(
      item => item.id === codigo
    );

    if (!medicamento) {
      this.mostrarError('No se encontró un medicamento con ese código.');
      this.medicamentoSeleccionado.set(null);
      return;
    }

    if (medicamento.stock <= 0) {
      this.mostrarError('El medicamento no tiene existencias disponibles.');
      this.medicamentoSeleccionado.set(null);
      return;
    }

    this.medicamentoSeleccionado.set(medicamento);

    this.FormularioVentas.patchValue({
      Medicamento: medicamento.nombre,
      Laboratorio: medicamento.laboratorio,
      Precio: medicamento.precioVenta
    });

    this.calcularTotalProducto();
  }

  // Aviso inline del stock disponible del medicamento elegido.
  avisoStockDisponible(): string | null {
    const medicamento = this.medicamentoSeleccionado();

    if (!medicamento) {
      return null;
    }

    if (medicamento.estado === 'Bajo stock') {
      return `Bajo stock: quedan ${this.stockDisponible(medicamento)} unidades disponibles.`;
    }

    return `Stock disponible: ${this.stockDisponible(medicamento)} unidades.`;
  }

  calcularTotalProducto(): void {
    let cantidad = Number(
      this.FormularioVentas.get('Cantidad')?.value
    );

    const precio = Number(
      this.FormularioVentas.get('Precio')?.value
    );

    if (!Number.isFinite(cantidad) || cantidad < 1) {
      cantidad = 1;
      this.FormularioVentas.get('Cantidad')?.setValue(1);
    }

    this.FormularioVentas.patchValue({
      Total: cantidad * precio
    });
  }

  agregarProducto(): void {
    // Validamos los campos del producto, no todo el formulario.
    const codigoControl = this.FormularioVentas.get('Codigo');
    const medicamentoControl = this.FormularioVentas.get('Medicamento');
    const cantidadControl = this.FormularioVentas.get('Cantidad');
    const precioControl = this.FormularioVentas.get('Precio');

    if (
      codigoControl?.invalid ||
      medicamentoControl?.invalid ||
      cantidadControl?.invalid ||
      precioControl?.invalid
    ) {
      codigoControl?.markAsTouched();
      medicamentoControl?.markAsTouched();
      cantidadControl?.markAsTouched();
      precioControl?.markAsTouched();

      this.mostrarError('Busca un medicamento y completa su cantidad.');
      return;
    }

    const data = this.FormularioVentas.getRawValue();
    const codigo = String(data.Codigo).trim();

    const medicamento = this.medicamentos.find(
      item => item.id === codigo
    );

    const cantidad = Number(data.Cantidad);
    const precio = Number(data.Precio);

    if (!medicamento) {
      this.mostrarError('Busca un medicamento válido antes de agregarlo.');
      return;
    }

    if (medicamento.stock <= 0) {
      this.mostrarError('El medicamento no tiene existencias disponibles.');
      return;
    }

    const disponible = this.stockDisponible(medicamento);

    if (!Number.isInteger(cantidad) || cantidad < 1) {
      this.mostrarError('La cantidad debe ser un número entero mayor que cero.');
      return;
    }

    if (cantidad > disponible) {
      this.mostrarError(
        `Solo quedan ${disponible} unidades disponibles de ` +
        medicamento.nombre + ' para esta venta.'
      );
      return;
    }

    if (precio <= 0 || precio !== medicamento.precioVenta) {
      this.mostrarError('El precio no coincide con el precio del medicamento.');
      return;
    }

    const producto: ProductoSeleccionado = {
      medicamentoId: medicamento.id,
      Codigo: medicamento.id,
      Medicamento: medicamento.nombre,
      Laboratorio: medicamento.laboratorio,
      Cantidad: cantidad,
      Precio: precio,
      Total: cantidad * precio
    };

    this.detalleVenta.update(lista => [...lista, producto]);

    this.calcularTotal();
    this.ventaConfirmada.set(false);
    this.limpiarAvisos();

    // Limpiamos solo los campos del producto.
    this.FormularioVentas.patchValue({
      Codigo: '',
      Medicamento: '',
      Laboratorio: '',
      Cantidad: 1,
      Precio: 0,
      Total: 0
    });
  }

  quitarProducto(i: number): void {
    this.detalleVenta.update(
      lista => lista.filter((_, index) => index !== i)
    );

    this.calcularTotal();
    this.ventaConfirmada.set(false);
    this.limpiarAvisos();
  }

  mostrarError(mensaje: string): void {
    this.mensajeExito.set(null);
    this.mensajeError.set(mensaje);
  }

  limpiarAvisos(): void {
    this.mensajeError.set(null);
    this.mensajeExito.set(null);
  }

  calcularTotal(): void {
    this.totalGeneral.set(
      this.detalleVenta().reduce(
        (sum, item) => sum + item.Total,
        0
      )
    );
  }

  confirmarVenta(): void {
    if (this.guardandoVenta) {
      return;
    }

    this.limpiarAvisos();

    const fecha = this.FormularioVentas.get('fechaVenta');
    const cliente = this.FormularioVentas.get('Cliente');
    const factura = this.FormularioVentas.get('Factura');

    if (fecha?.invalid || cliente?.invalid || factura?.invalid) {
      fecha?.markAsTouched();
      cliente?.markAsTouched();
      factura?.markAsTouched();

      this.mostrarError('Completa la fecha, el cliente y la factura.');
      return;
    }

    if (this.detalleVenta().length === 0) {
      this.mostrarError('Agrega al menos un producto a la venta.');
      return;
    }

    const formulario = this.FormularioVentas.getRawValue();

    // El servidor recalcula precio, total y descuenta stock; el
    // usuarioId sale del token JWT. Por eso el cliente solo envía
    // cliente, factura, fecha y el detalle con código y cantidad.
    const datosVenta: CrearVenta = {
      cliente: String(formulario.Cliente).trim(),
      factura: String(formulario.Factura).trim(),
      fecha: formulario.fechaVenta,
      detalles: this.detalleVenta().map(item => ({
        medicamentoId: item.medicamentoId,
        cantidad: item.Cantidad
      }))
    };

    if (
      !datosVenta.fecha ||
      !datosVenta.cliente ||
      !datosVenta.factura
    ) {
      this.mostrarError('La fecha, el cliente y la factura son obligatorios.');
      return;
    }

    this.guardandoVenta = true;

    this.salesService.crearVenta(datosVenta).subscribe({
      next: (ventaGuardada) => {
        this.guardandoVenta = false;

        // Actualizamos las estadísticas en pantalla.
        this.transacciones.update(valor => valor + 1);
        this.ventasHoy.update(valor => valor + ventaGuardada.total);
        this.ventasMes.update(valor => valor + ventaGuardada.total);

        this.detalleVenta().forEach(item => {
          this.productosVendidos.update(
            valor => valor + item.Cantidad
          );
        });

        const estadisticas = {
          ventasHoy: this.ventasHoy(),
          transacciones: this.transacciones(),
          productosVendidos: this.productosVendidos(),
          ventasMes: this.ventasMes()
        };

        // Guardamos estadísticas solo en el navegador.
        if (this.esNavegador()) {
          localStorage.setItem(
            'estadisticasVentas',
            JSON.stringify(estadisticas)
          );
        }

        // El total que se muestra es el que devolvió el servidor.
        this.totalServidor.set(ventaGuardada.total);

        // Punto 7: se limpia el carrito y se recarga el catálogo para
        // que el stock mostrado refleje el descuento (los datos vienen
        // del backend y se mantienen actualizados). ventaConfirmada se
        // vuelve a marcar para que la impresión del comprobante siga
        // funcionando hasta la próxima acción.
        this.limpiarCarrito();
        this.ventaConfirmada.set(true);
        this.cargarMedicamentos();

        this.mensajeExito.set(
          `Venta ${ventaGuardada.factura} registrada correctamente.`
        );
      },
      error: (error) => {
        this.guardandoVenta = false;

        console.error('Error al guardar la venta:', error);

        // Fallo de red: no hay respuesta del backend.
        if (error.status === 0) {
          this.mostrarError(
            'No se pudo conectar con el servidor. ' +
            'Verifica tu conexión e inténtalo de nuevo.'
          );
          return;
        }

        // El resto de errores (409 stock/factura, 404, 403...) llega
        // con el mensaje exacto del backend y se muestra tal cual.
        const mensaje = error.error?.message;

        this.mostrarError(
          Array.isArray(mensaje)
            ? mensaje.join('\n')
            : (mensaje ?? 'No se pudo guardar la venta. Verifica el backend y los datos.')
        );
      }
    });
  }

  imprimirVenta(): void {
    if (!this.ventaConfirmada()) {
      this.mostrarError('Primero debes confirmar la venta.');
      return;
    }

    if (this.esNavegador()) {
      window.print();
      this.limpiarFormulario();
    }
  }

  // Limpia el carrito y los campos del producto sin deshabilitar la
  // impresión (se usa tras confirmar una venta).
  private limpiarCarrito(): void {
    this.FormularioVentas.patchValue({
      Cliente: '',
      Factura: '',
      Codigo: '',
      Medicamento: '',
      Laboratorio: '',
      Cantidad: 1,
      Precio: 0,
      Total: 0
    });

    this.medicamentoSeleccionado.set(null);
    this.detalleVenta.set([]);
    this.totalGeneral.set(0);
  }

  limpiarFormulario(): void {
    this.limpiarCarrito();
    this.totalServidor.set(null);
    this.limpiarAvisos();
    this.FormularioVentas.get('fechaVenta')?.reset('');
    this.ventaConfirmada.set(false);
  }

  salir(): void {
    this.router.navigate(['/dashboard']);
  }
}
