import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Medicamento } from '../../models/medicamento';
import { Compra } from '../../models/purchase';
import { CompraService } from '../../services/compra.service';
import { MedicamentoService } from '../../services/medicamento.service';

@Component({
  selector: 'app-purchase-history',
  standalone: true,
  templateUrl: './purchase-history.html',
  styleUrl: './purchase-history.css'
})
export class PurchaseHistory implements OnInit {

  private readonly compraService = inject(CompraService);
  private readonly medService = inject(MedicamentoService);
  private readonly router = inject(Router);

  // Historial leído de GET /compra (los datos vienen del backend).
  readonly compras = signal<Compra[]>([]);
  readonly cargando = signal(false);
  readonly mensajeError = signal<string | null>(null);

  // Catálogo para mostrar el nombre del medicamento junto al código.
  private catalogo = new Map<string, Medicamento>();

  ngOnInit(): void {
    this.cargarCatalogo();
    this.cargarHistorial();
  }

  cargarCatalogo(): void {
    this.medService.listar().subscribe({
      next: (datos) => {
        this.catalogo = new Map(datos.map(med => [med.id, med]));
      },
      error: () => {
        // Tenemos el código como respaldo, así que no bloqueamos el
        // historial si el catálogo falla.
        console.error('No se pudo cargar el catálogo de medicamentos.');
      }
    });
  }

  cargarHistorial(): void {
    this.cargando.set(true);
    this.mensajeError.set(null);

    this.compraService.listar().subscribe({
      next: (datos) => {
        // Se muestra primero la compra más reciente.
        this.compras.set([...datos].reverse());
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.mensajeError.set(
          'No se pudo cargar el historial de compras. ' +
          'Verifica que el backend esté funcionando.'
        );
      }
    });
  }

  // Nombre del medicamento del catálogo; si no está, se muestra el id.
  obtenerNombre(medicamentoId: string): string {
    return this.catalogo.get(medicamentoId)?.nombre ?? medicamentoId;
  }

  volver(): void {
    this.router.navigate(['/dashboard']);
  }
}
