
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SalesService } from '../../services/sales.service';
import { Sale } from '../../models/sale';

@Component({
  selector: 'app-informes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class ReportsComponents implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly salesService = inject(SalesService);

  filtroForm: FormGroup = this.fb.group({
    fechaInicial: [''],
    fechaFinal: [''],
    medicamento: ['']
  });

  listaVentas: Sale[] = [];
  todasLasVentas: Sale[] = [];

  ngOnInit(): void {
    this.cargarVentas();
  }

  cargarVentas(): void {
    this.salesService.obtenerVentas().subscribe({
      next: (ventas) => {
        this.todasLasVentas = ventas;
        this.listaVentas = [...ventas];

        console.log('Ventas cargadas:', this.listaVentas);
      },
      error: (error) => {
        console.error('Error al cargar las ventas:', error);
        alert('No se pudieron cargar las ventas desde el servidor.');
      }
    });
  }

  buscarVentas(): void {
    const {
      fechaInicial,
      fechaFinal,
      medicamento
    } = this.filtroForm.value;

    if (!fechaInicial && !fechaFinal && !medicamento) {
      alert('Debes completar al menos un campo para realizar la búsqueda');
      return;
    }

    const inicio = fechaInicial ? new Date(fechaInicial) : null;
    const fin = fechaFinal ? new Date(fechaFinal) : null;

    if (inicio) {
      inicio.setHours(0, 0, 0, 0);
    }

    if (fin) {
      fin.setHours(23, 59, 59, 999);
    }

    const busqueda = String(medicamento ?? '').toLowerCase().trim();

    this.listaVentas = this.todasLasVentas.filter(venta => {
      const fechaVenta = new Date(venta.fecha);

      const cumpleFecha =
        (!inicio || fechaVenta >= inicio) &&
        (!fin || fechaVenta <= fin);

      const cumpleMedicamento =
        !busqueda ||
        (venta.detalles ?? []).some(detalle =>
          String(detalle.medicamentoId).toLowerCase().includes(busqueda)
        );

      return cumpleFecha && cumpleMedicamento;
    });
  }

  limpiarFiltros(): void {
    this.filtroForm.reset({
      fechaInicial: '',
      fechaFinal: '',
      medicamento: ''
    });

    this.listaVentas = [...this.todasLasVentas];
  }

  volverInicio(): void {
    this.router.navigate(['/dashboard']);
  }

  salir(): void {
    this.router.navigate(['/dashboard']);
  }
}
