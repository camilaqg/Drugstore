import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SalesService } from '../../services/sales.service';

@Component({
  selector: 'app-informes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class ReportsComponents implements OnInit {

  // Formulario para filtrar por fechas
  filtroForm: FormGroup;

  // Lista donde se guardan las ventas a mostrar
  listaVentas: any[] = [];

  constructor(
    private fb: FormBuilder,        // Para crear formularios reactivos
    private router: Router,         // Para navegar entre páginas
    private salesService: SalesService // Servicio que se maneja para las ventas para que se registre tambien la tabla de informes
  ) {

    // se inicializa el formulario con campos vacíos
    this.filtroForm = this.fb.group({
      fechaInicial: [''],
      fechaFinal: ['']
    });

  }

  ngOnInit() {

    // Se ejecuta al cargar el componente y se encarga de obtener todas las ventas para mostrarlas inicialmente
    this.salesService.sales$.subscribe(data => {
      this.listaVentas = data; // Guarda todas las ventas inicialmente
    });

  }

  buscarVentas() {

    // se obtienen los valores del formulario
    const { fechaInicial, fechaFinal } = this.filtroForm.value;

    // Se vuelve a suscribir para obtener los datos actualizados
    this.salesService.sales$.subscribe(data => {

      // Si no se seleccionan fechas, muestra todas las ventas
      if (!fechaInicial || !fechaFinal) {
        this.listaVentas = data;
        return;
      }

      // Filtra las ventas según el rango de fechas
      this.listaVentas = data.filter(v => {

        const fechaVenta = new Date(v.fechaVenta); // Fecha de cada venta
        const inicio = new Date(fechaInicial);     // Fecha inicial
        const fin = new Date(fechaFinal);          // Fecha final

        // se retornan las ventas que estén dentro del rango de fechas seleccionado
        return fechaVenta >= inicio && fechaVenta <= fin;

      });

    });

  }

  exportarExcel() {
    alert('Exportando a Excel...');
  }

  salir() {
    this.router.navigate(['/dashboard']);
  }

  volverInicio() {
    this.router.navigate(['/dashboard']);
  }

}