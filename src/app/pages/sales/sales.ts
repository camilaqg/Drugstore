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
    fechaCaducidad: [''],
    Cantidad: [1, [Validators.required, Validators.min(1)]],
    Precio: [0, [Validators.required, Validators.min(1)]],
    Total: [0]
  });

  readonly detalleVenta = signal<ProductoSeleccionado[]>([]);
  readonly totalGeneral = signal(0);
  readonly ventaConfirmada = signal(false);

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
        this.medicamentos = datos.filter(
          medicamento => medicamento.estado === 'Activo'
        );

        this.cargandoMedicamentos = false;
      },
      error: (error) => {
        this.cargandoMedicamentos = false;

        console.error('Error al consultar medicamentos:', error);

        if (this.esNavegador()) {
          alert(
            'No se pudieron cargar los medicamentos. ' +
            'Verifica que el backend esté funcionando.'
          );
        }
      }
    });
  }

  buscarMedicamento(): void {
    const codigo = String(
      this.FormularioVentas.get('Codigo')?.value ?? ''
    ).trim();

    const medicamento = this.medicamentos.find(
      item => item.id === codigo
    );

    if (!medicamento) {
      alert('No se encontró un medicamento con ese código.');
      return;
    }

    if (medicamento.estado !== 'Activo') {
      alert('El medicamento no está activo.');
      return;
    }

    if (medicamento.stock <= 0) {
      alert('El medicamento no tiene existencias disponibles.');
      return;
    }

    this.FormularioVentas.patchValue({
      Medicamento: medicamento.nombre,
      Laboratorio: medicamento.laboratorio,
      Precio: medicamento.precioVenta
    });

    this.calcularTotalProducto();
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

      alert('Busca un medicamento y completa su cantidad.');
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
      alert('Busca un medicamento válido antes de agregarlo.');
      return;
    }

    if (medicamento.estado !== 'Activo') {
      alert('El medicamento no está activo.');
      return;
    }

    // Descuenta del stock disponible las unidades ya agregadas
    // en esta venta, para evitar superar las existencias.
    const cantidadAgregada = this.detalleVenta()
      .filter(item => item.medicamentoId === medicamento.id)
      .reduce((suma, item) => suma + item.Cantidad, 0);

    const disponible = medicamento.stock - cantidadAgregada;

    if (!Number.isInteger(cantidad) || cantidad < 1) {
      alert('La cantidad debe ser un número entero mayor que cero.');
      return;
    }

    if (cantidad > disponible) {
      alert(
        `Solo quedan ${disponible} unidades disponibles de ` +
        medicamento.nombre + ' para esta venta.'
      );
      return;
    }

    if (precio <= 0 || precio !== medicamento.precioVenta) {
      alert('El precio no coincide con el precio del medicamento.');
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

    const fecha = this.FormularioVentas.get('fechaVenta');
    const cliente = this.FormularioVentas.get('Cliente');
    const factura = this.FormularioVentas.get('Factura');

    if (fecha?.invalid || cliente?.invalid || factura?.invalid) {
      fecha?.markAsTouched();
      cliente?.markAsTouched();
      factura?.markAsTouched();

      alert('Completa la fecha, el cliente y la factura.');
      return;
    }

    if (this.detalleVenta().length === 0) {
      alert('Agrega al menos un producto a la venta.');
      return;
    }

    const formulario = this.FormularioVentas.getRawValue();

    const datosVenta: CrearVenta = {
      cliente: String(formulario.Cliente).trim(),
      factura: String(formulario.Factura).trim(),
      fecha: formulario.fechaVenta,
      total: this.totalGeneral(),
      detalles: this.detalleVenta().map(item => ({
        medicamentoId: item.medicamentoId,
        cantidad: item.Cantidad,
        precio: item.Precio,
        total: item.Total
      }))
    };

    if (
      !datosVenta.fecha ||
      !datosVenta.cliente ||
      !datosVenta.factura
    ) {
      alert('La fecha, el cliente y la factura son obligatorios.');
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

        this.ventaConfirmada.set(true);

        alert(
          `Venta ${ventaGuardada.factura} guardada correctamente.`
        );
      },
      error: (error) => {
        this.guardandoVenta = false;

        console.error('Error al guardar la venta:', error);

        const mensaje =
          error.error?.message ??
          'No se pudo guardar la venta. Verifica el backend y los datos.';

        alert(
          Array.isArray(mensaje) ? mensaje.join('\n') : mensaje
        );
      }
    });
  }

  imprimirVenta(): void {
    if (!this.ventaConfirmada()) {
      alert('Primero debes confirmar la venta.');
      return;
    }

    if (this.esNavegador()) {
      window.print();
      this.limpiarFormulario();
    }
  }

  limpiarFormulario(): void {
    this.FormularioVentas.reset({
      fechaVenta: '',
      Cliente: '',
      Factura: '',
      Codigo: '',
      Medicamento: '',
      Laboratorio: '',
      fechaCaducidad: '',
      Cantidad: 1,
      Precio: 0,
      Total: 0
    });

    this.detalleVenta.set([]);
    this.totalGeneral.set(0);
    this.ventaConfirmada.set(false);
  }

  salir(): void {
    this.router.navigate(['/dashboard']);
  }
}
