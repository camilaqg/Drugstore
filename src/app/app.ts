import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ChatbotComponent } from './components/chatbot/chatbot';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ChatbotComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {

  protected readonly title = signal('drugstore-system');

  mostrarLayout = false;

  // TEXTO QUE SE MOSTRARÁ ARRIBA
  textoUsuario: string = 'Admin';

  // INDICA SI ES UN USUARIO NORMAL
  esUsuario: boolean = false;

  constructor(private router: Router) {

    // ESTADO INICIAL
    const urlInicial = this.router.url;

    this.mostrarLayout = !(
      urlInicial === '/' ||
      urlInicial.includes('/login') ||
      urlInicial.includes('/register') ||
      urlInicial.includes('/dashboard')
    );

    // MOSTRAR NOMBRE REAL SOLO EN COMPRAS
    if (urlInicial.includes('/purchases')) {

      this.textoUsuario =
        localStorage.getItem('usuario') || 'Admin';

      this.esUsuario =
        localStorage.getItem('usuario') !== null;

    } else {

      this.textoUsuario = 'Admin';
      this.esUsuario = false;

    }

    // ESCUCHAR CAMBIOS DE RUTA
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

      // MOSTRAR NOMBRE REAL SOLO EN COMPRAS
      if (url.includes('/purchases')) {

        this.textoUsuario =
          localStorage.getItem('usuario') || 'Admin';

        this.esUsuario =
          localStorage.getItem('usuario') !== null;

      } else {

        this.textoUsuario = 'Admin';
        this.esUsuario = false;

      }

    });
  }

  ngOnInit() {
  }

  logout() {

    localStorage.removeItem('admin');
    localStorage.removeItem('usuario');

    this.router.navigate(['/']);
  }

  irAlMenu() {
    this.router.navigate(['/dashboard']);
  }
}