import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { Login } from './login';

@Component({ selector: 'stub', template: '' })
class Stub {}

const URL_LOGIN = 'http://localhost:3000/auth/login';
const URL_ME = 'http://localhost:3000/auth/me';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([
          { path: 'login', component: Stub },
          { path: 'dashboard', component: Stub },
        ]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  function llenar(usuario: string, contrasena: string): void {
    component.username.set(usuario);
    component.password.set(contrasena);
  }

  it('marca el error de campos vacíos sin llamar al backend', () => {
    llenar('', '');

    component.login();

    expect(component.errorCampos()).toBe(true);
    expect(component.errorCredenciales()).toBe(false);
    expect(component.errorServidor()).toBe(false);
    httpMock.verify(); // no hubo peticiones
  });

  it('acepta el login con usuario y contraseña presentes', () => {
    llenar('ana', 'clave-secreta');

    component.login();

    const peticion = httpMock.expectOne(URL_LOGIN);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({
      usuario: 'ana',
      contrasena: 'clave-secreta',
    });
    peticion.flush({ access_token: 'jwt', token_type: 'Bearer', expires_in: 3600 });
    httpMock.expectOne(URL_ME).flush({ id: 1, usuario: 'ana', rol: 'admin' });
  });

  it('con credenciales inválidas (401) muestra el error de credenciales y NO guarda token', async () => {
    llenar('ana', 'clave-mala');

    component.login();

    const peticion = httpMock.expectOne(URL_LOGIN);
    peticion.flush(
      { message: 'Credenciales inválidas' },
      { status: 401, statusText: 'Unauthorized' }
    );

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(component.errorCredenciales()).toBe(true);
    expect(component.errorServidor()).toBe(false);
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('con fallo de red marca error de servidor (distinto de credenciales inválidas)', async () => {
    llenar('ana', 'clave-secreta');

    component.login();

    httpMock
      .expectOne(URL_LOGIN)
      .error(new ProgressEvent('network error'));

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(component.errorServidor()).toBe(true);
    expect(component.errorCredenciales()).toBe(false);
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('con login exitoso guarda el token y consulta el rol del backend', async () => {
    llenar('ana', 'clave-secreta');

    component.login();

    httpMock
      .expectOne(URL_LOGIN)
      .flush({ access_token: 'jwt', token_type: 'Bearer', expires_in: 3600 });

    // El token queda guardado antes de consultar /auth/me.
    expect(localStorage.getItem('access_token')).toBe('jwt');
    expect(localStorage.getItem('loggedIn')).toBe('true');
    expect(localStorage.getItem('usuario')).toBe('ana');

    const peticionMe = httpMock.expectOne(URL_ME);
    peticionMe.flush({ id: 1, usuario: 'ana', rol: 'admin' });

    await new Promise(resolve => setTimeout(resolve, 0));

    // El rol que autoriza lo confirma el backend, no localStorage.
    expect(localStorage.getItem('rol')).toBe('admin');
    expect(router.url).toBe('/dashboard');
  });

  it('si falla /auth/me tras un login exitoso limpia la sesión y marca error de servidor', async () => {
    llenar('ana', 'clave-secreta');

    component.login();

    httpMock
      .expectOne(URL_LOGIN)
      .flush({ access_token: 'jwt', token_type: 'Bearer', expires_in: 3600 });

    httpMock
      .expectOne(URL_ME)
      .flush(null, { status: 500, statusText: 'Server Error' });

    await new Promise(resolve => setTimeout(resolve, 0));

    // No quedan credenciales a medias: el login se aborta completo.
    // (La pantalla de login no navega: eso lo hace el interceptor ante
    // 401 de sesión vencida; acá el flujo termina en la misma página.)
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('rol')).toBeNull();
    expect(component.errorServidor()).toBe(true);
  });
});
