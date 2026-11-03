import { computeCashSummary, normalizeMethod } from "@/lib/finance/cashSummary";
import { todayInArgentina } from "@/lib/dates/argentina";
import type { CashClosingFrequency, CashShiftExpectedRow, CashShiftMethodTotal } from "@/lib/types/cash";

/** El fondo inicial de la caja siempre es en efectivo */
export const CASH_METHOD = "Efectivo";

const WEEK_MS = 7 * 24 * 3600 * 1000;

/**
 * Lo que debería haber en la caja por medio de pago: los cobros y movimientos
 * de esa caja (los que tienen su shift_id) más el fondo inicial en efectivo.
 */
export function computeShiftExpected(params: {
  initialCash: number;
  methods: string[];
  appointments: { price: number | null; payment_method?: string | null }[];
  sales: { total: number | null; payment_method?: string | null }[];
  movements: { type: string; amount: number; payment_method?: string | null; voided_at?: string | null }[];
}): CashShiftExpectedRow[] {
  // El efectivo siempre aparece, aunque no esté entre los medios configurados
  const methods = params.methods.some((m) => normalizeMethod(m) === CASH_METHOD)
    ? params.methods
    : [CASH_METHOD, ...params.methods];
  const { rows } = computeCashSummary({ ...params, methods });
  return rows.map((r) => ({
    method: r.method,
    income: r.income,
    outcome: r.outcome,
    expected: r.net + (r.method === CASH_METHOD ? Number(params.initialCash) : 0),
  }));
}

/** Arma el arqueo: esperado de cada medio y lo contado (null si no se informó) */
export function buildMethodTotals(
  expected: CashShiftExpectedRow[],
  counted: Record<string, number | null | undefined>
): CashShiftMethodTotal[] {
  return expected.map((row) => {
    const value = counted[row.method];
    return { method: row.method, expected: row.expected, counted: typeof value === "number" ? value : null };
  });
}

/**
 * ¿Ya pasó el momento de cerrar la caja según la frecuencia configurada?
 * Diaria: se abrió un día anterior (en Argentina). Semanal: lleva más de 7 días. Manual: nunca avisa.
 */
export function closingReminderDue(
  openedAt: string,
  frequency: CashClosingFrequency | string | null | undefined,
  now: Date = new Date()
): boolean {
  const opened = new Date(openedAt);
  if (Number.isNaN(opened.getTime())) return false;
  if (frequency === "manual") return false;
  if (frequency === "weekly") return now.getTime() - opened.getTime() > WEEK_MS;
  return todayInArgentina(opened) < todayInArgentina(now);
}
