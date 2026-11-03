import { CommissionPayout, CashMovement } from "@/lib/types/cash";
import { getBaseUrl } from "@/utils/getBaseUrl";

const BASE = getBaseUrl();

export interface PayoutFilterParams {
  barberId?: number;
  startDate?: string;
  endDate?: string;
}

export interface MovementFilterParams {
  type?: string;
  category?: string;
  barberId?: number;
  startDate?: string;
  endDate?: string;
}

export async function getCommissionPayouts(
  params?: PayoutFilterParams
): Promise<CommissionPayout[]> {
  const query = new URLSearchParams();
  if (params?.barberId) query.set("barber_id", String(params.barberId));
  if (params?.startDate) query.set("start_date", params.startDate);
  if (params?.endDate) query.set("end_date", params.endDate);

  const url = `${BASE}/api/payouts${query.toString() ? `?${query.toString()}` : ""}`;

  try {
    const res = await fetch(url, {
      credentials: "include",
      next: { tags: ["payouts"] },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  } catch (err) {
    console.error("getCommissionPayouts error:", err);
    return [];
  }
}

/** Solo se mandan el período, los adelantos y el pago: los montos los calcula el servidor. */
export interface CreatePayoutInput {
  barber_id: number;
  period_start: string;
  period_end: string;
  advance_ids: number[];
  payment_method: string;
  reference_code?: string;
  receipt_notes?: string;
}

export async function createCommissionPayout(
  payload: CreatePayoutInput
): Promise<{ success: boolean; id?: number; payout?: CommissionPayout; error?: string }> {
  try {
    const res = await fetch(`${BASE}/api/payouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: json.error || "Error al registrar la liquidación" };
    }
    return { success: true, id: json.id, payout: json.payout };
  } catch (err: unknown) {
    console.error("createCommissionPayout error:", err);
    const message = err instanceof Error ? err.message : "Error de red";
    return { success: false, error: message };
  }
}

export interface PayoutPreview {
  barber: { id: number; name: string; commission: number; sale_commission: number; active: boolean };
  cuts: { count: number; revenue: number };
  sales: { count: number; revenue: number };
  advances: CashMovement[];
  overlappingPayout: { id: number; period_start: string; period_end: string } | null;
}

export async function getPayoutPreview(params: {
  barberId: number;
  startDate: string;
  endDate: string;
}): Promise<{ success: boolean; data?: PayoutPreview; error?: string }> {
  const query = new URLSearchParams({
    barber_id: String(params.barberId),
    start_date: params.startDate,
    end_date: params.endDate,
  });
  try {
    const res = await fetch(`${BASE}/api/payouts/preview?${query.toString()}`, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: json.error || "No se pudo calcular la liquidación" };
    return { success: true, data: json };
  } catch (err: unknown) {
    console.error("getPayoutPreview error:", err);
    return { success: false, error: "Error de red" };
  }
}

async function postVoid(url: string, fallback: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(url, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: json.error || fallback };
    return { success: true };
  } catch (err: unknown) {
    console.error("void error:", err);
    return { success: false, error: "Error de red" };
  }
}

export const voidCommissionPayout = (id: number) =>
  postVoid(`${BASE}/api/payouts/${id}/void`, "No se pudo anular la liquidación");

export const voidCashMovement = (id: number) =>
  postVoid(`${BASE}/api/cash/movements/${id}/void`, "No se pudo anular el movimiento");

export interface CashSummaryResponse {
  rows: { method: string; income: number; outcome: number; net: number }[];
  totals: { income: number; outcome: number; net: number };
  expensesTotal: number;
}

export async function getCashSummary(params: {
  startDate: string;
  endDate: string;
}): Promise<{ success: boolean; data?: CashSummaryResponse; error?: string }> {
  const query = new URLSearchParams({ start_date: params.startDate, end_date: params.endDate });
  try {
    const res = await fetch(`${BASE}/api/finance/cash-summary?${query.toString()}`, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: json.error || "No se pudo cargar la caja" };
    return { success: true, data: json };
  } catch (err: unknown) {
    console.error("getCashSummary error:", err);
    return { success: false, error: "Error de red" };
  }
}

export async function getCashMovements(
  params?: MovementFilterParams
): Promise<CashMovement[]> {
  const query = new URLSearchParams();
  if (params?.type) query.set("type", params.type);
  if (params?.category) query.set("category", params.category);
  if (params?.barberId) query.set("barber_id", String(params.barberId));
  if (params?.startDate) query.set("start_date", params.startDate);
  if (params?.endDate) query.set("end_date", params.endDate);

  const url = `${BASE}/api/cash/movements${query.toString() ? `?${query.toString()}` : ""}`;

  try {
    const res = await fetch(url, {
      credentials: "include",
      next: { tags: ["cash_movements"] },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  } catch (err) {
    console.error("getCashMovements error:", err);
    return [];
  }
}

export async function createCashMovement(
  payload: Omit<CashMovement, "id" | "created_at" | "barbers">
): Promise<{ success: boolean; id?: number; error?: string }> {
  try {
    const res = await fetch(`${BASE}/api/cash/movements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: json.error || "Error al registrar movimiento" };
    }
    return { success: true, id: json.id };
  } catch (err: unknown) {
    console.error("createCashMovement error:", err);
    const message = err instanceof Error ? err.message : "Error de red";
    return { success: false, error: message };
  }
}
