import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/api/auth";
import { requirePlanFeature } from "@/lib/flags/server";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const category = searchParams.get("category");
  const barberId = searchParams.get("barber_id");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const shiftId = searchParams.get("shift_id");

  let query = supabaseAdmin
    .from("cash_movements")
    .select("*, barbers(name)")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (type) {
    query = query.eq("type", type);
  }
  if (category) {
    query = query.eq("category", category);
  }
  if (barberId) {
    query = query.eq("barber_id", Number(barberId));
  }
  if (shiftId) {
    query = query.eq("shift_id", Number(shiftId));
  }
  if (startDate) {
    query = query.gte("created_at", `${startDate}T00:00:00Z`);
  }
  if (endDate) {
    query = query.lte("created_at", `${endDate}T23:59:59Z`);
  }

  const { data, error } = await query;
  if (error) return dbErrorResponse(error, "cash/movements");

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  try {
    const body = await request.json();
    const {
      type,
      category,
      amount,
      payment_method = "Efectivo",
      description,
      reference_code,
      barber_id,
      shift_id,
    } = body;

    if (!type || amount === undefined || !description) {
      return errorResponse("Tipo, importe y descripción son requeridos", 400);
    }

    // Adelantos y pagos de comisión son parte de la liquidación; el resto es registro de gastos
    const isPayoutMovement = type === "advance" || type === "commission_payout";
    const planError = await requirePlanFeature(isPayoutMovement ? "commission_payouts" : "expenses");
    if (planError) return planError;

    const defaultCategory =
      type === "advance" ? "adelanto" : type === "expense" ? "insumos" : "otro";

    const { data, error } = await supabaseAdmin
      .from("cash_movements")
      .insert({
        type,
        category: category || defaultCategory,
        amount: Number(amount),
        payment_method,
        description: description.trim(),
        reference_code: reference_code || null,
        barber_id: barber_id ? Number(barber_id) : null,
        shift_id: shift_id ? Number(shift_id) : null,
        created_by: admin.email || "admin",
      })
      .select("id")
      .single();

    if (error) return dbErrorResponse(error, "cash/movements");

    revalidateTag("cash_movements");

    return NextResponse.json({ success: true, id: data.id });
  } catch (err: unknown) {
    return dbErrorResponse(err, "cash/movements.post");
  }
}
