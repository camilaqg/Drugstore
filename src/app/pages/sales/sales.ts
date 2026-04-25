import { Component } from '@angular/core';
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
export class SalesComponent {

  FormularioVentas: FormGroup;
  detalleVenta: any[] = [];
  totalGeneral = 0;
  
  medicamentos = [
    { Codigo: '001', Medicamento: 'Acetaminofén', Laboratorio: 'Genfar', Precio: 1500 },
    { Codigo: '002', Medicamento: 'Ibuprofeno', Laboratorio: 'MK', Precio: 2000 },
    { Codigo: '003', Medicamento: 'Amoxicilina', Laboratorio: 'La Santé', Precio: 5000 }
  ];

  constructor(
    private form: FormBuilder,
    private router: Router,
    private salesService: SalesService
  ) {

    this.FormularioVentas = this.form.group({
      fechaVenta: ['', Validators.required],
      Cliente: ['', Validators.required],
      Factura: ['', Validators.required],
      Codigo: ['', Validators.required],
      Medicamento: ['', Validators.required],
      Laboratorio: ['', Validators.required],
      fechaCaducidad: [''],

      // 🔥 AQUÍ EL CAMBIO IMPORTANTE
      Cantidad: [1, [Validators.required, Validators.min(1)]],

      Precio: [0, Validators.required],
      Total: [0]
    });

  }

  buscarMedicamento() {

    const codigo = this.FormularioVentas.get('Codigo')?.value;

    const med = this.medicamentos.find(m => m.Codigo === codigo);

    if (med) {
      this.FormularioVentas.patchValue({
        Medicamento: med.Medicamento,
        Laboratorio: med.Laboratorio,
        Precio: med.Precio
      });

      this.calcularTotalProducto();
    }

  }

  calcularTotalProducto() {

    let cantidad = this.FormularioVentas.get('Cantidad')?.value;
    const precio = this.FormularioVentas.get('Precio')?.value;

    // 🔥 EVITA NEGATIVOS O CEROS
    if (cantidad < 1) {
      cantidad = 1;
      this.FormularioVentas.get('Cantidad')?.setValue(1);
    }

    this.FormularioVentas.patchValue({
      Total: cantidad * precio
    });

  }

  agregarProducto() {

    const data = this.FormularioVentas.value;

    if (!data.Medicamento || data.Cantidad <= 0 || data.Precio <= 0) {
      alert('Completa los datos');
      return;
    }

    data.Total = data.Cantidad * data.Precio;

    this.detalleVenta.push({ ...data });

    this.calcularTotal();

    this.FormularioVentas.patchValue({
      Codigo: '',
      Medicamento: '',
      Laboratorio: '',
      Cantidad: 1,   // 🔥 importante (antes tenías 0)
      Precio: 0,
      Total: 0
    });

  }

  quitarProducto(i: number) {
    this.detalleVenta.splice(i, 1);
    this.calcularTotal();
  }

  calcularTotal() {
    this.totalGeneral = this.detalleVenta.reduce((sum, item) => sum + item.Total, 0);
  }

  confirmarVenta() {

    if (this.detalleVenta.length === 0) {
      alert('Rellena todos los datos para confirmar la venta');
      return;
    }

    this.detalleVenta.forEach(venta => {
      this.salesService.addSale(venta);
    });

    alert('Venta guardada');
    console.log(this.detalleVenta);

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