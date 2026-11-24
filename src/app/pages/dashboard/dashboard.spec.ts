import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter, Router } from '@angular/router';

import { Dashboard } from './dashboard';

@Component({ selector: 'stub', template: '' })
class Stub {}

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideRouter([{ path: '', component: Stub }])],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('muestra el usuario y el rol guardados en localStorage (solo para mostrar)', () => {
    localStorage.setItem('usuario', 'ana');
    localStorage.setItem('rol', 'admin');

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;

    expect(component.usuarioActual()).toBe('ana');
    expect(component.rol()).toBe('admin');
  });

  it('deja el usuario y el rol vacíos si no hay sesión guardada', () => {
    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;

    expect(component.usuarioActual()).toBe('');
    expect(component.rol()).toBe('');
  });

  it('salir borra las 4 claves de la sesión y navega al inicio', async () => {
    localStorage.setItem('access_token', 'jwt');
    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('usuario', 'ana');
    localStorage.setItem('rol', 'admin');

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;

    component.salir();

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('loggedIn')).toBeNull();
    expect(localStorage.getItem('usuario')).toBeNull();
    expect(localStorage.getItem('rol')).toBeNull();

    // La navegación es asíncrona: se esperan las microtareas.
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(router.url).toBe('/');
  });
});
