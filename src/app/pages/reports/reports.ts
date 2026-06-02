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

  // Formulario reactivo utilizado para los filtros de búsqueda
  filtroForm: FormGroup;

  // Lista que se muestra en la tabla después de aplicar filtros
  listaVentas: any[] = [];

  // Lista completa de ventas obtenidas desde el servicio
  todasLasVentas: any[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private salesService: SalesService
  ) {

    // Inicialización del formulario con los campos de búsqueda
    this.filtroForm = this.fb.group({

      fechaInicial: [''],
      fechaFinal: [''],
      medicamento: ['']

    });

  }

  ngOnInit(): void {

    // Al iniciar el componente se cargan todas las ventas
    this.cargarVentas();

  }

  // Obtiene todas las ventas almacenadas y las muestra en la tabla
  cargarVentas(): void {

    this.todasLasVentas = this.salesService.obtenerVentas();

    // Inicialmente se muestran todas las ventas sin filtros
    this.listaVentas = this.todasLasVentas;

    console.log(this.listaVentas);

  }

  // Realiza la búsqueda según los filtros ingresados por el usuario
  buscarVentas(): void {

    // Obtiene los valores actuales del formulario
    const {
      fechaInicial,
      fechaFinal,
      medicamento
    } = this.filtroForm.value;

    // Valida que al menos un filtro haya sido ingresado
    if (!fechaInicial && !fechaFinal && !medicamento) {

      alert('Debes completar al menos un campo para realizar la búsqueda');

      return;

    }

    // Convierte las fechas ingresadas en objetos Date
    const inicio = fechaInicial ? new Date(fechaInicial) : null;
    const fin = fechaFinal ? new Date(fechaFinal) : null;

    // Ajusta la fecha inicial al comienzo del día
    if (inicio) {

      inicio.setHours(0, 0, 0, 0);

    }

    // Ajusta la fecha final al último milisegundo del día
    if (fin) {

      fin.setHours(23, 59, 59, 999);

    }

    // Filtra las ventas según los criterios seleccionados
    this.listaVentas = this.todasLasVentas.filter(v => {

      // Convierte la fecha de la venta para poder compararla
      const fechaVenta = new Date(v.fechaVenta);

      // Verifica si la venta está dentro del rango de fechas
      const cumpleFecha =

        (!inicio || fechaVenta >= inicio) &&
        (!fin || fechaVenta <= fin);

      // Verifica si el medicamento coincide con la búsqueda
      const cumpleMedicamento =

        !medicamento ||

        v.Medicamento
          .toLowerCase()
          .includes(medicamento.toLowerCase());

      // Solo retorna las ventas que cumplen ambos filtros
      return cumpleFecha && cumpleMedicamento;

    });

    console.log(this.listaVentas);

  }

  // Limpia los filtros y restaura la lista completa de ventas
  limpiarFiltros(): void {

    // Reinicia todos los campos del formulario
    this.filtroForm.reset();

    // Vuelve a mostrar todas las ventas
    this.listaVentas = this.todasLasVentas;

  }

  // Redirige al usuario al dashboard principal
  volverInicio(): void {

    this.router.navigate(['/dashboard']);

  }

  // Sale de la vista actual y regresa al dashboard
  salir(): void {

    this.router.navigate(['/dashboard']);

  }

}