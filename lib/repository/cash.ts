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

export async function createCommissionPayout(
  payload: Omit<CommissionPayout, "id" | "created_at" | "barbers">
): Promise<{ success: boolean; id?: number; error?: string }> {
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
    return { success: true, id: json.id };
  } catch (err: unknown) {
    console.error("createCommissionPayout error:", err);
    const message = err instanceof Error ? err.message : "Error de red";
    return { success: false, error: message };
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
