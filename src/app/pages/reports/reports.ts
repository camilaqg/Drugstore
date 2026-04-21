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

  filtroForm: FormGroup;
  listaVentas: any[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private salesService: SalesService 
  ) {

    this.filtroForm = this.fb.group({
      fechaInicial: [''],
      fechaFinal: ['']
    });

  }

  ngOnInit() {
    this.salesService.sales$.subscribe(data => {
      this.listaVentas = data;
    });
  }

  buscarVentas() {

    const f = this.filtroForm.value;

    console.log('Filtro:', f);

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