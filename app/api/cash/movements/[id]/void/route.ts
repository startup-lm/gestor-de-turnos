import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/api/auth";
import { successResponse, errorResponse, dbErrorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { closedShiftLock } from "@/lib/finance/openShift";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Anula un gasto, ingreso, retiro o adelanto cargado por error. No borra el registro. */
export async function POST(_request: Request, { params }: RouteParams) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const id = Number((await params).id);
  if (!id) return errorResponse("ID inválido", 400);

  const { data: movement, error: findError } = await supabaseAdmin
    .from("cash_movements")
    .select("id, type, voided_at, payout_id, shift_id")
    .eq("id", id)
    .maybeSingle();
  if (findError) return dbErrorResponse(findError, "cash/movements/void");
  if (!movement) return errorResponse("Movimiento no encontrado", 404);
  if (movement.voided_at) return errorResponse("El movimiento ya estaba anulado", 409);
  if (movement.type === "commission_payout") {
    return errorResponse("Este pago pertenece a una liquidación: anulá la liquidación desde el historial", 409);
  }
  if (movement.type === "advance" && movement.payout_id) {
    return errorResponse(
      `Este adelanto ya se descontó en la liquidación #${movement.payout_id}. Anulá esa liquidación primero.`,
      409
    );
  }
  const shiftLock = await closedShiftLock(movement.shift_id);
  if (shiftLock) return shiftLock;

  const { error } = await supabaseAdmin
    .from("cash_movements")
    .update({ voided_at: new Date().toISOString() })
    .eq("id", id)
    .is("voided_at", null);
  if (error) return dbErrorResponse(error, "cash/movements/void");

  revalidateTag("cash_movements");
  return successResponse();
}
