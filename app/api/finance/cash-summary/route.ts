import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { getServerPlanContext, PLAN_FORBIDDEN_MESSAGE } from "@/lib/flags/server";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { fetchAllRows } from "@/lib/supabase/fetchAllRows";
import { createdAtBound } from "@/lib/dates/argentina";
import { computeCashSummary } from "@/lib/finance/cashSummary";
import { isValidPeriod } from "@/lib/finance/payoutData";
import { applyPlanToSettings } from "@/lib/settings/sanitize";
import type { BusinessSettings } from "@/lib/types/BusinessSettings";

// GET /api/finance/cash-summary?start_date=&end_date=  (YYYY-MM-DD, días de Argentina)
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);
  const { isEnabled } = await getServerPlanContext();
  // Balance (finances) y la caja diaria (cash_register) usan este resumen
  if (!isEnabled("finances") && !isEnabled("cash_register")) return errorResponse(PLAN_FORBIDDEN_MESSAGE, 403);

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start_date");
  const end = searchParams.get("end_date");
  if (!isValidPeriod(start, end)) return errorResponse("El período no es válido", 400);

  const from = createdAtBound(start, "start");
  const to = createdAtBound(end!, "end");

  const [settings, appointments, sales, movements] = await Promise.all([
    supabaseAdmin.from("business_settings").select("payment_methods, plan, features").eq("id", 1).maybeSingle(),
    fetchAllRows<{ price: number | null; payment_method: string | null }>((a, b) =>
      supabaseAdmin
        .from("appointments")
        .select("price, payment_method")
        .eq("paid", true)
        .is("deleted_at", null)
        .neq("phone", "0000000000")
        .gte("date", start)
        .lte("date", end!)
        .order("id", { ascending: true })
        .range(a, b)
    ),
    fetchAllRows<{ total: number | null; payment_method: string | null }>((a, b) =>
      supabaseAdmin
        .from("sales")
        .select("total, payment_method")
        .gte("created_at", start)
        .lte("created_at", end!)
        .order("id", { ascending: true })
        .range(a, b)
    ),
    fetchAllRows<{ type: string; amount: number; payment_method: string | null; voided_at: string | null }>((a, b) =>
      supabaseAdmin
        .from("cash_movements")
        .select("type, amount, payment_method, voided_at")
        .gte("created_at", from)
        .lte("created_at", to)
        .order("id", { ascending: true })
        .range(a, b)
    ),
  ]);

  const error = settings.error || appointments.error || sales.error || movements.error;
  if (error) return dbErrorResponse(error, "finance/cash-summary");

  const summary = computeCashSummary({
    methods: applyPlanToSettings((settings.data ?? {}) as Partial<BusinessSettings>).payment_methods ?? [],
    appointments: appointments.data,
    sales: sales.data,
    movements: movements.data,
  });

  const totalOf = (type: string) =>
    movements.data
      .filter((m) => m.type === type && !m.voided_at)
      .reduce((sum, m) => sum + Number(m.amount), 0);

  // Los retiros del dueño salen de la caja pero no son gastos: no restan de la ganancia
  return NextResponse.json({ ...summary, expensesTotal: totalOf("expense"), withdrawalsTotal: totalOf("withdrawal") });
}
