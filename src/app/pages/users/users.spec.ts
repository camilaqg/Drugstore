import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { Users } from './users';
import { Usuario } from '../../models/usuario';

const URL_USUARIOS = 'http://localhost:3000/usuario';
const URL_ME = 'http://localhost:3000/auth/me';

const LISTA: Usuario[] = [
  {
    id: 5,
    nombre: 'Laura Admin',
    correo: 'laura@pili.com',
    usuario: 'laura',
    rol: 'admin',
  },
  {
    id: 7,
    nombre: 'Camila Cliente',
    correo: 'camila@pili.com',
    usuario: 'camila',
    rol: 'cliente',
  },
];

// El admin que el backend confirma por GET /auth/me (quien está logueado).
const YO = {
  id: 5,
  nombre: 'Laura Admin',
  correo: 'laura@pili.com',
  usuario: 'laura',
  rol: 'admin',
};

async function esperarMicrotareas(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
}

describe('Users', () => {
  let component: Users;
  let fixture: ComponentFixture<Users>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem('access_token', 'token-de-prueba');

    await TestBed.configureTestingModule({
      imports: [Users],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Users);
    component = fixture.componentInstance;

    // El constructor dispara dos consultas: quién está logueado
    // (GET /auth/me) y la lista de usuarios (GET /usuario).
    httpMock.expectOne(URL_ME).flush(YO);
    httpMock.expectOne(URL_USUARIOS).flush(LISTA);
    await esperarMicrotareas();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('carga la lista de usuarios al entrar y confirma el id del logueado', () => {
    expect(component).toBeTruthy();
    expect(component.usuarios().length).toBe(2);
    expect(component.cargando()).toBe(false);
    expect(component.errorCarga()).toBe('');
    expect(component.idActual()).toBe(5);
  });

  it('muestra error de carga y permite reintentar', async () => {
    component.reintentar();
    httpMock.expectOne(URL_USUARIOS).flush(null, {
      status: 0,
      statusText: 'Network Error',
    });
    await esperarMicrotareas();

    expect(component.errorCarga()).toContain(
      'No se pudieron cargar los usuarios'
    );

    // Reintentar con el backend disponible recupera la lista.
    component.reintentar();
    httpMock.expectOne(URL_USUARIOS).flush(LISTA);
    await esperarMicrotareas();

    expect(component.errorCarga()).toBe('');
    expect(component.usuarios().length).toBe(2);
  });

  it('cambia el rol en línea con PATCH y confirma en línea', async () => {
    component.cambiarRol(LISTA[1], 'admin');

    const peticion = httpMock.expectOne(`${URL_USUARIOS}/7`);
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual({ rol: 'admin' });

    peticion.flush({ ...LISTA[1], rol: 'admin' });
    await esperarMicrotareas();

    // Tras el PATCH se recarga la lista desde el backend.
    httpMock.expectOne(URL_USUARIOS).flush([
      LISTA[0],
      { ...LISTA[1], rol: 'admin' },
    ]);
    await esperarMicrotareas();

    expect(component.mensajeExito()).toContain('Camila Cliente');
    expect(component.mensajeExito()).toContain('admin');
    expect(component.mensajeError()).toBe('');
  });

  it('muestra el mensaje del backend cuando el cambio de rol falla', async () => {
    component.cambiarRol(LISTA[1], 'admin');

    httpMock.expectOne(`${URL_USUARIOS}/7`).flush(
      { message: 'El correo ya está registrado' },
      { status: 409, statusText: 'Conflict' }
    );
    await esperarMicrotareas();

    expect(component.mensajeError()).toBe(
      'El correo ya está registrado'
    );

    // Tras el fallo el componente recarga la lista para restaurar el
    // select al rol real del backend.
    await esperarMicrotareas();
    httpMock.expectOne(URL_USUARIOS).flush(LISTA);
    await esperarMicrotareas();
  });

  it('edita nombre y correo con PATCH sin mandar la contraseña si quedó vacía', async () => {
    component.editar(LISTA[1]);
    expect(component.editandoId()).toBe(7);

    component.formularioEdicion.nombre = 'Camila Gómez';
    component.formularioEdicion.correo = 'camila.gomez@pili.com';
    component.guardarEdicion();

    const peticion = httpMock.expectOne(`${URL_USUARIOS}/7`);
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual({
      nombre: 'Camila Gómez',
      correo: 'camila.gomez@pili.com',
    });

    peticion.flush({ ...LISTA[1], nombre: 'Camila Gómez' });
    await esperarMicrotareas();
    httpMock.expectOne(URL_USUARIOS).flush(LISTA);
    await esperarMicrotareas();

    expect(component.mensajeExito()).toContain('actualizado');
    expect(component.editandoId()).toBeNull();
  });

  it('incluye la contraseña nueva en el PATCH cuando se digitó una', async () => {
    component.editar(LISTA[1]);
    component.formularioEdicion.contrasena = 'nuevaClave123';
    component.guardarEdicion();

    const peticion = httpMock.expectOne(`${URL_USUARIOS}/7`);
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual({
      nombre: 'Camila Cliente',
      correo: 'camila@pili.com',
      contrasena: 'nuevaClave123',
    });

    peticion.flush(LISTA[1]);
    await esperarMicrotareas();
    httpMock.expectOne(URL_USUARIOS).flush(LISTA);
    await esperarMicrotareas();
  });

  it('rechaza una contraseña corta en la edición sin llamar al backend', () => {
    component.editar(LISTA[1]);
    component.formularioEdicion.contrasena = 'corta';
    component.guardarEdicion();

    expect(component.mensajeError()).toContain('al menos 8 caracteres');
    httpMock.verify(); // sin PATCH
  });

  it('pide confirmación inline antes de eliminar y cancela sin llamar al backend', () => {
    component.borrar(LISTA[1]);
    expect(component.pendienteEliminar()?.id).toBe(7);

    component.cancelarEliminar();
    expect(component.pendienteEliminar()).toBeNull();
    httpMock.verify(); // sin DELETE
  });

  it('elimina con confirmación y DELETE', async () => {
    component.borrar(LISTA[1]);
    component.confirmarEliminar();

    const peticion = httpMock.expectOne(`${URL_USUARIOS}/7`);
    expect(peticion.request.method).toBe('DELETE');
    peticion.flush(null, { status: 200, statusText: 'OK' });

    await esperarMicrotareas();
    httpMock.expectOne(URL_USUARIOS).flush([LISTA[0]]);
    await esperarMicrotareas();

    expect(component.mensajeExito()).toContain('eliminado');
    expect(component.usuarios().length).toBe(1);
  });

  it('bloquea el borrado del propio usuario logueado sin llamar a DELETE', async () => {
    // idActual() es 5 (confirmado por /auth/me) y LISTA[0].id también.
    component.borrar(LISTA[0]);

    expect(component.mensajeError()).toContain('propio usuario');
    expect(component.pendienteEliminar()).toBeNull();
    httpMock.verify(); // sin DELETE
  });

  it('muestra el mensaje del backend cuando la eliminación falla (409)', async () => {
    component.borrar(LISTA[1]);
    component.confirmarEliminar();

    httpMock.expectOne(`${URL_USUARIOS}/7`).flush(
      { message: 'No se puede eliminar el usuario' },
      { status: 409, statusText: 'Conflict' }
    );
    await esperarMicrotareas();

    expect(component.mensajeError()).toBe('No se puede eliminar el usuario');
    expect(component.pendienteEliminar()).toBeNull();
  });

  it('muestra el estado de lista vacía cuando el backend no devuelve usuarios', async () => {
    component.reintentar();
    httpMock.expectOne(URL_USUARIOS).flush([]);
    await esperarMicrotareas();

    expect(component.usuarios().length).toBe(0);
    expect(component.cargando()).toBe(false);

    fixture.detectChanges();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('No hay usuarios registrados');
  });
});
