import type { ArcaEnvironment } from "@/lib/types/Arca";

export const ENV_LABELS: Record<ArcaEnvironment, string> = {
  homo: "Homologación",
  prod: "Producción",
};

export const STATUS_LABELS: Record<string, string> = {
  approved: "Aprobado",
  rejected: "Rechazado",
  pending: "En proceso",
  error: "Sin respuesta",
  voided: "Anulada",
};

export const SOURCE_LABELS: Record<string, string> = {
  appointment: "Turno",
  sale: "Venta",
  manual: "Manual",
};

export const DOC_TYPE_LABELS: Record<number, string> = {
  80: "CUIT",
  86: "CUIL",
  96: "DNI",
  99: "Cons. Final",
};

export type ArcaPeriod = "daily" | "weekly" | "biweekly" | "monthly" | "custom";
