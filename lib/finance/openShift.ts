import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { isServerFeatureEnabled } from "@/lib/flags/server";
import { computeShiftExpected } from "@/lib/finance/cashShift";
import type { CashShift } from "@/lib/types/cash";
import { applyPlanToSettings } from "@/lib/settings/sanitize";
import type { BusinessSettings } from "@/lib/types/BusinessSettings";

export const CLOSED_SHIFT_MESSAGE = "Esto es de un cierre de caja ya hecho y no se puede modificar";

/** El período de caja en curso (desde el último cierre), si ya tuvo algún movimiento */
export async function getOpenShift() {
  const { data, error } = await supabaseAdmin
    .from("cash_shifts")
    .select("*")
    .eq("status", "open")
    .maybeSingle();
  return { shift: (data as CashShift | null) ?? null, error };
}

/**
 * Período de caja en el que entra un cobro, venta o movimiento nuevo.
 * No hay que abrir la caja: si no hay período en curso, el primer movimiento lo crea.
 * Con la caja desactivada en el plan, no se ata a ninguno (shiftId null).
 */
export async function currentShiftId(createdBy: string): Promise<{ shiftId: number | null; error: unknown }> {
  if (!(await isServerFeatureEnabled("cash_register"))) return { shiftId: null, error: null };

  const { shift, error } = await getOpenShift();
  if (error) return { shiftId: null, error };
  if (shift) return { shiftId: shift.id, error: null };

  const { data, error: insertError } = await supabaseAdmin
    .from("cash_shifts")
    .insert({ opened_by: createdBy, initial_cash: 0, status: "open" })
    .select("id")
    .single();
  if (!insertError) return { shiftId: data.id, error: null };

  // 23505: otro cobro creó el período al mismo tiempo (índice único de caja abierta); se usa ese
  if (insertError.code === "23505") {
    const retry = await getOpenShift();
    return { shiftId: retry.shift?.id ?? null, error: retry.error };
  }
  return { shiftId: null, error: insertError };
}

/** 409 si el registro pertenece a un cierre de caja ya hecho; null si se puede modificar */
export async function closedShiftLock(shiftId: number | null | undefined) {
  if (!shiftId) return null;
  const { data, error } = await supabaseAdmin
    .from("cash_shifts")
    .select("status")
    .eq("id", shiftId)
    .maybeSingle();
  if (error) return dbErrorResponse(error, "cash_shifts.lock");
  if (data?.status === "closed") return errorResponse(CLOSED_SHIFT_MESSAGE, 409);
  return null;
}

/** Lee todo lo cobrado y movido en un período de caja y calcula lo esperado por medio de pago */
export async function loadShiftExpected(shift: Pick<CashShift, "id" | "initial_cash">) {
  const [settings, appointments, sales, movements] = await Promise.all([
    supabaseAdmin.from("business_settings").select("payment_methods, plan, features").eq("id", 1).maybeSingle(),
    supabaseAdmin
      .from("appointments")
      .select("price, payment_method")
      .eq("shift_id", shift.id)
      .eq("paid", true)
      .is("deleted_at", null),
    supabaseAdmin.from("sales").select("total, payment_method").eq("shift_id", shift.id),
    supabaseAdmin
      .from("cash_movements")
      .select("type, amount, payment_method, voided_at")
      .eq("shift_id", shift.id),
  ]);
  const error = settings.error || appointments.error || sales.error || movements.error;
  if (error) return { rows: null, error };

  const rows = computeShiftExpected({
    initialCash: Number(shift.initial_cash ?? 0),
    methods: applyPlanToSettings((settings.data ?? {}) as Partial<BusinessSettings>).payment_methods ?? [],
    appointments: appointments.data ?? [],
    sales: sales.data ?? [],
    movements: movements.data ?? [],
  });
  return { rows, error: null };
}
