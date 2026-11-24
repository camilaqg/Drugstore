import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MedicamentoService } from '../../services/medicamento.service';
import {
  Medicamento,
  MedicamentoFormulario,
} from '../../models/medicamento';

// Mismo formato de código que valida el backend: 3 a 20 caracteres
// (letras, números o guiones).
const REGEX_CODIGO = /^[A-Za-z0-9-]{3,20}$/;

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css'
})
export class Inventory {

  // servicio HTTP contra el backend y router de la app
  private readonly servicio = inject(MedicamentoService);
  private readonly router = inject(Router);

  // Estado de la pantalla (signals)
  readonly cargando = signal(true);
  readonly errorCarga = signal('');
  readonly mensajeError = signal('');
  readonly mensajeExito = signal('');

  // Medicamento marcado para borrar, a la espera de la confirmación inline
  readonly pendienteEliminar = signal<Medicamento | null>(null);

  // Id del medicamento seleccionado en la tabla (para editar / eliminar)
  readonly seleccionadoId = signal('');

  // El formulario arranca en modo creación; con una fila seleccionada
  // pasa a modo edición y el id deja de ser editable.
  readonly editando = signal(false);

  // Lista completa que viene del backend
  readonly medicamentos = signal<Medicamento[]>([]);

  // Filtros por nombre y laboratorio, aplicados sobre la lista ya
  // cargada: la tabla es pequeña y así el filtro es instantáneo, sin
  // golpear el backend en cada tecleo. El backend también acepta los
  // mismos filtros por query string (servicio.listar) por si se quiere
  // filtrar en el servidor más adelante.
  readonly filtroNombre = signal('');
  readonly filtroLaboratorio = signal('');

  // lista que se muestra en la tabla (se recalcula sola)
  readonly listaMeds = computed(() => {
    const nombre = this.filtroNombre().trim().toLowerCase();
    const laboratorio = this.filtroLaboratorio().trim().toLowerCase();

    return this.medicamentos().filter(m =>
      (!nombre || m.nombre.toLowerCase().includes(nombre)) &&
      (!laboratorio || m.laboratorio.toLowerCase().includes(laboratorio))
    );
  });

  // objeto para limpiar o llenar el formulario (se queda normal por ngModel)
  // NO lleva `estado`: lo deriva el servidor a partir del stock.
  formulario: MedicamentoFormulario = {
    id: '',
    nombre: '',
    laboratorio: '',
    descripcion: '',
    stock: 0,
    precioCompra: 0,
    precioVenta: 0
  };

  constructor() {
    // cargamos la lista del backend apenas entra la página
    void this.cargar();
  }

  // Carga (o recarga) la lista desde el backend
  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.errorCarga.set('');

    try {
      const datos = await firstValueFrom(this.servicio.listar());
      this.medicamentos.set(datos);
    } catch {
      this.errorCarga.set('No se pudieron cargar los medicamentos del backend.');
    } finally {
      this.cargando.set(false);
    }
  }

  // botón Reintentar del bloque de error de carga
  reintentar() {
    void this.cargar();
  }

  // Validaciones del formulario en TypeScript, no solo con `min` del HTML.
  // Devuelve la lista de mensajes (vacía si todo está bien).
  private validar(): string[] {
    const errores: string[] = [];
    const stock = Number(this.formulario.stock);
    const compra = Number(this.formulario.precioCompra);
    const venta = Number(this.formulario.precioVenta);

    // El id solo se valida al crear: en edición no se modifica.
    if (!this.editando()) {
      const codigo = this.formulario.id.trim();
      if (!codigo) {
        errores.push('El código del medicamento no puede estar vacío.');
      } else if (!REGEX_CODIGO.test(codigo)) {
        errores.push('El código debe tener entre 3 y 20 caracteres (letras, números o guiones).');
      }
    }

    if (!this.formulario.nombre.trim()) {
      errores.push('El nombre no puede estar vacío.');
    }

    if (!this.formulario.laboratorio.trim()) {
      errores.push('El laboratorio no puede estar vacío.');
    }

    if (!Number.isInteger(stock) || stock < 0) {
      errores.push('El stock debe ser un número entero mayor o igual a 0.');
    }

    if (!Number.isFinite(compra) || compra < 0) {
      errores.push('El precio de compra debe ser mayor o igual a 0.');
    }

    if (!Number.isFinite(venta) || venta < 0) {
      errores.push('El precio de venta debe ser mayor o igual a 0.');
    }

    return errores;
  }

  // cuando haces clic en la fila de la tabla: pasa a modo edición
  seleccionar(m: Medicamento) {
    this.editando.set(true);
    this.seleccionadoId.set(m.id);
    this.formulario = {
      id: m.id,
      nombre: m.nombre,
      laboratorio: m.laboratorio,
      descripcion: m.descripcion,
      stock: m.stock,
      precioCompra: m.precioCompra,
      precioVenta: m.precioVenta
    };
    this.mensajeError.set('');
    this.mensajeExito.set('');
    this.pendienteEliminar.set(null);
  }

  // botón Registrar: crea uno nuevo contra el POST del backend.
  // Si estaba en modo edición, vuelve a modo creación con el formulario
  // en blanco para que el usuario no dé de alta un duplicado.
  registrar() {
    if (this.editando()) {
      this.limpiar();
    }

    const errores = this.validar();
    if (errores.length > 0) {
      this.mostrarError(errores.join(' '));
      return;
    }

    void this.crear();
  }

  private async crear(): Promise<void> {
    try {
      const creado = await firstValueFrom(this.servicio.crear(this.formulario));
      this.mensajeExito.set(`Medicamento ${creado.id} registrado con éxito.`);
      this.limpiarSinMensajes();
      await this.cargar();
    } catch (error: unknown) {
      this.mostrarError(this.extraerErrorBackend(error));
    }
  }

  // botón Modificar: guarda la edición del medicamento seleccionado
  registrarModificacion() {
    if (!this.editando()) {
      this.mostrarError('Primero seleccione un medicamento de la tabla para modificar.');
      return;
    }

    const errores = this.validar();
    if (errores.length > 0) {
      this.mostrarError(errores.join(' '));
      return;
    }

    void this.actualizar();
  }

  private async actualizar(): Promise<void> {
    // El id no se modifica: se manda solo en la URL. El cuerpo NO lleva
    // `estado` (lo recalcula el servidor a partir del stock).
    const { id: _id, ...datos } = this.formulario;

    try {
      await firstValueFrom(this.servicio.actualizar(this.seleccionadoId(), datos));
      this.mensajeExito.set(`Medicamento ${this.seleccionadoId()} actualizado con éxito.`);
      this.limpiarSinMensajes();
      await this.cargar();
    } catch (error: unknown) {
      this.mostrarError(this.extraerErrorBackend(error));
    }
  }

  // botón Eliminar: pide confirmación inline (sin confirm() del navegador)
  borrar() {
    const id = this.seleccionadoId();

    if (!id) {
      this.mostrarError('Primero seleccione un medicamento de la tabla para eliminar.');
      return;
    }

    const medicamento = this.medicamentos().find(m => m.id === id);

    if (medicamento) {
      this.pendienteEliminar.set(medicamento);
    }
  }

  // confirmación inline: efectúa el DELETE contra el backend
  confirmarEliminar() {
    const pendiente = this.pendienteEliminar();

    if (!pendiente) {
      return;
    }

    void this.eliminar(pendiente);
  }

  // cancela la confirmación inline
  cancelarEliminar() {
    this.pendienteEliminar.set(null);
  }

  private async eliminar(medicamento: Medicamento): Promise<void> {
    try {
      await firstValueFrom(this.servicio.eliminar(medicamento.id));
      this.mensajeExito.set(`Medicamento ${medicamento.id} eliminado con éxito.`);
      this.pendienteEliminar.set(null);
      this.limpiarSinMensajes();
      await this.cargar();
    } catch (error: unknown) {
      // Con 409 el backend responde que hay ventas o compras asociadas
      // (P2003 → ConflictException). Se muestra el mensaje tal cual.
      this.mostrarError(this.extraerErrorBackend(error));
      this.pendienteEliminar.set(null);
    }
  }

  // vuelve a modo creación con el formulario en blanco
  limpiar() {
    this.mensajeError.set('');
    this.limpiarSinMensajes();
  }

  private limpiarSinMensajes() {
    this.formulario = {
      id: '',
      nombre: '',
      laboratorio: '',
      descripcion: '',
      stock: 0,
      precioCompra: 0,
      precioVenta: 0
    };
    this.editando.set(false);
    this.seleccionadoId.set('');
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

  // para los dos filtros del buscador
  filtrarPorNombre(event: Event) {
    this.filtroNombre.set((event.target as HTMLInputElement).value);
  }

  filtrarPorLaboratorio(event: Event) {
    this.filtroLaboratorio.set((event.target as HTMLInputElement).value);
  }

  // limpia solo los filtros, no el formulario
  limpiarFiltros() {
    this.filtroNombre.set('');
    this.filtroLaboratorio.set('');
  }

  // boton Salir
  irAlMenu() {
    this.router.navigate(['/dashboard']);
  }

  salir() {
    this.router.navigate(['/dashboard']);
  }
}
