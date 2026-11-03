import { NextResponse } from "next/server";

import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { requireBarberOrAdmin } from "@/lib/api/auth";
import { canModify } from "@/lib/api/ownership";
import { requirePlanFeature, isServerFeatureEnabled } from "@/lib/flags/server";
import { SaleInsertSchema } from "@/lib/schemas";
import { revalidateTag } from "next/cache";
import { getBarberRates } from "@/lib/finance/barberRates";
import { adjustProductStock, stockFailureResponse } from "@/lib/finance/stock";
import { currentShiftId } from "@/lib/finance/openShift";
import { todayInArgentina } from "@/lib/dates/argentina";

// Edición y borrado de ventas: ver /api/sales/[id]
export async function POST(request: Request) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);
  const planError = await requirePlanFeature("sales");
  if (planError) return planError;

  const parsed = SaleInsertSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? "Datos inválidos para registrar la venta", 400);
  }

  const { barber_id, product_id, price, quantity, details, payment_method } = parsed.data;
  if (!canModify(staff, barber_id)) {
    return errorResponse("Solo podés registrar ventas a tu nombre", 403);
  }

  // Se congela el % de comisión vigente: si después cambia, esta venta no se recalcula
  const { rates, error: ratesError } = await getBarberRates(barber_id);
  if (ratesError) return dbErrorResponse(ratesError, "sales");
  if (!rates) return errorResponse("Profesional no encontrado", 404);

  // Caja: la venta entra en el período en curso (se crea si es el primer movimiento desde el cierre)
  const { shiftId, error: shiftError } = await currentShiftId(staff.user.email!);
  if (shiftError) return dbErrorResponse(shiftError, "sales.shift");

  // Las unidades se descuentan antes de registrar la venta: si no hay stock, no se vende
  const controlsStock = await isServerFeatureEnabled("stock_control");
  if (controlsStock) {
    const taken = await adjustProductStock(product_id, -quantity);
    if (!taken.ok) return stockFailureResponse(taken, "sales");
  }

  const { data, error } = await supabaseAdmin
    .from("sales")
    .insert({
      barber_id,
      product_id,
      price,
      quantity,
      details: details ?? null,
      payment_method,
      total: price * quantity,
      commission_rate: rates.saleCommission,
      shift_id: shiftId,
      created_at: todayInArgentina(),
    })
    .select("id")
    .single();

  if (error) {
    // La venta no quedó registrada: se devuelven las unidades descontadas
    if (controlsStock) await adjustProductStock(product_id, quantity);
    return dbErrorResponse(error, "sales");
  }
  revalidateTag("sales");
  if (controlsStock) revalidateTag("products");
  return NextResponse.json({ success: true, id: data.id });
}
