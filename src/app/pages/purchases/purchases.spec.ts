import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { Purchases } from './purchases';
import { Medicamento } from '../../models/medicamento';

const URL_MEDICAMENTOS = 'http://localhost:3000/medicamento';
const URL_COMPRAS = 'http://localhost:3000/compra';

const CATALOGO: Medicamento[] = [
  {
    id: 'MED-1',
    nombre: 'Acetaminofén',
    laboratorio: 'Genfar',
    descripcion: 'Analgésico',
    stock: 10,
    precioCompra: 500,
    precioVenta: 900,
    estado: 'Activo',
  },
  {
    id: 'MED-2',
    nombre: 'Ibuprofeno',
    laboratorio: 'MK',
    descripcion: 'Antiinflamatorio',
    stock: 0,
    precioCompra: 800,
    precioVenta: 1500,
    estado: 'Sin stock',
  },
];

describe('Purchases', () => {

  let component: Purchases;
  let fixture: ComponentFixture<Purchases>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Purchases],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Purchases);
    component = fixture.componentInstance;

    // ngOnInit carga el catálogo del backend.
    fixture.detectChanges();
    httpMock.expectOne(URL_MEDICAMENTOS).flush(CATALOGO);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // Elige un medicamento del catálogo (precarga sus precios).
  function elegir(codigo: string): void {
    component.newPurchase.medicineId = codigo;
    component.buscarMed();
  }

  function agregarLineaValida(): void {
    elegir('MED-1');
    component.newPurchase.quantity = 10;
    component.newPurchase.purchasePrice = 500;
    component.newPurchase.salePrice = 900;
    component.meterALista();
  }

  it('crea el componente y carga el catálogo del backend', () => {
    expect(component).toBeTruthy();
    expect(component.listaMedicamentos().length).toBe(2);
    expect(component.cargandoCatalogo()).toBe(false);
  });

  it('rechaza guardar sin proveedor', () => {
    component.newPurchase.invoiceNumber = 'C-100';
    agregarLineaValida();

    component.guardarCompra();

    expect(component.mensajeError()).toBe('El proveedor es obligatorio.');
    expect(component.guardando()).toBe(false);
    httpMock.verify(); // no hubo POST
  });

  it('rechaza guardar sin número de factura', () => {
    component.newPurchase.provider = 'Farmacia Central';
    agregarLineaValida();

    component.guardarCompra();

    expect(component.mensajeError()).toBe(
      'El número de factura es obligatorio.'
    );
    httpMock.verify();
  });

  it('rechaza guardar sin productos en el detalle', () => {
    component.newPurchase.provider = 'Farmacia Central';
    component.newPurchase.invoiceNumber = 'C-100';

    component.guardarCompra();

    expect(component.mensajeError()).toBe(
      'Agrega al menos un producto a la compra.'
    );
    httpMock.verify();
  });

  it('rechaza cantidad 0', () => {
    elegir('MED-1');
    component.newPurchase.quantity = 0;

    component.meterALista();

    expect(component.mensajeError()).toContain(
      'La cantidad debe ser un número entero mayor que cero'
    );
    expect(component.tablaTemporal().length).toBe(0);
  });

  it('rechaza cantidad negativa y decimal', () => {
    elegir('MED-1');

    component.newPurchase.quantity = -3;
    component.meterALista();
    expect(component.tablaTemporal().length).toBe(0);

    component.newPurchase.quantity = 2.5;
    component.meterALista();
    expect(component.mensajeError()).toContain(
      'La cantidad debe ser un número entero mayor que cero'
    );
    expect(component.tablaTemporal().length).toBe(0);
  });

  it('rechaza precios negativos', () => {
    elegir('MED-1');
    component.newPurchase.quantity = 5;
    component.newPurchase.purchasePrice = -1;
    component.newPurchase.salePrice = 900;

    component.meterALista();

    expect(component.mensajeError()).toBe(
      'Los precios no pueden ser negativos.'
    );
    expect(component.tablaTemporal().length).toBe(0);
  });

  it('al guardar envía cabecera y detalle (sin total) y muestra el total del servidor', () => {
    component.newPurchase.provider = 'Farmacia Central';
    component.newPurchase.invoiceNumber = 'C-100';
    agregarLineaValida();

    // El total local se calcula como suma de precioCompra x cantidad.
    expect(component.total()).toBe(5000);

    component.guardarCompra();

    const peticion = httpMock.expectOne(URL_COMPRAS);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({
      fecha: component.newPurchase.date,
      proveedor: 'Farmacia Central',
      numeroFactura: 'C-100',
      detalles: [
        {
          medicamentoId: 'MED-1',
          cantidad: 10,
          precioCompra: 500,
          precioVenta: 900,
        },
      ],
    });

    peticion.flush({
      id: 7,
      fecha: component.newPurchase.date,
      proveedor: 'Farmacia Central',
      numeroFactura: 'C-100',
      total: 5000,
      detalles: [],
    });

    // Tras guardar se recarga el catálogo (stock actualizado, S7).
    httpMock.expectOne(URL_MEDICAMENTOS).flush([]);

    expect(component.mensajeExito()).toContain('C-100 registrada');
    expect(component.mensajeExito()).toContain('Total: $5000');
    expect(component.tablaTemporal().length).toBe(0);
    expect(component.guardando()).toBe(false);
  });

  it('muestra el mensaje del backend ante un error (factura duplicada 409)', () => {
    component.newPurchase.provider = 'Farmacia Central';
    component.newPurchase.invoiceNumber = 'C-DUPLICADA';
    agregarLineaValida();

    component.guardarCompra();

    const peticion = httpMock.expectOne(URL_COMPRAS);
    peticion.flush(
      { message: 'El número de factura ya existe' },
      { status: 409, statusText: 'Conflict' }
    );

    expect(component.mensajeError()).toBe(
      'El número de factura ya existe'
    );
    expect(component.guardando()).toBe(false);
  });
});
