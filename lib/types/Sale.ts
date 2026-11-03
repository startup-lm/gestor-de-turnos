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
  /** Liquidación que pagó la comisión de esta venta */
  payout_id?: number | null;
  /** % de comisión por venta del barbero al momento de registrarla (0..1) */
  commission_rate?: number | null;
  /** Caja que estaba abierta cuando se registró */
  shift_id?: number | null;
}

export interface SaleWithRelations extends Sale {
  barbers?: { name: string } | null;
  products?: { name: string } | null;
  arca_invoices?: ArcaInvoiceRecord | null;
}
