import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/api/auth";
import { requirePlanFeature } from "@/lib/flags/server";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
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

  const body = await request.json().catch(() => null);
  const barberId = Number(body?.barber_id);
  const periodStart: string | undefined = body?.period_start;
  const periodEnd: string | undefined = body?.period_end;
  const advanceIds: number[] = Array.isArray(body?.advance_ids) ? body.advance_ids.map(Number) : [];
  const paymentMethod = typeof body?.payment_method === "string" ? body.payment_method.trim() : "";

  if (!barberId) return errorResponse("Elegí un profesional", 400);
  if (!isValidPeriod(periodStart, periodEnd)) return errorResponse("El período no es válido", 400);
  if (endsInTheFuture(periodEnd!)) return errorResponse("El período a liquidar no puede terminar después de hoy", 400);
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

  const { data: payout, error } = await supabaseAdmin
    .from("commission_payouts")
    .insert({
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
    })
    .select("*")
    .single();

  if (error || !payout) return dbErrorResponse(error, "payouts");

  /** Si falla un paso posterior, se deshace todo para no dejar la caja a medias. */
  const rollback = async () => {
    await supabaseAdmin.from("appointments").update({ payout_id: null }).eq("payout_id", payout.id);
    await supabaseAdmin.from("sales").update({ payout_id: null }).eq("payout_id", payout.id);
    await supabaseAdmin.from("cash_movements").update({ payout_id: null }).eq("payout_id", payout.id).eq("type", "advance");
    await supabaseAdmin.from("cash_movements").delete().eq("payout_id", payout.id).eq("type", "commission_payout");
    await supabaseAdmin.from("commission_payouts").delete().eq("id", payout.id);
  };

  // Turnos y ventas quedan atados a esta liquidación: no se vuelven a pagar ni se pueden editar.
  // Marca condicional: si otra liquidación los tomó en paralelo, se detecta y se deshace
  for (const [table, items] of [["appointments", payoutData.cuts], ["sales", payoutData.sales]] as const) {
    if (items.ids.length === 0) continue;
    const { data: linked, error: linkError } = await supabaseAdmin
      .from(table)
      .update({ payout_id: payout.id })
      .in("id", items.ids)
      .is("payout_id", null)
      .select("id");

    if (linkError || (linked ?? []).length !== items.ids.length) {
      await rollback();
      return errorResponse("No se pudo registrar la liquidación", 500);
    }
  }

  if (available.length > 0) {
    // Marca condicional: si otro pedido ya descontó alguno en paralelo, se detecta y se deshace
    const { data: marked, error: markError } = await supabaseAdmin
      .from("cash_movements")
      .update({ payout_id: payout.id })
      .in("id", available.map((a) => a.id))
      .is("payout_id", null)
      .select("id");

    if (markError || (marked ?? []).length !== available.length) {
      await rollback();
      return errorResponse("No se pudo registrar la liquidación", 500);
    }
  }

  if (result.totalToPay > 0) {
    const { error: movementError } = await supabaseAdmin.from("cash_movements").insert({
      barber_id: barberId,
      type: "commission_payout",
      category: "comision",
      amount: result.totalToPay,
      payment_method: paymentMethod,
      description: `Liquidación de comisiones período ${periodStart} al ${periodEnd}`,
      reference_code: `REC-${payout.id}`,
      payout_id: payout.id,
      created_by: admin.email || "admin",
    });

    if (movementError) {
      await rollback();
      return errorResponse("No se pudo registrar la liquidación", 500);
    }
  }

  revalidateTag("payouts");
  revalidateTag("cash_movements");

  return NextResponse.json({ success: true, id: payout.id, payout, advancesExcess: result.advancesExcess });
}
