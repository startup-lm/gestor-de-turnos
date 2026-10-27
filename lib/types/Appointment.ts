import { ArcaInvoiceRecord } from "./Arca";

export interface Appointment {
  id: number;
  client: string;
  barber_id: number;
  date: string;
  start_time: string;
  end_time: string;
  created_at?: string;
  created_by?: string;
  phone: string;
  type?: "appointment" | "block";
  paid: boolean;
  price: number;
  payment_method?: string | null;
  service_id: number;
  client_id?: number | null;
  barbers?: {
    name?: string;
  } | null;
  services?: {
    name?: string;
  } | null;
  deleted_at?: string | null;
  deleted_by?: string;
  updated_at?: string | null;
  arca_invoice_id?: number | null;
  arca_invoices?: ArcaInvoiceRecord | null;
}

export interface AppointmentUpdates {
  client?: string;
  barber_id?: number;
  date?: string;
  start_time?: string;
  end_time?: string;
  phone?: string;
  paid?: boolean;
  price?: number;
  payment_method?: string | null;
  service_id?: number;
  client_id?: number | null;
  deleted_at?: string | null;
  updated_at?: string | null;
  arca_invoice_id?: number | null;
};
