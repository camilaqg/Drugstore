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

  // FORMULARIO DE FILTROS
  filtroForm: FormGroup;

  // LISTA QUE SE MUESTRA EN LA TABLA
  listaVentas: any[] = [];

  // TODAS LAS VENTAS
  todasLasVentas: any[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private salesService: SalesService
  ) {

    // INICIALIZAR FORMULARIO
    this.filtroForm = this.fb.group({

      fechaInicial: [''],
      fechaFinal: [''],
      medicamento: ['']

    });

  }

  ngOnInit(): void {

    // CARGAR VENTAS
    this.cargarVentas();

  }

  // CARGAR VENTAS DESDE LOCALSTORAGE
  cargarVentas(): void {

    this.todasLasVentas = this.salesService.obtenerVentas();

    // MOSTRAR TODAS AL INICIO
    this.listaVentas = this.todasLasVentas;

    console.log(this.listaVentas);

  }

  // BUSCAR VENTAS
  buscarVentas(): void {

    const {
      fechaInicial,
      fechaFinal,
      medicamento
    } = this.filtroForm.value;

    // VALIDAR CAMPOS VACIOS
    if (!fechaInicial && !fechaFinal && !medicamento) {

      alert('Debes completar al menos un campo para realizar la búsqueda');

      return;

    }

    // CONVERTIR FECHAS
    const inicio = fechaInicial ? new Date(fechaInicial) : null;
    const fin = fechaFinal ? new Date(fechaFinal) : null;

    // AJUSTAR HORAS
    if (inicio) {

      inicio.setHours(0, 0, 0, 0);

    }

    if (fin) {

      fin.setHours(23, 59, 59, 999);

    }

    // FILTRAR VENTAS
    this.listaVentas = this.todasLasVentas.filter(v => {

      const fechaVenta = new Date(v.fechaVenta);

      // VALIDAR FECHAS
      const cumpleFecha =

        (!inicio || fechaVenta >= inicio) &&
        (!fin || fechaVenta <= fin);

      // VALIDAR MEDICAMENTO
      const cumpleMedicamento =

        !medicamento ||

        v.Medicamento
          .toLowerCase()
          .includes(medicamento.toLowerCase());

      return cumpleFecha && cumpleMedicamento;

    });

    console.log(this.listaVentas);

  }

  // LIMPIAR FILTROS
  limpiarFiltros(): void {

    this.filtroForm.reset();

    this.listaVentas = this.todasLasVentas;

  }

  // VOLVER AL DASHBOARD
  volverInicio(): void {

    this.router.navigate(['/dashboard']);

  }

  // SALIR
  salir(): void {

    this.router.navigate(['/dashboard']);

  }

}