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
import { AuthService } from './services/auth.service';
import { MotionService } from './services/motion.service';

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
  private readonly authService = inject(AuthService);
  private readonly motion = inject(MotionService);

  constructor() {
    // Browser-only, SSR-safe: the controller never runs during server render.
    this.motion.boot();
  }

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

    // Mostrar nombre real solo en compras y en la gestión de usuarios.
    // El rol de localStorage se usa acá solo para MOSTRAR, nunca para
    // autorizar: el rol que decide el acceso lo confirma el backend
    // (ver role.guard.ts).
    if (url.includes('/purchases') || url.includes('/usuarios')) {
      this.textoUsuario.set(localStorage.getItem('usuario') || 'Admin');
      this.esUsuario.set(localStorage.getItem('rol') !== 'admin');
    } else {
      this.textoUsuario.set('Admin');
      this.esUsuario.set(false);
    }
  }

  logout() {
    // Camino único de cierre de sesión (AuthService): borra también
    // access_token, así el guard ya no ve sesión válida tras "Salir"
    this.authService.cerrarSesion();

    this.router.navigate(['/']);
  }

  irAlMenu() {
    this.router.navigate(['/dashboard']);
  }
}