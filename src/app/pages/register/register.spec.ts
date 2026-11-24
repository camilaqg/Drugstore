import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { RegisterComponent } from './register';

@Component({ selector: 'stub', template: '' })
class Stub {}

const URL_USUARIO = 'http://localhost:3000/usuario';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let httpMock: HttpTestingController;
  let router: Router;
  let alertas: any = null;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([{ path: 'login', component: Stub }]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    alertas = vi.spyOn(window, 'alert');
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  function llenar(
    contrasena = 'clave-secreta',
    confirmacion = contrasena
  ): void {
    component.name.set('Ana Pérez');
    component.email.set('ana@correo.com');
    component.username.set('ana');
    component.password.set(contrasena);
    component.confirmPassword.set(confirmacion);
  }

  it('rechaza campos vacíos sin llamar al backend', () => {
    component.register();

    expect(alertas).toHaveBeenCalledWith('Todos los campos son obligatorios');
    httpMock.verify();
  });

  it('exige una contraseña de mínimo 8 caracteres', () => {
    llenar('corta', 'corta');

    component.register();

    expect(alertas).toHaveBeenCalledWith(
      'La contraseña debe tener mínimo 8 caracteres'
    );
    httpMock.verify();
  });

  it('rechaza contraseñas que no coinciden', () => {
    llenar('clave-secreta', 'otra-clave');

    component.register();

    expect(alertas).toHaveBeenCalledWith('Las contraseñas no coinciden');
    httpMock.verify();
  });

  it('envía el registro al backend con rol cliente', async () => {
    llenar();

    component.register();

    const peticion = httpMock.expectOne(URL_USUARIO);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({
      nombre: 'Ana Pérez',
      correo: 'ana@correo.com',
      usuario: 'ana',
      contrasena: 'clave-secreta',
      rol: 'cliente',
    });

    peticion.flush({ id: 9, nombre: 'Ana Pérez' });

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(alertas).toHaveBeenCalledWith('Usuario registrado correctamente');
    expect(router.url).toBe('/login');
  });

  it('informa cuando el backend rechaza el registro (correo duplicado 409)', async () => {
    llenar();

    component.register();

    httpMock
      .expectOne(URL_USUARIO)
      .flush(
        { message: 'El correo ya está registrado' },
        { status: 409, statusText: 'Conflict' }
      );

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(alertas).toHaveBeenCalledWith('No se pudo registrar el usuario');
    expect(router.url).not.toBe('/login');
  });
});
