import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireBarberOrAdmin } from "@/lib/api/auth";
import { requirePlanFeature } from "@/lib/flags/server";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { loadShiftExpected } from "@/lib/finance/openShift";
import { buildMethodTotals, CASH_METHOD } from "@/lib/finance/cashShift";

const isAmount = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;

// POST /api/cash/shifts/:id/close  body: { counted: { [medio]: number | null }, notes? }
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);
  const planError = await requirePlanFeature("cash_closing");
  if (planError) return planError;

  const { id } = await params;
  const shiftId = Number(id);
  if (!Number.isInteger(shiftId) || shiftId <= 0) return errorResponse("Caja inválida", 400);

  try {
    const body = await request.json();
    const rawCounted: Record<string, unknown> = body?.counted ?? {};
    if (!isAmount(rawCounted[CASH_METHOD])) {
      return errorResponse("Ingresá el efectivo que contaste en la caja", 400);
    }
    const counted: Record<string, number | null> = {};
    for (const [method, value] of Object.entries(rawCounted)) {
      if (value === null || value === undefined || value === "") continue;
      if (!isAmount(value)) return errorResponse(`El monto de ${method} no es válido`, 400);
      counted[method] = value;
    }

    const { data: shift, error: findError } = await supabaseAdmin
      .from("cash_shifts")
      .select("id, status, initial_cash")
      .eq("id", shiftId)
      .maybeSingle();
    if (findError) return dbErrorResponse(findError, "cash/shifts.close");
    if (!shift) return errorResponse("Caja no encontrada", 404);
    if (shift.status !== "open") return errorResponse("Esta caja ya estaba cerrada", 409);

    // Lo esperado se recalcula en el servidor: el cliente solo informa lo contado
    const { rows, error: expectedError } = await loadShiftExpected(shift);
    if (expectedError || !rows) return dbErrorResponse(expectedError, "cash/shifts.close.expected");

    const methodTotals = buildMethodTotals(rows, counted);
    const cash = methodTotals.find((m) => m.method === CASH_METHOD)!;
    const actualCash = cash.counted ?? 0;

    const { data: closed, error: closeError } = await supabaseAdmin
      .from("cash_shifts")
      .update({
        status: "closed",
        closed_at: new Date().toISOString(),
        closed_by: staff.user.email,
        expected_cash: cash.expected,
        actual_cash: actualCash,
        cash_difference: actualCash - cash.expected,
        method_totals: methodTotals,
        notes: typeof body?.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
      })
      .eq("id", shiftId)
      .eq("status", "open")
      .select("*");
    if (closeError) return dbErrorResponse(closeError, "cash/shifts.close");
    // Si otra persona la cerró en el medio, el update no encuentra la caja abierta
    if (!closed || closed.length === 0) return errorResponse("Esta caja ya estaba cerrada", 409);

    revalidateTag("cash_shifts");
    return NextResponse.json({ success: true, shift: closed[0] });
  } catch (err: unknown) {
    return dbErrorResponse(err, "cash/shifts.close");
  }
}
