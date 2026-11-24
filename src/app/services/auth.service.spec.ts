import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { AuthService } from './auth.service';

const URL_LOGIN = 'http://localhost:3000/auth/login';
const URL_ME = 'http://localhost:3000/auth/me';

describe('AuthService', () => {

  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('login hace POST a /auth/login con las credenciales', () => {
    service.login({ usuario: 'ana', contrasena: 'clave-secreta' }).subscribe();

    const peticion = httpMock.expectOne(URL_LOGIN);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({
      usuario: 'ana',
      contrasena: 'clave-secreta',
    });

    peticion.flush({
      access_token: 'jwt',
      token_type: 'Bearer',
      expires_in: 3600,
    });
  });

  it('cerrarSesion borra las 4 claves del localStorage', () => {
    localStorage.setItem('access_token', 'jwt');
    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('usuario', 'ana');
    localStorage.setItem('rol', 'admin');
    service.recordarRol('admin');

    service.cerrarSesion();

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('loggedIn')).toBeNull();
    expect(localStorage.getItem('usuario')).toBeNull();
    expect(localStorage.getItem('rol')).toBeNull();
  });

  it('cerrarSesion limpia el rol de autoridad: rolConfirmado vuelve a null sin token', () => {
    service.recordarRol('admin');
    service.cerrarSesion();

    expect(service.rolConfirmado()).resolves.toBeNull();
  });

  it('rolConfirmado pide el rol a GET /auth/me y lo devuelve', async () => {
    localStorage.setItem('access_token', 'jwt');

    const promesa = service.rolConfirmado();

    const peticion = httpMock.expectOne(URL_ME);
    expect(peticion.request.method).toBe('GET');
    peticion.flush({ id: 1, usuario: 'ana', rol: 'admin' });

    await expect(promesa).resolves.toBe('admin');
  });

  it('rolConfirmado recuerda el rol: la segunda llamada no vuelve a pedirlo', async () => {
    localStorage.setItem('access_token', 'jwt');

    const primera = service.rolConfirmado();
    httpMock
      .expectOne(URL_ME)
      .flush({ id: 1, usuario: 'ana', rol: 'cliente' });
    await expect(primera).resolves.toBe('cliente');

    const segunda = await service.rolConfirmado();
    expect(segunda).toBe('cliente');

    // Sin una segunda petición pendiente: el rol vino de la memoria.
    httpMock.verify();
  });

  it('rolConfirmado sin token devuelve null sin llamar al backend', async () => {
    await expect(service.rolConfirmado()).resolves.toBeNull();
    httpMock.verify();
  });

  it('rolConfirmado con error del backend devuelve null', async () => {
    localStorage.setItem('access_token', 'jwt');

    const promesa = service.rolConfirmado();

    httpMock
      .expectOne(URL_ME)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    await expect(promesa).resolves.toBeNull();
  });
});
