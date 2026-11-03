export type CashClosingFrequency = "daily" | "weekly" | "manual";

export type CashMovementType =
  | "income"
  | "expense"
  | "advance"
  | "withdrawal"
  | "commission_payout";

export type CashMovementCategory =
  | "insumos"
  | "servicios"
  | "limpieza"
  | "adelanto"
  | "retiro_dueno"
  | "comision"
  | "otro";

export interface CashMovement {
  id: number;
  shift_id?: number | null;
  barber_id?: number | null;
  type: CashMovementType;
  category: string;
  amount: number;
  payment_method: string;
  description: string;
  reference_code?: string | null;
  created_by: string;
  created_at: string;
  voided_at?: string | null;
  payout_id?: number | null;
  barbers?: { name: string };
}

export interface CommissionPayout {
  id: number;
  barber_id: number;
  shift_id?: number | null;
  movement_id?: number | null;
  period_start: string;
  period_end: string;
  cuts_count: number;
  cuts_commission_amount: number;
  sales_count: number;
  sales_commission_amount: number;
  advances_deducted: number;
  total_paid: number;
  payment_method: string;
  payment_date: string;
  reference_code?: string | null;
  receipt_notes?: string | null;
  paid_by: string;
  created_at?: string;
  voided_at?: string | null;
  barbers?: { name: string; role?: string };
}

/** Arqueo de un medio de pago al cerrar la caja */
export interface CashShiftMethodTotal {
  method: string;
  expected: number;
  /** Lo contado; null si no se informó (solo el efectivo es obligatorio) */
  counted: number | null;
}

export interface CashShift {
  id: number;
  opened_at: string;
  closed_at?: string | null;
  opened_by: string;
  closed_by?: string | null;
  initial_cash: number;
  expected_cash?: number | null;
  actual_cash?: number | null;
  cash_difference?: number | null;
  status: "open" | "closed";
  notes?: string | null;
  method_totals?: CashShiftMethodTotal[] | null;
}

/** Lo que se espera en la caja abierta, por medio de pago */
export interface CashShiftExpectedRow {
  method: string;
  income: number;
  outcome: number;
  /** Cobros − egresos, y en efectivo además el fondo inicial */
  expected: number;
}
