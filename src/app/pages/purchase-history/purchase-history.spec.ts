import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { PurchaseHistory } from './purchase-history';
import { Medicamento } from '../../models/medicamento';
import { Compra } from '../../models/purchase';

const URL_MEDICAMENTOS = 'http://localhost:3000/medicamento';
const URL_COMPRAS = 'http://localhost:3000/compra';

const CATALOGO: Medicamento[] = [
  {
    id: 'MED-1',
    nombre: 'Acetaminofén',
    laboratorio: 'Genfar',
    descripcion: '',
    stock: 10,
    precioCompra: 500,
    precioVenta: 900,
    estado: 'Activo',
  },
];

const COMPRAS: Compra[] = [
  {
    id: 1,
    fecha: '2026-11-01',
    proveedor: 'Proveedor Viejo',
    numeroFactura: 'C-001',
    total: 2500,
    detalles: [
      {
        id: 1,
        compraId: 1,
        medicamentoId: 'MED-1',
        cantidad: 5,
        precioCompra: 500,
        precioVenta: 900,
        total: 2500,
      },
    ],
  },
  {
    id: 2,
    fecha: '2026-11-20',
    proveedor: 'Proveedor Nuevo',
    numeroFactura: 'C-002',
    total: 4000,
    detalles: [
      {
        id: 2,
        compraId: 2,
        medicamentoId: 'MED-1',
        cantidad: 8,
        precioCompra: 500,
        precioVenta: 900,
        total: 4000,
      },
    ],
  },
];

describe('PurchaseHistory', () => {
  let component: PurchaseHistory;
  let fixture: ComponentFixture<PurchaseHistory>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [PurchaseHistory],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PurchaseHistory);
    component = fixture.componentInstance;

    // ngOnInit pide catálogo e historial (en ese orden).
    fixture.detectChanges();
    httpMock.expectOne(URL_MEDICAMENTOS).flush(CATALOGO);
    httpMock.expectOne(URL_COMPRAS).flush(COMPRAS);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('crea el componente y carga el historial desde el backend', () => {
    expect(component).toBeTruthy();
    expect(component.compras().length).toBe(2);
    expect(component.cargando()).toBe(false);
    expect(component.mensajeError()).toBeNull();
  });

  it('lee las compras de la API, no de localStorage', () => {
    localStorage.setItem('compras', 'zzz-manipulado');

    expect(component.compras().length).toBe(2);
    expect(component.compras().map(c => c.numeroFactura)).toEqual(
      ['C-002', 'C-001']
    );
  });

  it('muestra primero la compra más reciente', () => {
    expect(component.compras()[0].numeroFactura).toBe('C-002');
    expect(component.compras()[1].numeroFactura).toBe('C-001');
  });

  it('resuelve el nombre del medicamento con el catálogo', () => {
    expect(component.obtenerNombre('MED-1')).toBe('Acetaminofén');
    // Un código que no está en el catálogo se muestra tal cual.
    expect(component.obtenerNombre('MED-X')).toBe('MED-X');
  });

  it('muestra un error y no deja la pantalla cargando si falla el historial', () => {
    // Se monta otra instancia para controlar las respuestas.
    fixture = TestBed.createComponent(PurchaseHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();

    httpMock.expectOne(URL_MEDICAMENTOS).flush(CATALOGO);
    httpMock.expectOne(URL_COMPRAS).flush(null, {
      status: 0,
      statusText: 'Network Error',
    });

    expect(component.cargando()).toBe(false);
    expect(component.mensajeError()).toContain(
      'No se pudo cargar el historial de compras'
    );
    expect(component.compras().length).toBe(0);
  });
});
