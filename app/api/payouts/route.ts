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

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);
  const planError = await requirePlanFeature("commission_payouts");
  if (planError) return planError;

  try {
    const body = await request.json();
    const {
      barber_id,
      period_start,
      period_end,
      cuts_count = 0,
      cuts_commission_amount = 0,
      sales_count = 0,
      sales_commission_amount = 0,
      advances_deducted = 0,
      total_paid,
      payment_method = "Efectivo",
      payment_date,
      reference_code,
      receipt_notes,
    } = body;

    if (!barber_id || !period_start || !period_end || total_paid === undefined) {
      return errorResponse("Faltan campos obligatorios para registrar la liquidación", 400);
    }

    const payDate = payment_date || new Date().toISOString().split("T")[0];

    const { data: payout, error } = await supabaseAdmin
      .from("commission_payouts")
      .insert({
        barber_id: Number(barber_id),
        period_start,
        period_end,
        cuts_count: Number(cuts_count),
        cuts_commission_amount: Number(cuts_commission_amount),
        sales_count: Number(sales_count),
        sales_commission_amount: Number(sales_commission_amount),
        advances_deducted: Number(advances_deducted),
        total_paid: Number(total_paid),
        payment_method,
        payment_date: payDate,
        reference_code: reference_code || null,
        receipt_notes: receipt_notes || null,
        paid_by: admin.email || "admin",
      })
      .select("id")
      .single();

    if (error) return dbErrorResponse(error, "payouts");

    // Si se abona en efectivo y hay un monto pagado > 0, registrar automáticamente el egreso en caja
    if (payment_method === "Efectivo" && Number(total_paid) > 0) {
      try {
        await supabaseAdmin.from("cash_movements").insert({
          barber_id: Number(barber_id),
          type: "commission_payout",
          category: "comision",
          amount: Number(total_paid),
          payment_method: "Efectivo",
          description: `Liquidación de comisiones período ${period_start} al ${period_end}`,
          reference_code: `REC-${payout.id}`,
          created_by: admin.email || "admin",
        });
      } catch (movementErr) {
        console.error("Error al registrar movimiento automático de caja para liquidación:", movementErr);
      }
    }

    revalidateTag("payouts");
    revalidateTag("cash_movements");

    return NextResponse.json({ success: true, id: payout.id });
  } catch (err: unknown) {
    return dbErrorResponse(err, "payouts.post");
  }
}
