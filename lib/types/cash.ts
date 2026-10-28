export type CashClosingFrequency = "daily" | "weekly" | "manual";

export type CashShiftStatus = "open" | "closed";

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
  status: CashShiftStatus;
  notes?: string | null;
  created_at?: string;
}

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
  barbers?: { name: string; role?: string };
}
