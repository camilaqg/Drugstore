import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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

  constructor(private form: FormBuilder, private router: Router) {

    this.FormularioVentas = this.form.group({
      fechaVenta: ['', Validators.required],
      Cliente: ['', Validators.required],
      Factura: ['', Validators.required],
      Codigo: ['', Validators.required],
      Medicamento: ['', Validators.required],
      Laboratorio: ['', Validators.required],
      fechaCaducidad: [''],
      Cantidad: [0, Validators.required],
      Precio: [0, Validators.required],
      Total: [0]
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
      Medicamento: '',
      Cantidad: 0,
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

  irAdministrador() {
    this.router.navigate(['/admin']);
  }

  salir() {
    this.router.navigate(['/login']);
  }

}