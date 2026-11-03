import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { fetchAllRows } from "@/lib/supabase/fetchAllRows";
import { createdAtBound, todayInArgentina } from "@/lib/dates/argentina";
import { commissionOf } from "@/lib/finance/commission";
import { CashMovement } from "@/lib/types/cash";

/** Turnos cobrados o ventas de una liquidación, con la comisión ya calculada con el % congelado */
export interface PayoutItems {
  count: number;
  revenue: number;
  commission: number;
  /** Cuántos son de antes del inicio del período: cobros atrasados que nunca se liquidaron */
  lateCount: number;
  ids: number[];
}

/** Datos de servidor de una liquidación: los usan la vista previa y el registro, para que calculen lo mismo. */
export interface PayoutData {
  barber: { id: number; name: string; commission: number; sale_commission: number; active: boolean };
  cuts: PayoutItems;
  sales: PayoutItems;
  /** Adelantos sin descontar hasta el fin del período (incluye los anteriores al período). */
  advances: CashMovement[];
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function isValidPeriod(start?: string | null, end?: string | null): start is string {
  return !!start && !!end && DAY.test(start) && DAY.test(end) && start <= end;
}

/** Una liquidación no puede incluir días que todavía no pasaron */
export function endsInTheFuture(end: string, today: string = todayInArgentina()): boolean {
  return end > today;
}

function summarize(
  rows: { id: number; amount: number | null; commission_rate: number | null; late: boolean }[],
  currentRate: number
): PayoutItems {
  return {
    count: rows.length,
    revenue: rows.reduce((sum, r) => sum + Number(r.amount ?? 0), 0),
    commission: rows.reduce((sum, r) => sum + commissionOf(r.amount, r.commission_rate, currentRate), 0),
    lateCount: rows.filter((r) => r.late).length,
    ids: rows.map((r) => r.id),
  };
}

export async function loadPayoutData(
  barberId: number,
  start: string,
  end: string
): Promise<{ data: PayoutData | null; error: unknown; notFound?: boolean }> {
  const { data: barber, error: barberError } = await supabaseAdmin
    .from("barbers")
    .select("id, name, commission, sale_commission, active")
    .eq("id", barberId)
    .maybeSingle();
  if (barberError) return { data: null, error: barberError };
  if (!barber) return { data: null, error: null, notFound: true };

  // Todo lo cobrado y sin liquidar hasta el fin del período: lo que se cobró tarde
  // de un período ya liquidado entra acá, en vez de perderse
  const [appointments, sales, advances] = await Promise.all([
    fetchAllRows<{ id: number; price: number | null; commission_rate: number | null; date: string }>((from, to) =>
      supabaseAdmin
        .from("appointments")
        .select("id, price, commission_rate, date")
        .eq("barber_id", barberId)
        .eq("paid", true)
        .is("deleted_at", null)
        .is("payout_id", null)
        .neq("phone", "0000000000")
        .lte("date", end)
        .order("id", { ascending: true })
        .range(from, to)
    ),
    fetchAllRows<{ id: number; total: number | null; commission_rate: number | null; created_at: string }>((from, to) =>
      supabaseAdmin
        .from("sales")
        .select("id, total, commission_rate, created_at")
        .eq("barber_id", barberId)
        .is("payout_id", null)
        .lte("created_at", createdAtBound(end, "end"))
        .order("id", { ascending: true })
        .range(from, to)
    ),
    supabaseAdmin
      .from("cash_movements")
      .select("*")
      .eq("type", "advance")
      .eq("barber_id", barberId)
      .is("voided_at", null)
      .is("payout_id", null)
      .lte("created_at", createdAtBound(end, "end"))
      .order("created_at", { ascending: true }),
  ]);

  const error = appointments.error || sales.error || advances.error;
  if (error) return { data: null, error };

  const commission = Number(barber.commission ?? 0);
  const saleCommission = Number(barber.sale_commission ?? 0);
  const startBound = createdAtBound(start, "start");

  return {
    data: {
      barber: {
        id: barber.id,
        name: barber.name,
        commission,
        sale_commission: saleCommission,
        active: barber.active !== false,
      },
      cuts: summarize(
        appointments.data.map((a) => ({ id: a.id, amount: a.price, commission_rate: a.commission_rate, late: a.date < start })),
        commission
      ),
      // Las ventas se comparan por instante UTC: el día argentino empieza a las 03:00 UTC
      sales: summarize(
        sales.data.map((s) => ({
          id: s.id,
          amount: s.total,
          commission_rate: s.commission_rate,
          late: new Date(s.created_at).getTime() < new Date(startBound).getTime(),
        })),
        saleCommission
      ),
      advances: (advances.data ?? []) as CashMovement[],
    },
    error: null,
  };
}
