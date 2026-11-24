import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';

import { SalesComponent } from './sales';
import { Medicamento } from '../../models/sale';

const URL_MEDICAMENTOS = 'http://localhost:3000/medicamento';
const URL_VENTAS = 'http://localhost:3000/venta';

const CATALOGO: Medicamento[] = [
  {
    id: 'MED-1',
    nombre: 'Acetaminofén',
    laboratorio: 'Genfar',
    descripcion: 'Analgésico',
    stock: 5,
    precioCompra: 1000,
    precioVenta: 2000,
    estado: 'Bajo stock',
  },
  {
    id: 'MED-2',
    nombre: 'Ibuprofeno',
    laboratorio: 'MK',
    descripcion: 'Antiinflamatorio',
    stock: 3,
    precioCompra: 800,
    precioVenta: 1500,
    estado: 'Bajo stock',
  },
];

describe('SalesComponent', () => {

  let component: SalesComponent;
  let fixture: ComponentFixture<SalesComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [SalesComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SalesComponent);
    component = fixture.componentInstance;

    // ngOnInit pide el catálogo: se entrega con stock bajo para poder
    // probar el límite de cantidad contra el stock disponible.
    fixture.detectChanges();
    httpMock
      .expectOne(URL_MEDICAMENTOS)
      .flush(CATALOGO);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  function buscar(codigo: string): void {
    component.FormularioVentas.get('Codigo')?.setValue(codigo);
    component.buscarMedicamento();
  }

  it('crea el componente y carga el catálogo del backend', () => {
    expect(component).toBeTruthy();
    expect(component.medicamentos.length).toBe(2);
    expect(component.cargandoMedicamentos).toBe(false);
  });

  it('rechaza una cantidad mayor que el stock disponible y no agrega la línea', () => {
    buscar('MED-1');

    component.FormularioVentas.get('Cantidad')?.setValue(10);
    component.agregarProducto();

    expect(component.mensajeError()).toContain('Solo quedan 5 unidades');
    expect(component.detalleVenta().length).toBe(0);
    expect(component.totalGeneral()).toBe(0);
  });

  it('descuenta del stock lo ya agregado en la misma venta', () => {
    buscar('MED-1');

    component.FormularioVentas.get('Cantidad')?.setValue(3);
    component.agregarProducto();
    expect(component.detalleVenta().length).toBe(1);

    // agregarProducto limpia los campos del producto: se busca de nuevo.
    buscar('MED-1');

    // Stock 5, ya van 3: agregar 4 excede lo disponible.
    component.FormularioVentas.get('Cantidad')?.setValue(4);
    component.agregarProducto();
    expect(component.mensajeError()).toContain('Solo quedan 2 unidades');
    expect(component.detalleVenta().length).toBe(1);

    // Agregar las 2 restantes sí pasa.
    buscar('MED-1');
    component.FormularioVentas.get('Cantidad')?.setValue(2);
    component.agregarProducto();
    expect(component.detalleVenta().length).toBe(2);
    expect(component.stockDisponible(CATALOGO[0])).toBe(0);
  });

  it('el total mostrado es la suma de los totales de las líneas', () => {
    buscar('MED-1');
    component.FormularioVentas.get('Cantidad')?.setValue(2);
    component.agregarProducto(); // 2 x 2000 = 4000

    buscar('MED-2');
    component.FormularioVentas.get('Cantidad')?.setValue(3);
    component.agregarProducto(); // 3 x 1500 = 4500

    expect(component.totalGeneral()).toBe(8500);

    // Al quitar una línea el total se recalcula.
    component.quitarProducto(0);
    expect(component.totalGeneral()).toBe(4500);
  });

  it('rechaza una cantidad que no es entero positivo', () => {
    buscar('MED-1');

    component.FormularioVentas.get('Cantidad')?.setValue(2.5);
    component.agregarProducto();
    expect(component.mensajeError()).toContain('número entero mayor que cero');
    expect(component.detalleVenta().length).toBe(0);

    component.FormularioVentas.get('Cantidad')?.setValue(0);
    component.agregarProducto();
    expect(component.detalleVenta().length).toBe(0);
  });

  it('exige fecha, cliente y factura antes de confirmar', () => {
    component.confirmarVenta();

    expect(component.mensajeError()).toContain(
      'Completa la fecha, el cliente y la factura'
    );
    httpMock.verify(); // no se disparó ningún POST
  });

  it('exige al menos un producto en el detalle', () => {
    component.FormularioVentas.patchValue({
      fechaVenta: '2026-11-24',
      Cliente: 'Ana',
      Factura: 'F-100',
    });

    component.confirmarVenta();

    expect(component.mensajeError()).toContain(
      'Agrega al menos un producto'
    );
    httpMock.verify();
  });

  it('al confirmar envía solo código y cantidad (sin precios ni total) y muestra el total del servidor', () => {
    component.FormularioVentas.patchValue({
      fechaVenta: '2026-11-24',
      Cliente: 'Ana',
      Factura: 'F-100',
    });

    buscar('MED-1');
    component.FormularioVentas.get('Cantidad')?.setValue(2);
    component.agregarProducto();

    component.confirmarVenta();

    const peticion = httpMock.expectOne(URL_VENTAS);
    expect(peticion.request.method).toBe('POST');
    // El cliente NO envía precio ni total: los recalcula el servidor.
    expect(peticion.request.body).toEqual({
      cliente: 'Ana',
      factura: 'F-100',
      fecha: '2026-11-24',
      detalles: [{ medicamentoId: 'MED-1', cantidad: 2 }],
    });

    peticion.flush({
      id: 1,
      usuarioId: 5,
      cliente: 'Ana',
      factura: 'F-100',
      fecha: '2026-11-24',
      total: 4000,
    });

    // Tras confirmar se recarga el catálogo (descuento de stock, S7).
    httpMock.expectOne(URL_MEDICAMENTOS).flush([]);

    expect(component.ventaConfirmada()).toBe(true);
    expect(component.totalServidor()).toBe(4000);
    // El total local se limpia; el mostrado pasa a ser el del servidor.
    expect(component.totalGeneral()).toBe(0);
    expect(component.mensajeExito()).toContain('F-100');
  });

  it('rechaza agregar un medicamento cuyo precio no coincide con el catálogo', () => {
    buscar('MED-1');

    component.FormularioVentas.get('Cantidad')?.setValue(1);
    component.FormularioVentas.get('Precio')?.setValue(9999);
    component.agregarProducto();

    expect(component.mensajeError()).toContain(
      'El precio no coincide con el precio del medicamento'
    );
    expect(component.detalleVenta().length).toBe(0);
  });
});
