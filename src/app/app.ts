import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true, 
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {

  protected readonly title = signal('drugstore-system');

  mostrarLayout = false; 

  constructor(private router: Router) {

    // ESTADO INICIAL
    const urlInicial = this.router.url;

    this.mostrarLayout = !(
      urlInicial === '/' ||
      urlInicial.includes('/login') ||
      urlInicial.includes('/register') ||
      urlInicial.includes('/dashboard')
    );

    // PARA ESCUCHAR LOS CAMBIOS DE LA RUTA Y QUE NO APAREZCA LA BARRA DE NAVEGACION EN LAS PÁGINAS DE LOGIN, REGISTRO Y DASHBOARD
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {

      const url = event.urlAfterRedirects;

      this.mostrarLayout = !(
        url === '/' ||
        url.includes('/login') ||
        url.includes('/register') ||
        url.includes('/dashboard')
      );
    });
  }

  logout() {
    localStorage.removeItem('admin');
    this.router.navigate(['/']);
  }

  irAlMenu() {
    this.router.navigate(['/dashboard']);
  }
}