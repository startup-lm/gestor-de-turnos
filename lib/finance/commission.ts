/**
 * Comisión de un turno o una venta: usa el % guardado al cobrar y, si no lo tiene
 * (cargado antes de que existiera commission_rate), el % actual del barbero.
 */
export function commissionOf(amount: number | null | undefined, savedRate: number | null | undefined, currentRate: number): number {
  const rate = savedRate ?? currentRate;
  return Number(amount ?? 0) * Number(rate ?? 0);
}
