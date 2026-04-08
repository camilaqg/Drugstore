export interface Purchase {
  id: string;
  date: string;
  provider: string;
  invoiceNumber: string;
  medicineId: string; // porque esta asi en medicine como strign 
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  expiryDate?: string;
  total: number;
}