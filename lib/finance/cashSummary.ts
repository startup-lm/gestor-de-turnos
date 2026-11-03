export const UNSPECIFIED_METHOD = "Sin especificar";

/** Unifica el nombre del medio de pago: recorta, "MercadoPago" → "Mercado Pago" y vacío → "Sin especificar". */
export function normalizeMethod(method?: string | null): string {
  const trimmed = method?.trim() ?? "";
  if (!trimmed) return UNSPECIFIED_METHOD;
  if (trimmed === "MercadoPago") return "Mercado Pago";
  return trimmed;
}

export interface CashSummaryRow {
  method: string;
  income: number;
  outcome: number;
  net: number;
}

export interface CashSummary {
  rows: CashSummaryRow[];
  totals: { income: number; outcome: number; net: number };
}

const OUTCOME_TYPES = new Set(["expense", "advance", "commission_payout", "withdrawal"]);

/** Saldo por medio de pago: cobros de turnos y ventas menos gastos, adelantos, retiros y liquidaciones. */
export function computeCashSummary(params: {
  methods: string[];
  appointments: { price: number | null; payment_method?: string | null }[];
  sales: { total: number | null; payment_method?: string | null }[];
  movements: { type: string; amount: number; payment_method?: string | null; voided_at?: string | null }[];
}): CashSummary {
  const byMethod = new Map<string, { income: number; outcome: number }>();
  const ensure = (method: string) => {
    let row = byMethod.get(method);
    if (!row) {
      row = { income: 0, outcome: 0 };
      byMethod.set(method, row);
    }
    return row;
  };

  // Los medios configurados salen primero y en su orden, aunque no tengan movimientos
  for (const method of params.methods) ensure(normalizeMethod(method));

  for (const a of params.appointments) ensure(normalizeMethod(a.payment_method)).income += Number(a.price ?? 0);
  for (const s of params.sales) ensure(normalizeMethod(s.payment_method)).income += Number(s.total ?? 0);
  for (const mv of params.movements) {
    if (mv.voided_at) continue;
    const row = ensure(normalizeMethod(mv.payment_method));
    if (mv.type === "income") row.income += Number(mv.amount);
    else if (OUTCOME_TYPES.has(mv.type)) row.outcome += Number(mv.amount);
  }

  // "Sin especificar" siempre al final
  const ordered = [...byMethod.keys()].filter((m) => m !== UNSPECIFIED_METHOD);
  if (byMethod.has(UNSPECIFIED_METHOD)) ordered.push(UNSPECIFIED_METHOD);

  const rows = ordered.map((method) => {
    const { income, outcome } = byMethod.get(method)!;
    return { method, income, outcome, net: income - outcome };
  });
  const totals = rows.reduce(
    (acc, r) => ({ income: acc.income + r.income, outcome: acc.outcome + r.outcome, net: acc.net + r.net }),
    { income: 0, outcome: 0, net: 0 }
  );

  return { rows, totals };
}
