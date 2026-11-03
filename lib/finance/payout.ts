export interface PayoutInput {
  cutsCount: number;
  cutsRevenue: number;
  commissionRate: number; // 0..1
  salesCount: number;
  salesRevenue: number;
  saleCommissionRate: number; // 0..1
  advancesTotal: number;
}

export interface PayoutResult {
  cutsCount: number;
  cutsCommission: number;
  salesCount: number;
  salesCommission: number;
  subtotal: number;
  advancesDeducted: number;
  /** max(0, subtotal - advancesDeducted) */
  totalToPay: number;
  /** max(0, advancesDeducted - subtotal): lo que queda a favor del local */
  advancesExcess: number;
}

/** Cálculo único de una liquidación: lo usan la vista previa, el registro y la UI. */
export function computePayout(input: PayoutInput): PayoutResult {
  const cutsCommission = Math.round(input.cutsRevenue * input.commissionRate);
  const salesCommission = Math.round(input.salesRevenue * input.saleCommissionRate);
  const subtotal = cutsCommission + salesCommission;
  const advancesDeducted = input.advancesTotal;

  return {
    cutsCount: input.cutsCount,
    cutsCommission,
    salesCount: input.salesCount,
    salesCommission,
    subtotal,
    advancesDeducted,
    totalToPay: Math.max(0, subtotal - advancesDeducted),
    advancesExcess: Math.max(0, advancesDeducted - subtotal),
  };
}

/** true si los períodos [aStart, aEnd] y [bStart, bEnd] ("YYYY-MM-DD", inclusivos) se superponen. */
export function periodsOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}
