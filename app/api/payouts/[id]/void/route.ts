import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/api/auth";
import { successResponse, errorResponse, dbErrorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Anula una liquidación: libera sus turnos, ventas y adelantos y anula su egreso de caja. No borra nada. */
export async function POST(_request: Request, { params }: RouteParams) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const id = Number((await params).id);
  if (!id) return errorResponse("ID inválido", 400);

  const { data: payout, error: findError } = await supabaseAdmin
    .from("commission_payouts")
    .select("id, voided_at")
    .eq("id", id)
    .maybeSingle();
  if (findError) return dbErrorResponse(findError, "payouts/void");
  if (!payout) return errorResponse("Liquidación no encontrada", 404);
  if (payout.voided_at) return errorResponse("La liquidación ya estaba anulada", 409);

  const now = new Date().toISOString();

  const { error: voidError } = await supabaseAdmin
    .from("commission_payouts")
    .update({ voided_at: now })
    .eq("id", id)
    .is("voided_at", null);
  if (voidError) return dbErrorResponse(voidError, "payouts/void");

  // Lo que estaba liquidado vuelve a quedar disponible para la próxima liquidación
  for (const table of ["appointments", "sales"] as const) {
    const { error: releaseError } = await supabaseAdmin
      .from(table)
      .update({ payout_id: null })
      .eq("payout_id", id);
    if (releaseError) return dbErrorResponse(releaseError, `payouts/void.${table}`);
  }

  const { error: advancesError } = await supabaseAdmin
    .from("cash_movements")
    .update({ payout_id: null })
    .eq("payout_id", id)
    .eq("type", "advance");
  if (advancesError) return dbErrorResponse(advancesError, "payouts/void.advances");

  const { error: movementError } = await supabaseAdmin
    .from("cash_movements")
    .update({ voided_at: now })
    .eq("payout_id", id)
    .eq("type", "commission_payout");
  if (movementError) return dbErrorResponse(movementError, "payouts/void.movement");

  revalidateTag("payouts");
  revalidateTag("cash_movements");
  return successResponse();
}
