import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SalesService } from '../../services/sales.service';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './sales.html',
  styleUrls: ['./sales.css']
})
export class SalesComponent implements OnInit {

  // Formulario principal de ventas
  FormularioVentas: FormGroup;

  // aqui es la  lsita donde se agregan los productos
  detalleVenta: any[] = [];

  // Total acumulado de toda la venta
  totalGeneral = 0;

  // estadisticas para las tarjetas
  ventasHoy = 0;
  transacciones = 0;
  productosVendidos = 0;
  ventasMes = 0;

  // Lista de medicamentos disponiblesy el desplegable para seleccionar el medicamento
  medicamentos = [
    { Codigo: '001', Medicamento: 'Acetaminofén', Laboratorio: 'Genfar', Precio: 1500 },
    { Codigo: '002', Medicamento: 'Ibuprofeno', Laboratorio: 'MK', Precio: 2000 },
    { Codigo: '003', Medicamento: 'Amoxicilina', Laboratorio: 'La Santé', Precio: 5000 }
  ];

  constructor(
    private form: FormBuilder,      // Para crear formularios reactivos
    private router: Router,         //  Para navegación entre páginas
    private salesService: SalesService //  Servicio para guardar ventas
  ) {

    // validaciones
    this.FormularioVentas = this.form.group({
      fechaVenta: ['', Validators.required],
      Cliente: ['', Validators.required],
      Factura: ['', Validators.required],
      Codigo: ['', Validators.required],
      Medicamento: ['', Validators.required],
      Laboratorio: ['', Validators.required],
      fechaCaducidad: [''],
      Cantidad: [1, [Validators.required, Validators.min(1)]],
      Precio: [0, Validators.required],
      Total: [0]
    });

  }

  ngOnInit() {

    // Carga las estadísticas guardadas en localStorage y se mantienen estatico cuando se recarga la pagina o se sale del sistema
    const data = localStorage.getItem('estadisticasVentas');

    if (data) {
      const stats = JSON.parse(data);

      this.ventasHoy = stats.ventasHoy;
      this.transacciones = stats.transacciones;
      this.productosVendidos = stats.productosVendidos;
      this.ventasMes = stats.ventasMes;
    }
  }

  // Busca el medicamento por código
  buscarMedicamento() {
    const codigo = this.FormularioVentas.get('Codigo')?.value;

    // Busca en el array el medicamento que coincida con el código
    const med = this.medicamentos.find(m => m.Codigo === codigo);

    if (med) {

      //para autocompletar los campos del formulario
      this.FormularioVentas.patchValue({
        Medicamento: med.Medicamento,
        Laboratorio: med.Laboratorio,
        Precio: med.Precio
      });

      this.calcularTotalProducto();
    }
  }

  // Calcula el total de un producto multiplicando la cantidad por el precio
  calcularTotalProducto() {
    let cantidad = this.FormularioVentas.get('Cantidad')?.value;
    const precio = this.FormularioVentas.get('Precio')?.value;

    //  Evita cantidades menores a 1
    if (cantidad < 1) {
      cantidad = 1;
      this.FormularioVentas.get('Cantidad')?.setValue(1);
    }

    // Actualiza el total del producto
    this.FormularioVentas.patchValue({
      Total: cantidad * precio
    });
  }

  // Agregar producto a la venta
  agregarProducto() {

    const data = this.FormularioVentas.value;

    //se realiza la validación
    if (!data.Medicamento || data.Cantidad <= 0 || data.Precio <= 0) {
      alert('Completa los datos');
      return;
    }

    // Calculo total del producto
    data.Total = data.Cantidad * data.Precio;

    // Agregar producto al detalle de la venta
    this.detalleVenta.push({ ...data });

    this.calcularTotal();

    // se limpian campos para agregar otro producto
    this.FormularioVentas.patchValue({
      Codigo: '',
      Medicamento: '',
      Laboratorio: '',
      Cantidad: 1,
      Precio: 0,
      Total: 0
    });
  }

  // aqui se eliminan productos de la lista
  quitarProducto(i: number) {
    this.detalleVenta.splice(i, 1);
    this.calcularTotal();
  }

  // Calculo general de la venta
  calcularTotal() {
    this.totalGeneral = this.detalleVenta.reduce((sum, item) => sum + item.Total, 0);
  }

  // se Confirma venta
  confirmarVenta() {

    // se Valida que haya productos
    if (this.detalleVenta.length === 0) {
      alert('Rellena todos los datos para confirmar la venta');
      return;
    }

    // aqui se guarda cada producto como una venta
    this.detalleVenta.forEach(venta => {
      this.salesService.addSale(venta);
    });

    // se actualizan estadísticas
    this.transacciones += 1;
    this.ventasHoy += this.totalGeneral;
    this.ventasMes += this.totalGeneral;

    this.detalleVenta.forEach(item => {
      this.productosVendidos += item.Cantidad;
    });

    //  Guardar estadísticas en localStorage 
    const stats = {
      ventasHoy: this.ventasHoy,
      transacciones: this.transacciones,
      productosVendidos: this.productosVendidos,
      ventasMes: this.ventasMes
    };

    localStorage.setItem('estadisticasVentas', JSON.stringify(stats));

    alert('Venta guardada');
    console.log(this.detalleVenta);

    this.limpiarFormulario();
  }

  imprimirVenta() {
    window.print();
  }

  limpiarFormulario() {
    this.FormularioVentas.reset();
    this.detalleVenta = [];
    this.totalGeneral = 0;
  }

  salir() {
    this.router.navigate(['/dashboard']);
  }

}