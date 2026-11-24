import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter, Router } from '@angular/router';

import { App } from './app';

@Component({ selector: 'stub', template: '' })
class Stub {}

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: 'login', component: Stub },
          { path: 'otra', component: Stub },
        ]),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debería crearse la app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra el encabezado con el título "Droguería Pili" en páginas con layout', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    // El layout se muestra solo fuera de /login, /register, /dashboard y /.
    await TestBed.inject(Router).navigateByUrl('/otra');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe(
      'Droguería Pili'
    );
  });

  it('no muestra el layout en /login', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await TestBed.inject(Router).navigateByUrl('/login');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')).toBeNull();
  });

  it('logout cierra la sesión por el camino único y navega al inicio', async () => {
    localStorage.setItem('access_token', 'jwt');
    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('usuario', 'ana');
    localStorage.setItem('rol', 'admin');

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await TestBed.inject(Router).navigateByUrl('/otra');

    fixture.componentInstance.logout();

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('loggedIn')).toBeNull();
    expect(localStorage.getItem('usuario')).toBeNull();
    expect(localStorage.getItem('rol')).toBeNull();

    // La navegación es asíncrona: se esperan las microtareas.
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(TestBed.inject(Router).url).toBe('/');
  });
});
