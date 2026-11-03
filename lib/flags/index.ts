export type FeatureFlagName =
  | "arca"
  | "google_reviews"
  | "metrics"
  | "sales"
  | "commission_payouts"
  | "staff_management"
  | "finances"
  | "expenses"
  | "booking_rules"
  | "stock_control"
  | "cash_register"
  | (string & {});

/**
 * Defaults de Feature Flags en código.
 * Regla: Toda feature nueva sale con el default apagado (false).
 */
export const DEFAULT_FEATURES: Record<string, boolean> = {
  arca: false,               // Facturación ARCA
  google_reviews: false,     // Reseñas de Google en la home
  metrics: false,            // Sección métricas
  sales: false,              // Registro de venta de productos
  commission_payouts: false, // Liquidación de comisiones
  staff_management: false,   // Gestión de profesionales
  finances: false,           // Sección finanzas
  expenses: false,           // Registro de gastos y egresos
  booking_rules: false,      // Personalización del criterio de asignación de turnos
  stock_control: false,      // Las ventas descuentan stock y no se vende sin stock
  cash_register: false,      // Caja diaria: hay que abrirla para cobrar y se cierra con arqueo
};

/**
 * Planes comerciales. Cada plan define qué features incluye.
 * Una feature nueva no se agrega a ningún plan hasta que se decida venderla.
 */
export type PlanName = "basic" | "standard" | "premium";

export const DEFAULT_PLAN: PlanName = "basic";

const STANDARD_FEATURES: Record<string, boolean> = {
  arca: true,
  google_reviews: true,
  metrics: true,
  sales: true,
  commission_payouts: true,
  staff_management: true,
  booking_rules: true,
  stock_control: true,
  cash_register: true,
};

export const PLAN_FEATURES: Record<PlanName, Record<string, boolean>> = {
  basic: {},
  standard: STANDARD_FEATURES,
  premium: {
    ...STANDARD_FEATURES,
    finances: true,
    expenses: true,
  },
};

export interface PlanLimits {
  /** Cantidad máxima de profesionales (barberos) cargados. */
  maxBarbers: number;
  /** Cantidad máxima de medios de cobro configurables. 0 = usa los medios por defecto. */
  maxPaymentMethods: number;
}

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  basic: { maxBarbers: 1, maxPaymentMethods: 0 },
  standard: { maxBarbers: 4, maxPaymentMethods: 3 },
  premium: { maxBarbers: Infinity, maxPaymentMethods: Infinity },
};

/** Medios de cobro que usa un plan sin medios configurables. */
export const DEFAULT_PAYMENT_METHODS = ["Efectivo", "Mercado Pago"];

/** Criterio de asignación de profesional cuando el plan no permite personalizarlo. */
export const DEFAULT_ASSIGNMENT_CRITERIA = "random";

export function isPlanName(value: unknown): value is PlanName {
  return typeof value === "string" && value in PLAN_FEATURES;
}

export function resolvePlan(plan?: string | null): PlanName {
  return isPlanName(plan) ? plan : DEFAULT_PLAN;
}

export function getPlanLimits(plan?: string | null): PlanLimits {
  return PLAN_LIMITS[resolvePlan(plan)];
}

/**
 * Evalúa si una feature flag está habilitada para el cliente actual.
 * Función pura y segura para ejecutar en navegador y cliente.
 *
 * Orden de prioridad (todo vive en business_settings de cada cliente):
 * 1. `features[flag]`: override puntual (ej. regalar una feature a un cliente basic).
 * 2. `plan`: lo que incluye el plan contratado.
 * 3. `DEFAULT_FEATURES`: apagado.
 *
 * Solo el dueño del SaaS modifica `plan` y `features`, directo en la base:
 * la API de configuración del local los ignora.
 */
export function isFeatureEnabled(
  flag: FeatureFlagName,
  features?: Record<string, boolean> | null,
  plan?: string | null
): boolean {
  if (features && typeof features[flag] === "boolean") {
    return features[flag];
  }
  const planFeatures = PLAN_FEATURES[resolvePlan(plan)];
  if (typeof planFeatures[flag] === "boolean") {
    return planFeatures[flag];
  }
  return DEFAULT_FEATURES[flag] ?? false;
}
