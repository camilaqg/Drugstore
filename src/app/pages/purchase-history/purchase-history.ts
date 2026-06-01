import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-purchase-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './purchase-history.html',
  styleUrl: './purchase-history.css'
})
export class PurchaseHistory {

  compras: any[] = [];

  constructor() {

    this.compras =
      JSON.parse(localStorage.getItem('compras') || '[]');

  }

  limpiarHistorial() {

  const confirmar = confirm(
    '¿Desea eliminar todo el historial de compras?'
  );

  if (confirmar) {

    localStorage.removeItem('compras');

    this.compras = [];

    alert('✅ Historial eliminado correctamente');

  }

 }
}
