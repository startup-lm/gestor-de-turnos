import { ArcaInvoiceRecord } from "./Arca";

export interface Sale {
  id?: number;
  product_id: number;
  barber_id: number;
  price: number;
  quantity: number;
  total: number;
  details: string;
  created_at?: string;
  arca_invoice_id?: number | null;
  payment_method?: string | null;
}

export interface SaleWithRelations extends Sale {
  barbers?: { name: string } | null;
  products?: { name: string } | null;
  arca_invoices?: ArcaInvoiceRecord | null;
}
