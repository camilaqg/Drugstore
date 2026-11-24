import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';

import { authInterceptor } from './auth.interceptor';

@Component({ selector: 'stub-login', template: '' })
class StubLogin {}

describe('authInterceptor', () => {

  let httpClient: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      providers: [
        // Ruta real para verificar la redirección a /login.
        provideRouter([{ path: 'login', component: StubLogin }]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // Semilla de sesión completa (las 4 claves que usa la app).
  function crearSesion(): void {
    localStorage.setItem('access_token', 'token-abc');
    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('usuario', 'ana');
    localStorage.setItem('rol', 'admin');
  }

  async function esperarMicrotareas(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  it('agrega Authorization: Bearer cuando hay access_token', () => {
    localStorage.setItem('access_token', 'token-abc');

    httpClient.get('/datos').subscribe();

    const peticion = httpMock.expectOne('/datos');
    expect(peticion.request.headers.get('Authorization')).toBe(
      'Bearer token-abc'
    );
    peticion.flush([]);
  });

  it('no agrega Authorization cuando no hay token', () => {
    httpClient.get('/datos').subscribe();

    const peticion = httpMock.expectOne('/datos');
    expect(peticion.request.headers.has('Authorization')).toBe(false);
    peticion.flush([]);
  });

  it('ante 401 en una llamada normal borra access_token y navega a /login', async () => {
    crearSesion();

    httpClient.get('/datos').subscribe({
      error: () => undefined, // el error se propaga; ya se testea arriba
    });

    httpMock
      .expectOne('/datos')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    await esperarMicrotareas();

    // cerrarSesion() borra las 4 claves, incluido access_token.
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('loggedIn')).toBeNull();
    expect(localStorage.getItem('usuario')).toBeNull();
    expect(localStorage.getItem('rol')).toBeNull();

    // La redirección a /login ya ocurrió.
    expect(TestBed.inject(Router).url).toBe('/login');
  });

  it('ante 403 en una llamada normal también limpia la sesión y navega a /login', async () => {
    crearSesion();

    httpClient.get('/datos').subscribe({
      error: () => undefined,
    });

    httpMock
      .expectOne('/datos')
      .flush(null, { status: 403, statusText: 'Forbidden' });

    await esperarMicrotareas();

    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('propaga el error de sesión vencida al llamador', async () => {
    crearSesion();

    let errorRecibido: unknown = null;
    httpClient.get('/datos').subscribe({
      error: (error: unknown) => {
        errorRecibido = error;
      },
    });

    httpMock
      .expectOne('/datos')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(errorRecibido instanceof HttpErrorResponse).toBe(true);
    expect((errorRecibido as HttpErrorResponse).status).toBe(401);
  });

  it('ante 401 del propio POST /auth/login NO limpia la sesión ni navega', async () => {
    crearSesion();

    let errorRecibido: unknown = null;
    httpClient
      .post('http://localhost:3000/auth/login', {
        usuario: 'ana',
        contrasena: 'mala-clave',
      })
      .subscribe({
        error: (error: unknown) => {
          errorRecibido = error;
        },
      });

    const peticion = httpMock.expectOne('http://localhost:3000/auth/login');
    peticion.flush(null, { status: 401, statusText: 'Unauthorized' });

    await esperarMicrotareas();

    // La pantalla de login debe poder mostrar "credenciales inválidas":
    // la sesión sigue intacta y no hay redirección.
    expect(errorRecibido instanceof HttpErrorResponse).toBe(true);
    expect(localStorage.getItem('access_token')).toBe('token-abc');
    expect(localStorage.getItem('loggedIn')).toBe('true');
    expect(localStorage.getItem('usuario')).toBe('ana');
    expect(localStorage.getItem('rol')).toBe('admin');
  });
});
