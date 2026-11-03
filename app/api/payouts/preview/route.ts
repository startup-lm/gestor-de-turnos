import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { requirePlanFeature } from "@/lib/flags/server";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { endsInTheFuture, isValidPeriod, loadPayoutData } from "@/lib/finance/payoutData";

// GET /api/payouts/preview?barber_id=&start_date=&end_date=
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);
  const planError = await requirePlanFeature("commission_payouts");
  if (planError) return planError;

  const { searchParams } = new URL(request.url);
  const barberId = Number(searchParams.get("barber_id"));
  const start = searchParams.get("start_date");
  const end = searchParams.get("end_date");

  if (!barberId) return errorResponse("Elegí un profesional", 400);
  if (!isValidPeriod(start, end)) return errorResponse("El período no es válido", 400);
  if (endsInTheFuture(end!)) return errorResponse("El período a liquidar no puede terminar después de hoy", 400);

  const { data, error, notFound } = await loadPayoutData(barberId, start, end!);
  if (error) return dbErrorResponse(error, "payouts/preview");
  if (notFound || !data) return errorResponse("Profesional no encontrado", 404);

  return NextResponse.json(data);
}
