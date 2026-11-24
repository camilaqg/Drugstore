import { TestBed } from '@angular/core/testing';
import { provideRouter, UrlTree } from '@angular/router';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { Data, ActivatedRouteSnapshot, Route } from '@angular/router';

import { roleGuard } from './role.guard';

// GET /auth/me es la única fuente de verdad del rol (AuthService).
const URL_ME = 'http://localhost:3000/auth/me';

describe('roleGuard', () => {

  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // Ejecuta el guard con una ruta que declara los roles indicados.
  function correrGuard(data: Data): Promise<boolean | UrlTree> {
    const route = { data } as Route;
    return TestBed.runInInjectionContext(
      () => roleGuard(route as unknown as ActivatedRouteSnapshot, {} as never)
    ) as Promise<boolean | UrlTree>;
  }

  async function confirmarRol(rol: string): Promise<void> {
    const peticion = httpMock.expectOne(URL_ME);
    peticion.flush({ id: 1, usuario: 'ana', rol });
  }

  it('sin access_token redirige a /login', async () => {
    localStorage.removeItem('access_token');

    const resultado = await correrGuard({ roles: ['admin'] });

    expect(resultado instanceof UrlTree).toBe(true);
    expect((resultado as UrlTree).toString()).toBe('/login');
    httpMock.verify();
  });

  it('si el backend no confirma el rol (token inválido) redirige a /login', async () => {
    localStorage.setItem('access_token', 'token-invalido');

    const promesa = correrGuard({ roles: ['admin'] });

    // GET /auth/me falla: no hay rol confirmado → no puede autorizar.
    const peticion = httpMock.expectOne(URL_ME);
    peticion.flush(null, { status: 401, statusText: 'Unauthorized' });

    const resultado = await promesa;

    expect(resultado instanceof UrlTree).toBe(true);
    expect((resultado as UrlTree).toString()).toBe('/login');
  });

  it('deja pasar cuando el rol confirmado por el backend está permitido', async () => {
    localStorage.setItem('access_token', 'token-valido');

    const promesa = correrGuard({ roles: ['admin'] });
    await confirmarRol('admin');

    const resultado = await promesa;

    expect(resultado).toBe(true);
  });

  it('NO autoriza con un rol inventado en localStorage: usa el rol que confirma el backend', async () => {
    // El atacante se sube el rol en las devtools: localStorage dice
    // "admin", pero el backend confirma "cliente". El guard debe usar
    // el rol del backend y bloquear el acceso.
    localStorage.setItem('access_token', 'token-valido');
    localStorage.setItem('rol', 'admin');

    const promesa = correrGuard({ roles: ['admin'] });
    await confirmarRol('cliente');

    const resultado = await promesa;

    expect(resultado instanceof UrlTree).toBe(true);
    expect((resultado as UrlTree).toString()).toBe('/dashboard');
  });

  it('envía al dashboard a un rol confirmado que no está en data.roles', async () => {
    localStorage.setItem('access_token', 'token-valido');

    const promesa = correrGuard({ roles: ['admin'] });
    await confirmarRol('cliente');

    const resultado = await promesa;

    expect(resultado instanceof UrlTree).toBe(true);
    expect((resultado as UrlTree).toString()).toBe('/dashboard');
  });
});
