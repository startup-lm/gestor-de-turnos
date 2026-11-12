import type {
  ArcaConfig,
  ArcaConfigUpdate,
  ArcaEmitInput,
  ArcaEmitResult,
  ArcaInvoiceRecord,
  ArcaStatus,
  ArcaTestResult,
} from "@/lib/types/Arca";

import { getBaseUrl } from "@/utils/getBaseUrl";
const BASE = getBaseUrl();

export async function getArcaConfig(): Promise<ArcaConfig> {
  const res = await fetch(`${BASE}/api/arca/config`, {
    next: { tags: ["arca-config"] },
  });
  if (!res.ok) throw new Error("No se pudo cargar configuración ARCA");
  return res.json();
}

export async function updateArcaConfig(payload: ArcaConfigUpdate): Promise<ArcaConfig> {
  const res = await fetch(`${BASE}/api/arca/config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.error ?? "No se pudo guardar la configuración ARCA");
  }
  return res.json();
}

export async function testArcaConnection(): Promise<ArcaTestResult> {
  const res = await fetch(`${BASE}/api/arca/test`, { method: "POST" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.error ?? "No se pudo probar la conexión con ARCA");
  }
  return res.json();
}

export async function getArcaStatus(): Promise<ArcaStatus> {
  const res = await fetch(`${BASE}/api/arca/status`, {
    next: { tags: ["arca-status"] },
  });
  if (!res.ok) throw new Error("No se pudo cargar estado ARCA");
  return res.json();
}

export async function emitArcaInvoice(payload: ArcaEmitInput): Promise<ArcaEmitResult> {
  const res = await fetch(`${BASE}/api/arca/emit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    return { success: false, error: json?.error ?? "No se pudo emitir comprobante" };
  }
  return res.json();
}

export async function verifyArcaInvoice(
  id: number
): Promise<{ success: boolean; status?: string; error?: string }> {
  const res = await fetch(`${BASE}/api/arca/invoices/${id}/verify`, {
    method: "POST",
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    return { success: false, error: json?.error ?? "No se pudo verificar el comprobante" };
  }
  return res.json();
}

export async function getArcaInvoices(
  options: {
    limit?: number;
    sourceType?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    environment?: string;
  } = {}
): Promise<ArcaInvoiceRecord[]> {
  const { limit = 50, sourceType, status, dateFrom, dateTo, environment } = options;
  const params = new URLSearchParams({ limit: String(limit) });
  if (sourceType) params.set("source_type", sourceType);
  if (status) params.set("status", status);
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  if (environment) params.set("environment", environment);

  const res = await fetch(`${BASE}/api/arca/invoices?${params.toString()}`, {
    next: { tags: ["arca-invoices"] },
  });
  if (!res.ok) throw new Error("No se pudo cargar comprobantes ARCA");
  return res.json();
}
