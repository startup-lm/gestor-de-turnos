import type {
  ArcaConfig,
  ArcaConfigUpdate,
  ArcaEmitInput,
  ArcaEmitResult,
  ArcaInvoiceRecord,
  ArcaStatus,
} from "@/lib/types/Arca";

const BASE = process.env.NEXT_PUBLIC_APP_URL!;

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
  if (!res.ok) throw new Error("No se pudo guardar configuración ARCA");
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

export async function getArcaInvoices(limit: number = 20): Promise<ArcaInvoiceRecord[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  const res = await fetch(`${BASE}/api/arca/invoices?${params.toString()}`, {
    next: { tags: ["arca-invoices"] },
  });
  if (!res.ok) throw new Error("No se pudo cargar comprobantes ARCA");
  return res.json();
}
