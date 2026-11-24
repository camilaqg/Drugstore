import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../services/auth.service';
import { ActualizarUsuario, RolUsuario, Usuario } from '../../models/usuario';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class Users {

  // servicio HTTP contra el backend, sesión y router de la app
  private readonly servicio = inject(UsuarioService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Estado de la pantalla (signals)
  readonly cargando = signal(true);
  readonly errorCarga = signal('');
  readonly mensajeError = signal('');
  readonly mensajeExito = signal('');

  // Lista completa que viene del backend
  readonly usuarios = signal<Usuario[]>([]);

  // Id del usuario logueado, confirmado por el backend con GET /auth/me
  // (AuthService). NO se compara por nombre ni con el rol de
  // localStorage: el id de /auth/me es la autoridad. Se usa SOLO para
  // bloquear el auto-borrado; el acceso a la ruta lo decide el roleGuard.
  readonly idActual = signal<number | null>(null);

  // Usuario marcado para borrar, a la espera de la confirmación inline
  readonly pendienteEliminar = signal<Usuario | null>(null);

  // Id del usuario en edición (null = solo tabla, sin formulario)
  readonly editandoId = signal<number | null>(null);

  // Formulario de edición (ngModel). La contraseña es opcional: vacía
  // significa "no cambiar la contraseña".
  formularioEdicion = { nombre: '', correo: '', contrasena: '' };

  constructor() {
    // cargamos la lista del backend apenas entra la página
    void this.cargar();
    void this.cargarUsuarioActual();
  }

  // Carga (o recarga) la lista desde el backend
  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.errorCarga.set('');

    try {
      const datos = await firstValueFrom(this.servicio.listar());
      this.usuarios.set(datos);
    } catch {
      this.errorCarga.set('No se pudieron cargar los usuarios del backend.');
    } finally {
      this.cargando.set(false);
    }
  }

  // botón Reintentar del bloque de error de carga
  reintentar() {
    void this.cargar();
  }

  // Pregunta al backend quién está logueado (GET /auth/me) y guarda su
  // id. Es el dato confirmado, no el nombre guardado en localStorage.
  private async cargarUsuarioActual(): Promise<void> {
    try {
      const actual = await firstValueFrom(this.authService.me());
      this.idActual.set(actual.id);
    } catch {
      // Sin id confirmado no se puede distinguir el propio usuario. El
      // backend igual vuelve a exigir admin en cada llamada.
      this.idActual.set(null);
    }
  }

  // Cambio de rol en línea: el select de la fila dispara el PATCH.
  async cambiarRol(usuario: Usuario, valor: string): Promise<void> {
    const id = usuario.id;
    if (id === undefined) {
      return;
    }

    const nuevoRol = valor as RolUsuario;

    // Solo los dos roles que acepta el backend, y nada que hacer si el
    // rol no cambió de verdad.
    if (nuevoRol !== 'admin' && nuevoRol !== 'cliente') {
      return;
    }
    if (nuevoRol === usuario.rol) {
      return;
    }

    this.mensajeError.set('');
    this.mensajeExito.set('');

    try {
      await firstValueFrom(this.servicio.actualizar(id, { rol: nuevoRol }));
      this.mensajeExito.set(`Rol de ${usuario.nombre} cambiado a ${nuevoRol}.`);
      await this.cargar();
    } catch (error: unknown) {
      this.mostrarError(this.extraerErrorBackend(error));
      // Se recarga para que el select vuelva al rol real del backend.
      await this.cargar();
    }
  }

  // Botón Editar de la fila: abre el panel de edición inline
  editar(usuario: Usuario) {
    this.editandoId.set(usuario.id ?? null);
    this.formularioEdicion = {
      nombre: usuario.nombre,
      correo: usuario.correo,
      contrasena: ''
    };
    this.mensajeError.set('');
    this.mensajeExito.set('');
    this.pendienteEliminar.set(null);
  }

  // Cancela la edición inline
  cancelarEdicion() {
    this.editandoId.set(null);
    this.formularioEdicion = { nombre: '', correo: '', contrasena: '' };
  }

  // Guarda la edición con PATCH. La contraseña solo se manda si el
  // admin digitó una nueva (mínimo 8 caracteres, como exige el backend).
  async guardarEdicion(): Promise<void> {
    const id = this.editandoId();
    if (id === null) {
      return;
    }

    const nombre = this.formularioEdicion.nombre.trim();
    const correo = this.formularioEdicion.correo.trim();
    const contrasena = this.formularioEdicion.contrasena;

    const errores: string[] = [];
    if (!nombre) {
      errores.push('El nombre no puede estar vacío.');
    }
    if (!correo) {
      errores.push('El correo no puede estar vacío.');
    }
    if (contrasena.length > 0 && contrasena.length < 8) {
      errores.push('La contraseña nueva debe tener al menos 8 caracteres (o dejarla vacía para no cambiarla).');
    }
    if (errores.length > 0) {
      this.mostrarError(errores.join(' '));
      return;
    }

    const datos: ActualizarUsuario = { nombre, correo };
    if (contrasena.length > 0) {
      datos.contrasena = contrasena;
    }

    try {
      await firstValueFrom(this.servicio.actualizar(id, datos));
      this.mensajeExito.set(`Usuario ${nombre} actualizado con éxito.`);
      this.cancelarEdicion();
      await this.cargar();
    } catch (error: unknown) {
      this.mostrarError(this.extraerErrorBackend(error));
    }
  }

  // Botón Eliminar de la fila: bloquea el auto-borrado y si no, pide
  // confirmación inline (sin confirm() del navegador).
  borrar(usuario: Usuario) {
    const id = usuario.id;
    if (id === undefined) {
      return;
    }

    // Bloqueo de borrarse a sí mismo: se compara el id de la fila con el
    // id confirmado por GET /auth/me, nunca el nombre (los nombres se
    // pueden editar y duplicar). Eliminar la propia cuenta mataría la
    // sesión del admin en medio del trabajo.
    if (id === this.idActual()) {
      this.mostrarError('No puede eliminar su propio usuario: cerraría su propia sesión.');
      return;
    }

    this.mensajeError.set('');
    this.mensajeExito.set('');
    this.pendienteEliminar.set(usuario);
  }

  // confirmación inline: efectúa el DELETE contra el backend
  async confirmarEliminar(): Promise<void> {
    const pendiente = this.pendienteEliminar();
    if (!pendiente || pendiente.id === undefined) {
      return;
    }

    const id = pendiente.id;

    try {
      await firstValueFrom(this.servicio.eliminar(id));
      this.mensajeExito.set(`Usuario ${pendiente.usuario} eliminado con éxito.`);
      this.pendienteEliminar.set(null);
      await this.cargar();
    } catch (error: unknown) {
      // Se muestra el mensaje del backend tal cual (409, 404, etc.).
      this.mostrarError(this.extraerErrorBackend(error));
      this.pendienteEliminar.set(null);
    }
  }

  // cancela la confirmación inline
  cancelarEliminar() {
    this.pendienteEliminar.set(null);
  }

  // muestra un error inline y limpia el mensaje de éxito
  private mostrarError(mensaje: string) {
    this.mensajeError.set(mensaje);
    this.mensajeExito.set('');
  }

  // Traducción del error HTTP a un mensaje visible. La respuesta de
  // error de NestJS siempre trae `message` (string o lista de strings
  // con las validaciones de class-validator).
  private extraerErrorBackend(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const mensaje = (error.error as { message?: unknown } | null)?.message;

      if (Array.isArray(mensaje)) {
        return mensaje
          .filter((m): m is string => typeof m === 'string')
          .join(' ');
      }

      if (typeof mensaje === 'string' && mensaje.length > 0) {
        return mensaje;
      }

      if (error.status === 0) {
        return 'No hay conexión con el servidor.';
      }

      return `Error del servidor (código ${error.status}).`;
    }

    return 'Ocurrió un error inesperado.';
  }

  // botón Salir
  irAlMenu() {
    this.router.navigate(['/dashboard']);
  }
}
