import { Component, signal, OnInit, inject } from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
  NavigationEnd
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { ChatbotComponent } from './components/chatbot/chatbot';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ChatbotComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {

  protected readonly title = signal('drugstore-system');

  // ESTADO (signals)
  readonly mostrarLayout = signal(false);
  readonly textoUsuario = signal('Admin');

  // true = usuario normal, false = administrador
  readonly esUsuario = signal(false);

  private readonly router = inject(Router);

  ngOnInit() {
    // Estado inicial
    this.actualizarEstado(this.router.url);

    // Escuchar cambios de ruta
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(event => {
      this.actualizarEstado(event.urlAfterRedirects);
    });
  }

  private actualizarEstado(url: string) {
    this.mostrarLayout.set(
      !(
        url === '/' ||
        url.includes('/login') ||
        url.includes('/register') ||
        url.includes('/dashboard')
      )
    );

    // Mostrar nombre real solo en compras
    if (url.includes('/purchases')) {
      this.textoUsuario.set(localStorage.getItem('usuario') || 'Admin');
      this.esUsuario.set(localStorage.getItem('rol') !== 'admin');
    } else {
      this.textoUsuario.set('Admin');
      this.esUsuario.set(false);
    }
  }

  logout() {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');

    this.router.navigate(['/']);
  }

  irAlMenu() {
    this.router.navigate(['/dashboard']);
  }
}