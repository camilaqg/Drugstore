// Forma exacta de la respuesta del backend (NestJS + Prisma).
// Los campos están en español porque así los devuelve la API.
export type EstadoMedicamento = 'Activo' | 'Bajo stock' | 'Sin stock';

// Registro completo tal como lo devuelve GET /medicamento.
// `estado` lo deriva el servidor a partir del stock: el cliente
// nunca lo envía ni lo edita.
export interface Medicamento {
  id: string; // código: /^[A-Za-z0-9-]{3,20}$/, lo provee el cliente
  nombre: string;
  laboratorio: string;
  descripcion: string;
  stock: number; // entero >= 0
  precioCompra: number;
  precioVenta: number;
  estado: EstadoMedicamento;
}

// Cuerpo para POST y PATCH: NOTA sin `estado` (el servidor lo ignora
// por whitelist y lo recalcula).
export interface MedicamentoFormulario {
  id: string;
  nombre: string;
  laboratorio: string;
  descripcion: string;
  stock: number;
  precioCompra: number;
  precioVenta: number;
}

// Filtros opcionales de GET /medicamento (query string).
export interface FiltrosMedicamento {
  nombre?: string;
  laboratorio?: string;
  estado?: string;
}
