import { NextResponse } from "next/server";

import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { requireBarberOrAdmin } from "@/lib/api/auth";
import { canModify } from "@/lib/api/ownership";
import { requirePlanFeature } from "@/lib/flags/server";
import { SaleInsertSchema } from "@/lib/schemas";
import { revalidateTag } from "next/cache";

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

  const { barber_id, product_id, price, quantity, details } = parsed.data;
  if (!canModify(staff, barber_id)) {
    return errorResponse("Solo podés registrar ventas a tu nombre", 403);
  }

  const { data, error } = await supabaseAdmin
    .from("sales")
    .insert({ barber_id, product_id, price, quantity, details: details ?? null, total: price * quantity })
    .select("id")
    .single();

  if (error) return dbErrorResponse(error, "sales");
  revalidateTag("sales");
  return NextResponse.json({ success: true, id: data.id });
}
