import type { ArcaDocType } from "@/lib/types/Arca";

/** Condición frente al IVA del receptor (CondicionIVAReceptorId) admitida en Factura C */
export const RECEIVER_IVA_CONDITIONS: { value: number; label: string }[] = [
  { value: 5, label: "Consumidor final" },
  { value: 6, label: "Monotributista" },
  { value: 1, label: "Responsable inscripto" },
  { value: 4, label: "Exento" },
  { value: 13, label: "Monotributista social" },
];

export const CONSUMIDOR_FINAL = 5;

const VALID = new Set(RECEIVER_IVA_CONDITIONS.map((c) => c.value));

/** Sin CUIT o CUIL el receptor es consumidor final; con CUIT o CUIL vale lo elegido */
export function resolveReceiverCondition(docType: ArcaDocType, chosen?: number | null): number | null {
  if (docType === 99 || docType === 96) return CONSUMIDOR_FINAL;
  return chosen != null && VALID.has(chosen) ? chosen : null;
}
