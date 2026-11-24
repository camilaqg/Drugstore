// Forma exacta de la respuesta del backend (NestJS + Prisma) para /compra.
// La compra ya no es plana: el backend guarda una cabecera con sus
// detalles (una fila por medicamento comprado).

// Línea de compra tal como la devuelve GET /compra y GET /compra/:id.
// `total` de la línea lo calcula el servidor (cantidad * precioCompra);
// el cliente nunca lo envía.
export interface DetalleCompra {
  id: number;
  compraId: number;
  medicamentoId: string; // código del medicamento en el catálogo
  cantidad: number;
  precioCompra: number;
  precioVenta: number;
  fechaVencimiento?: string | null;
  total: number;
}

// Cabecera de la compra tal como la devuelve GET /compra.
export interface Compra {
  id: number;
  fecha: string;
  proveedor: string;
  numeroFactura: string;
  // Total de la cabecera: lo calcula el servidor como suma de los
  // totales de línea; se ignora cualquier total que mande el cliente.
  total: number;
  detalles: DetalleCompra[];
}

// Línea para POST /compra: el servidor calcula el total de línea,
// incrementa el stock, actualiza los precios del catálogo y recalcula
// el estado del medicamento.
export interface CrearDetalleCompra {
  medicamentoId: string;
  cantidad: number; // entero >= 1
  precioCompra: number; // >= 0
  precioVenta: number; // >= 0
  fechaVencimiento?: string;
}

// Cuerpo para POST /compra: sin `total` (el servidor lo recalcula
// e ignora el valor del cliente).
export interface CrearCompra {
  fecha: string;
  proveedor: string;
  numeroFactura: string;
  detalles: CrearDetalleCompra[];
}
