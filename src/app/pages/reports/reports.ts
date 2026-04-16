import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-informes',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule,RouterModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class ReportsComponents {

  filtroForm: FormGroup;
  listaVentas: any[] = [];

  constructor(private fb: FormBuilder, private router: Router) {

    this.filtroForm = this.fb.group({
      fechaInicial: [''],
      fechaFinal: ['']
    });

  }

  buscarVentas() {

    const f = this.filtroForm.value;

    console.log('Filtro:', f);

    this.listaVentas = [
      {
        fechaVenta: '2026-02-01',
        Factura: 'FACTURA-002',
        Cliente: 'Camila',
        Medicamento: 'Acetaminofen',
        Cantidad: 10,
        Total: 50000
      },
      {
        fechaVenta: '2025-07-29',
        Factura: 'FACTURA-010',
        Cliente: 'Nicolle',
        Medicamento: 'Amoxicilina',
        Cantidad: 3,
        Total: 5000
      }
    ];

  }

  
  exportarExcel() {
    alert('Exportando a Excel...');
  }

  
  irAdmin() {
    this.router.navigate(['/admin']);
  }

 
  salir() {
    this.router.navigate(['/login']);
  }

 
  volverInicio() {
    this.router.navigate(['/']);
  }

}