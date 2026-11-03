import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { fetchAllRows } from "@/lib/supabase/fetchAllRows";
import { createdAtBound } from "@/lib/dates/argentina";
import { CashMovement } from "@/lib/types/cash";

/** Datos de servidor de una liquidación: los usan la vista previa y el registro, para que calculen lo mismo. */
export interface PayoutData {
  barber: { id: number; name: string; commission: number; sale_commission: number; active: boolean };
  cuts: { count: number; revenue: number };
  sales: { count: number; revenue: number };
  /** Adelantos sin descontar hasta el fin del período (incluye los anteriores al período). */
  advances: CashMovement[];
  overlappingPayout: { id: number; period_start: string; period_end: string } | null;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function isValidPeriod(start?: string | null, end?: string | null): start is string {
  return !!start && !!end && DAY.test(start) && DAY.test(end) && start <= end;
}

export async function findOverlappingPayout(barberId: number, start: string, end: string) {
  return supabaseAdmin
    .from("commission_payouts")
    .select("id, period_start, period_end")
    .eq("barber_id", barberId)
    .is("voided_at", null)
    .lte("period_start", end)
    .gte("period_end", start)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
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

  const [appointments, sales, advances, overlap] = await Promise.all([
    // Solo turnos cobrados: la comisión se paga sobre lo que efectivamente entró
    fetchAllRows<{ price: number | null }>((from, to) =>
      supabaseAdmin
        .from("appointments")
        .select("price")
        .eq("barber_id", barberId)
        .eq("paid", true)
        .is("deleted_at", null)
        .neq("phone", "0000000000")
        .gte("date", start)
        .lte("date", end)
        .order("id", { ascending: true })
        .range(from, to)
    ),
    fetchAllRows<{ total: number | null }>((from, to) =>
      supabaseAdmin
        .from("sales")
        .select("total")
        .eq("barber_id", barberId)
        .gte("created_at", createdAtBound(start, "start"))
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
    findOverlappingPayout(barberId, start, end),
  ]);

  const error = appointments.error || sales.error || advances.error || overlap.error;
  if (error) return { data: null, error };

  return {
    data: {
      barber: {
        id: barber.id,
        name: barber.name,
        commission: Number(barber.commission ?? 0),
        sale_commission: Number(barber.sale_commission ?? 0),
        active: barber.active !== false,
      },
      cuts: {
        count: appointments.data.length,
        revenue: appointments.data.reduce((sum, a) => sum + Number(a.price ?? 0), 0),
      },
      sales: {
        count: sales.data.length,
        revenue: sales.data.reduce((sum, s) => sum + Number(s.total ?? 0), 0),
      },
      advances: (advances.data ?? []) as CashMovement[],
      overlappingPayout: overlap.data ?? null,
    },
    error: null,
  };
}
