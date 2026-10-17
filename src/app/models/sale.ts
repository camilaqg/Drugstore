
export interface DetalleVenta {
  id?: number;
  medicamentoId: string;
  cantidad: number;
  precio: number;
  total: number;
}

export interface CrearDetalleVenta {
  medicamentoId: string;
  cantidad: number;
  precio: number;
  total: number;
}

export interface CrearVenta {
  cliente: string;
  factura: string;
  fecha: string;
  total: number;
  detalles: CrearDetalleVenta[];
}

export interface Sale {
  id: number;
  usuarioId?: number | null;
  cliente: string;
  factura: string;
  fecha: string;
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
