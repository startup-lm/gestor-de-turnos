import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/api/auth";
import { requirePlanFeature } from "@/lib/flags/server";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { createdAtBound } from "@/lib/dates/argentina";
import { currentShiftId } from "@/lib/finance/openShift";

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
    query = query.gte("created_at", createdAtBound(startDate, "start"));
  }
  if (endDate) {
    query = query.lte("created_at", createdAtBound(endDate, "end"));
  }

  const { data, error } = await query;
  if (error) return dbErrorResponse(error, "cash/movements");

  return NextResponse.json(data ?? []);
}

const MANUAL_MOVEMENT_TYPES = ["income", "expense", "advance", "withdrawal"];

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  try {
    const body = await request.json();
    const {
      type: requestedType,
      category,
      amount,
      payment_method = "Efectivo",
      description,
      reference_code,
      barber_id,
    } = body;

    // Un retiro del dueño nunca se guarda como gasto, aunque lo pida un cliente viejo
    const type = category === "retiro_dueno" && requestedType === "expense" ? "withdrawal" : requestedType;

    if (!type || amount === undefined || !description) {
      return errorResponse("Tipo, importe y descripción son requeridos", 400);
    }
    // Los pagos de comisión solo los genera una liquidación (POST /api/payouts)
    if (!MANUAL_MOVEMENT_TYPES.includes(type)) {
      return errorResponse("Tipo de movimiento inválido", 400);
    }
    if (!(Number(amount) > 0)) {
      return errorResponse("El importe debe ser mayor a cero", 400);
    }
    if (type === "advance" && !barber_id) {
      return errorResponse("Elegí a qué profesional le das el adelanto", 400);
    }

    // Los adelantos son parte de la liquidación; el resto es registro de gastos
    const isPayoutMovement = type === "advance";
    const planError = await requirePlanFeature(isPayoutMovement ? "commission_payouts" : "expenses");
    if (planError) return planError;

    const defaultCategory =
      type === "advance" ? "adelanto" : type === "expense" ? "insumos" : "otro";

    // Caja: el movimiento entra en el período en curso (lo decide el servidor, no el cliente)
    const { shiftId, error: shiftError } = await currentShiftId(admin.email || "admin");
    if (shiftError) return dbErrorResponse(shiftError, "cash/movements.shift");

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
        shift_id: shiftId,
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
