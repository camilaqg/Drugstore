export interface Purchase {
  id: string;
  date: string;
  provider: string;
  invoiceNumber: string;
  medicineId: string; // Cambiado de number a string para que coincida con MED-001
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  expiryDate?: string;
  total: number;
}