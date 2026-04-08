export interface Medicine {
  id: string;
  name: string;
  laboratory: string;
  description: string;
  stock: number;
  purchasePrice: number;
  salePrice: number;
  status?: 'Activo' | 'Bajo stock' | 'Sin stock';
}