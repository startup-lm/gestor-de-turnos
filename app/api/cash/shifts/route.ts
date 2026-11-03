import { NextResponse } from "next/server";
import { requireBarberOrAdmin } from "@/lib/api/auth";
import { requirePlanFeature } from "@/lib/flags/server";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { getOpenShift, loadShiftExpected } from "@/lib/finance/openShift";
import { closingReminderDue } from "@/lib/finance/cashShift";

const HISTORY_LIMIT = 10;

// GET /api/cash/shifts: lo que entró desde el último cierre, por medio de pago; el admin además ve los últimos cierres.
// No hay POST para abrir: el período se crea solo con el primer cobro (currentShiftId).
export async function GET() {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);
  const planError = await requirePlanFeature("cash_closing");
  if (planError) return planError;

  const { shift, error } = await getOpenShift();
  if (error) return dbErrorResponse(error, "cash/shifts");

  let expected = null;
  let reminderDue = false;
  if (shift) {
    const [loaded, settings] = await Promise.all([
      loadShiftExpected(shift),
      supabaseAdmin.from("business_settings").select("cash_closing_frequency").eq("id", 1).maybeSingle(),
    ]);
    if (loaded.error) return dbErrorResponse(loaded.error, "cash/shifts.expected");
    expected = loaded.rows;
    reminderDue = closingReminderDue(shift.opened_at, settings.data?.cash_closing_frequency);
  }

  let history = null;
  if (staff.barber.role === "admin") {
    const { data, error: historyError } = await supabaseAdmin
      .from("cash_shifts")
      .select("*")
      .eq("status", "closed")
      .order("closed_at", { ascending: false })
      .limit(HISTORY_LIMIT);
    if (historyError) return dbErrorResponse(historyError, "cash/shifts.history");
    history = data ?? [];
  }

  return NextResponse.json({ shift, expected, reminderDue, history });
}
