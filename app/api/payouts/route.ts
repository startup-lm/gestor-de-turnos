import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/api/auth";
import { requirePlanFeature } from "@/lib/flags/server";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { parseBody } from "@/lib/api/parseBody";
import { PayoutInsertSchema } from "@/lib/schemas";
import { currentShiftId } from "@/lib/finance/openShift";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { computePayout } from "@/lib/finance/payout";
import { endsInTheFuture, isValidPeriod, loadPayoutData } from "@/lib/finance/payoutData";
import { todayInArgentina } from "@/lib/dates/argentina";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const { searchParams } = new URL(request.url);
  const barberId = searchParams.get("barber_id");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  let query = supabaseAdmin
    .from("commission_payouts")
    .select("*, barbers(name, role)")
    .order("payment_date", { ascending: false })
    .order("id", { ascending: false });

  if (barberId) {
    query = query.eq("barber_id", Number(barberId));
  }
  if (startDate) {
    query = query.gte("payment_date", startDate);
  }
  if (endDate) {
    query = query.lte("payment_date", endDate);
  }

  const { data, error } = await query;
  if (error) return dbErrorResponse(error, "payouts");

  // Incluye las anuladas (voided_at) para mostrarlas en el historial
  return NextResponse.json(data ?? []);
}

/**
 * Registra una liquidación. Los montos se calculan acá, con los datos de la base:
 * cualquier importe que mande el navegador se ignora.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);
  const planError = await requirePlanFeature("commission_payouts");
  if (planError) return planError;

  const { data: body, error: bodyError } = await parseBody(request, PayoutInsertSchema);
  if (bodyError) return bodyError;

  const barberId = body.barber_id;
  const periodStart = body.period_start;
  const periodEnd = body.period_end;
  const advanceIds = body.advance_ids ?? [];
  const paymentMethod = body.payment_method;

  if (!barberId) return errorResponse("Elegí un profesional", 400);
  if (!isValidPeriod(periodStart, periodEnd)) return errorResponse("El período no es válido", 400);
  if (endsInTheFuture(periodEnd)) return errorResponse("El período a liquidar no puede terminar después de hoy", 400);
  if (!paymentMethod) return errorResponse("Elegí un medio de pago", 400);

  const { data: payoutData, error: loadError, notFound } = await loadPayoutData(barberId, periodStart, periodEnd!);
  if (loadError) return dbErrorResponse(loadError, "payouts.post");
  if (notFound || !payoutData) return errorResponse("Profesional no encontrado", 404);

  // Solo se descuentan adelantos disponibles (sin anular y sin descontar) de este profesional
  const available = payoutData.advances.filter((a) => advanceIds.includes(a.id));
  if (available.length !== new Set(advanceIds).size) {
    return errorResponse("Algún adelanto ya fue descontado o no corresponde a este profesional", 409);
  }

  const result = computePayout({
    cutsCount: payoutData.cuts.count,
    cutsCommission: payoutData.cuts.commission,
    salesCount: payoutData.sales.count,
    salesCommission: payoutData.sales.commission,
    advancesTotal: available.reduce((sum, a) => sum + Number(a.amount), 0),
  });

  let shiftId: number | null = null;
  if (result.totalToPay > 0) {
    const { shiftId: currentShift, error: shiftError } = await currentShiftId(admin.email || "admin");
    if (shiftError) {
      return dbErrorResponse(shiftError, "payouts.shift");
    }
    shiftId = currentShift;
  }

  const { data: payout, error } = await supabaseAdmin.rpc("register_commission_payout", {
    p_payout: {
      barber_id: barberId,
      period_start: periodStart,
      period_end: periodEnd,
      cuts_count: result.cutsCount,
      cuts_commission_amount: result.cutsCommission,
      sales_count: result.salesCount,
      sales_commission_amount: result.salesCommission,
      advances_deducted: result.advancesDeducted,
      total_paid: result.totalToPay,
      payment_method: paymentMethod,
      payment_date: todayInArgentina(),
      reference_code: body?.reference_code?.trim() || null,
      receipt_notes: body?.receipt_notes?.trim() || null,
      paid_by: admin.email || "admin",
    },
    p_appointment_ids: payoutData.cuts.ids,
    p_sale_ids: payoutData.sales.ids,
    p_advance_ids: available.map((a) => a.id),
    p_movement:
      result.totalToPay > 0
        ? {
            amount: result.totalToPay,
            payment_method: paymentMethod,
            description: `Liquidación de comisiones período ${periodStart} al ${periodEnd}`,
            shift_id: shiftId,
            created_by: admin.email || "admin",
          }
        : null,
  });

  if (error) {
    if ((error as { code?: string }).code === "P0409") {
      return errorResponse("Algún turno, venta o adelanto ya fue liquidado. Actualizá y probá de nuevo", 409);
    }
    return dbErrorResponse(error, "payouts");
  }
  if (!payout) {
    return dbErrorResponse(error, "payouts");
  }

  revalidateTag("payouts");
  revalidateTag("cash_movements");

  return NextResponse.json({ success: true, id: payout.id, payout, advancesExcess: result.advancesExcess });
}
