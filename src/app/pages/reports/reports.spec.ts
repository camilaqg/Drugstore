import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { ReportsComponents } from './reports';
import { Sale } from '../../models/sale';

const URL_VENTAS = 'http://localhost:3000/venta';

const VENTAS: Sale[] = [
  {
    id: 1,
    usuarioId: 5,
    cliente: 'Ana',
    factura: 'V-001',
    fecha: '2026-11-20T10:00:00.000Z',
    total: 4000,
    detalles: [
      { id: 1, medicamentoId: 'MED-1', cantidad: 2, precio: 2000, total: 4000 },
    ],
  },
  {
    id: 2,
    usuarioId: 5,
    cliente: 'Beto',
    factura: 'V-002',
    fecha: '2026-11-23T10:00:00.000Z',
    total: 1500,
    detalles: [
      { id: 2, medicamentoId: 'MED-2', cantidad: 1, precio: 1500, total: 1500 },
    ],
  },
];

describe('ReportsComponents', () => {
  let component: ReportsComponents;
  let fixture: ComponentFixture<ReportsComponents>;
  let httpMock: HttpTestingController;
  let alertas: any = null;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [ReportsComponents],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    alertas = vi.spyOn(window, 'alert');

    fixture = TestBed.createComponent(ReportsComponents);
    component = fixture.componentInstance;

    // ngOnInit carga las ventas del backend.
    fixture.detectChanges();
    httpMock.expectOne(URL_VENTAS).flush(VENTAS);
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    httpMock.verify();
    localStorage.clear();
  });

  it('crea el componente y carga las ventas del backend', () => {
    expect(component).toBeTruthy();
    expect(component.todasLasVentas.length).toBe(2);
    expect(component.listaVentas.length).toBe(2);
  });

  it('exige al menos un filtro para buscar', () => {
    component.buscarVentas();

    expect(alertas).toHaveBeenCalledWith(
      'Debes completar al menos un campo para realizar la búsqueda'
    );
  });

  it('filtra las ventas por código de medicamento', () => {
    component.filtroForm.patchValue({ medicamento: 'med-2' });

    component.buscarVentas();

    expect(component.listaVentas.length).toBe(1);
    expect(component.listaVentas[0].factura).toBe('V-002');
  });

  it('filtra las ventas por rango de fechas', () => {
    component.filtroForm.patchValue({ fechaInicial: '2026-11-22' });

    component.buscarVentas();

    expect(component.listaVentas.length).toBe(1);
    expect(component.listaVentas[0].factura).toBe('V-002');
  });

  it('limpiarFiltros restaura la lista completa', () => {
    component.filtroForm.patchValue({ medicamento: 'MED-1' });
    component.buscarVentas();
    expect(component.listaVentas.length).toBe(1);

    component.limpiarFiltros();

    expect(component.listaVentas.length).toBe(2);
    expect(component.filtroForm.get('medicamento')?.value).toBe('');
  });
});
