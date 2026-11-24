export interface DetalleVenta {
  id?: number;
  medicamentoId: string;
  cantidad: number;
  precio: number;
  total: number;
}

// El backend recalcula precio y total desde el medicamento,
// así que el cliente solo envía el código y la cantidad.
export interface CrearDetalleVenta {
  medicamentoId: string;
  cantidad: number;
}

export interface CrearVenta {
  cliente: string;
  factura: string;
  fecha: string;
  detalles: CrearDetalleVenta[];
}

export interface Sale {
  id: number;
  usuarioId?: number | null;
  cliente: string;
  factura: string;
  fecha: string;
  // El total de la respuesta lo calcula el servidor; el cliente
  // solo lo muestra.
  total: number;
  detalles?: DetalleVenta[];
}

export interface Medicamento {
  id: string;
  nombre: string;
  laboratorio: string;
  descripcion: string;
  stock: number;
  precioCompra: number;
  precioVenta: number;
  estado: string;
}
