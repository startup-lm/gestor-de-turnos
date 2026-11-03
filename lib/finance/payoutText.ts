import { CommissionPayout } from "@/lib/types/cash";

const ars = (n: number) => `$${Math.round(Number(n)).toLocaleString("es-AR")}`;

const formatDay = (day: string) => {
  const [y, m, d] = day.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

/** Texto de la liquidación para compartir por WhatsApp (recibo y historial usan el mismo). */
export function buildPayoutWhatsAppText(payout: CommissionPayout, barberName: string): string {
  const lines = [
    `💈 *Liquidación #${payout.id}*`,
    "",
    `👤 *Profesional:* ${barberName}`,
    `📅 *Período:* ${formatDay(payout.period_start)} al ${formatDay(payout.period_end)}`,
    "",
    `✂️ Cortes: ${payout.cuts_count} · comisión ${ars(payout.cuts_commission_amount)}`,
    `🛍️ Ventas: ${payout.sales_count} · comisión ${ars(payout.sales_commission_amount)}`,
  ];
  if (Number(payout.advances_deducted) > 0) {
    lines.push(`➖ Adelantos descontados: ${ars(payout.advances_deducted)}`);
  }
  lines.push(
    "",
    `💰 *Total pagado:* ${ars(payout.total_paid)}`,
    `💳 *Medio de pago:* ${payout.payment_method}`,
    `📆 *Fecha de pago:* ${formatDay(payout.payment_date)}`
  );
  if (payout.reference_code) lines.push(`🔖 *Referencia:* ${payout.reference_code}`);
  if (payout.receipt_notes) lines.push(`📝 ${payout.receipt_notes}`);
  return lines.join("\n");
}
