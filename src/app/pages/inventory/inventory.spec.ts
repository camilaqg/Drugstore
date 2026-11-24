import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { Inventory } from './inventory';
import { Medicamento } from '../../models/medicamento';

const URL_MEDICAMENTOS = 'http://localhost:3000/medicamento';

const CATALOGO: Medicamento[] = [
  {
    id: 'MED-1',
    nombre: 'Acetaminofén',
    laboratorio: 'Genfar',
    descripcion: 'Analgésico',
    stock: 50,
    precioCompra: 1000,
    precioVenta: 2000,
    estado: 'Activo',
  },
  {
    id: 'MED-2',
    nombre: 'Ibuprofeno',
    laboratorio: 'MK',
    descripcion: 'Antiinflamatorio',
    stock: 10,
    precioCompra: 800,
    precioVenta: 1500,
    estado: 'Bajo stock',
  },
];

describe('Inventory', () => {
  let component: Inventory;
  let fixture: ComponentFixture<Inventory>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Inventory],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Inventory);
    component = fixture.componentInstance;

    // El constructor pide el catálogo.
    httpMock.expectOne(URL_MEDICAMENTOS).flush(CATALOGO);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('crea el componente y carga el catálogo del backend', () => {
    expect(component).toBeTruthy();
    expect(component.medicamentos().length).toBe(2);
    expect(component.cargando()).toBe(false);
    expect(component.errorCarga()).toBe('');
  });

  it('muestra un error cuando el backend no responde y permite reintentar', async () => {
    // El primer GET ya se sirvió en el beforeEach; un reintento genera
    // una petición nueva que puede fallar.
    component.reintentar();
    httpMock.expectOne(URL_MEDICAMENTOS).flush(null, {
      status: 0,
      statusText: 'Network Error',
    });
    await esperarMicrotareas();

    expect(component.errorCarga()).toContain(
      'No se pudieron cargar los medicamentos'
    );

    // Reintentar de nuevo con el backend disponible recupera la lista.
    component.reintentar();
    httpMock.expectOne(URL_MEDICAMENTOS).flush(CATALOGO);
    await esperarMicrotareas();

    expect(component.errorCarga()).toBe('');
    expect(component.medicamentos().length).toBe(2);
  });

  it('filtra la tabla por nombre sin volver a llamar al backend', () => {
    component.filtroNombre.set('ibuprofeno');
    expect(component.listaMeds().length).toBe(1);
    expect(component.listaMeds()[0].id).toBe('MED-2');

    // Insensible a mayúsculas.
    component.filtroNombre.set('ACETA');
    expect(component.listaMeds()[0].id).toBe('MED-1');

    // El filtro es local: ninguna petición extra al backend.
    httpMock.verify();
  });

  it('filtra por laboratorio y limpia los filtros', () => {
    component.filtroLaboratorio.set('MK');
    expect(component.listaMeds().length).toBe(1);

    component.limpiarFiltros();
    expect(component.listaMeds().length).toBe(2);
  });

  it('valida el formulario antes de crear: exige código, nombre y laboratorio', () => {
    component.registrar();

    expect(component.mensajeError()).toContain('código');
    expect(component.mensajeError()).toContain('nombre');
    expect(component.mensajeError()).toContain('laboratorio');
    httpMock.verify(); // no hubo POST
  });

  it('valida que el código cumpla el formato del backend', () => {
    component.formulario = {
      id: 'ME!D',
      nombre: 'Acetaminofén',
      laboratorio: 'Genfar',
      descripcion: '',
      stock: 5,
      precioCompra: 1000,
      precioVenta: 2000,
    };

    component.registrar();

    expect(component.mensajeError()).toContain(
      'entre 3 y 20 caracteres'
    );
    httpMock.verify();
  });

  it('valida stock y precios antes de crear', () => {
    component.formulario = {
      id: 'MED-9',
      nombre: 'Dolex',
      laboratorio: 'GSK',
      descripcion: '',
      stock: -5,
      precioCompra: -1,
      precioVenta: 0,
    };

    component.registrar();

    expect(component.mensajeError()).toContain('stock');
    expect(component.mensajeError()).toContain('precio de compra');
    httpMock.verify();
  });

  async function esperarMicrotareas(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  it('crea un medicamento con POST sin enviar estado (lo deriva el servidor)', async () => {
    component.formulario = {
      id: 'MED-9',
      nombre: 'Dolex',
      laboratorio: 'GSK',
      descripcion: 'Analgésico',
      stock: 20,
      precioCompra: 500,
      precioVenta: 900,
    };

    component.registrar();

    const peticion = httpMock.expectOne(URL_MEDICAMENTOS);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({
      id: 'MED-9',
      nombre: 'Dolex',
      laboratorio: 'GSK',
      descripcion: 'Analgésico',
      stock: 20,
      precioCompra: 500,
      precioVenta: 900,
    });

    peticion.flush({ ...component.formulario, estado: 'Activo' });

    // Tras crear se recarga el catálogo (continúa en microtareas).
    await esperarMicrotareas();
    httpMock.expectOne(URL_MEDICAMENTOS).flush(CATALOGO);

    expect(component.mensajeExito()).toContain('MED-9 registrado');
    expect(component.editando()).toBe(false);
  });

  it('en edición envía PATCH sin el id en el cuerpo', async () => {
    component.seleccionar(CATALOGO[0]);
    expect(component.editando()).toBe(true);
    expect(component.formulario.nombre).toBe('Acetaminofén');

    component.formulario.stock = 45;
    component.registrarModificacion();

    const peticion = httpMock.expectOne(`${URL_MEDICAMENTOS}/MED-1`);
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual({
      nombre: 'Acetaminofén',
      laboratorio: 'Genfar',
      descripcion: 'Analgésico',
      stock: 45,
      precioCompra: 1000,
      precioVenta: 2000,
    });

    peticion.flush({ ...CATALOGO[0], stock: 45 });
    await esperarMicrotareas();
    httpMock.expectOne(URL_MEDICAMENTOS).flush([
      { ...CATALOGO[0], stock: 45 },
      CATALOGO[1],
    ]);

    expect(component.mensajeExito()).toContain('MED-1 actualizado');
  });

  it('pidió confirmación inline antes de eliminar y cancela sin llamar al backend', () => {
    component.seleccionar(CATALOGO[0]);
    component.borrar();

    expect(component.pendienteEliminar()?.id).toBe('MED-1');

    component.cancelarEliminar();
    expect(component.pendienteEliminar()).toBeNull();
    httpMock.verify(); // sin DELETE
  });

  it('elimina con DELETE y muestra el éxito', async () => {
    component.seleccionar(CATALOGO[1]);
    component.borrar();
    component.confirmarEliminar();

    const peticion = httpMock.expectOne(`${URL_MEDICAMENTOS}/MED-2`);
    expect(peticion.request.method).toBe('DELETE');
    peticion.flush(null, { status: 204, statusText: 'No Content' });

    await esperarMicrotareas();
    httpMock.expectOne(URL_MEDICAMENTOS).flush([CATALOGO[0]]);
    await esperarMicrotareas();

    expect(component.mensajeExito()).toContain('MED-2 eliminado');
    expect(component.medicamentos().length).toBe(1);
  });

  it('muestra el mensaje del backend cuando la eliminación falla (409 con ventas asociadas)', async () => {
    component.seleccionar(CATALOGO[0]);
    component.borrar();
    component.confirmarEliminar();

    httpMock
      .expectOne(`${URL_MEDICAMENTOS}/MED-1`)
      .flush(
        { message: 'No se puede eliminar: tiene ventas asociadas' },
        { status: 409, statusText: 'Conflict' }
      );
    await esperarMicrotareas();

    expect(component.mensajeError()).toBe(
      'No se puede eliminar: tiene ventas asociadas'
    );
    expect(component.pendienteEliminar()).toBeNull();
  });
});
