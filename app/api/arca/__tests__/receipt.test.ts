/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as auth from "@/lib/api/auth";
import * as flags from "@/lib/flags/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { GET } from "@/app/api/arca/invoices/[id]/receipt/route";

vi.mock("@/lib/api/auth", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/flags/server", () => ({
  isServerFeatureEnabled: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/supabase/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

function chain(result: { data: unknown; error: unknown } = { data: null, error: null }) {
  const q: Record<string, any> = {};
  for (const m of ["select", "eq", "is", "order", "limit", "insert", "update", "delete"]) {
    q[m] = vi.fn(() => q);
  }
  q.maybeSingle = vi.fn(() => Promise.resolve(result));
  q.single = vi.fn(() => Promise.resolve(result));
  q.then = (resolve: (v: unknown) => unknown) => resolve(result);
  return q;
}

const APPROVED_INVOICE = {
  id: 10,
  created_at: "2026-11-12T14:00:00Z",
  voucher_date: "2026-11-12",
  status: "approved",
  total: 12000,
  customer_name: "Juan Pérez",
  cae: "76123456789012",
  cae_due_date: "2026-11-22",
  voucher_number: 42,
  voucher_type: 11,
  point_of_sale: 3,
  doc_type: 96,
  doc_number: "38123456",
  invoice_type: 11,
  receiver_iva_condition: 5,
};

const SETTINGS = {
  id: 1,
  cuit: "20123456789",
  point_of_sale: 3,
  legal_name: "Barbería Turnik",
  fiscal_address: "Av. Corrientes 1234",
  gross_income: "20-12345678-9",
  activity_start_date: "2024-01-01",
};

const callReceipt = (id: string | number = 10) =>
  GET(new Request(`http://localhost:3000/api/arca/invoices/${id}/receipt`), {
    params: Promise.resolve({ id: String(id) }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth.requireAdmin).mockResolvedValue({ email: "admin@test.com" } as any);
  vi.mocked(flags.isServerFeatureEnabled).mockResolvedValue(true);
});

describe("GET /api/arca/invoices/[id]/receipt", () => {
  it("rechaza con 401 si no es admin", async () => {
    vi.mocked(auth.requireAdmin).mockResolvedValueOnce(null);
    const res = await callReceipt();
    expect(res.status).toBe(401);
  });

  it("responde 404 si la feature arca está deshabilitada", async () => {
    vi.mocked(flags.isServerFeatureEnabled).mockResolvedValueOnce(false);
    const res = await callReceipt();
    expect(res.status).toBe(404);
  });

  it("responde 404 si la factura no existe", async () => {
    const invQuery = chain({ data: null, error: null });
    vi.mocked(supabaseAdmin.from).mockReturnValue(invQuery as any);

    const res = await callReceipt(999);
    expect(res.status).toBe(404);
  });

  it("responde 400 si el comprobante no tiene CAE", async () => {
    const invQuery = chain({ data: { ...APPROVED_INVOICE, cae: null }, error: null });
    vi.mocked(supabaseAdmin.from).mockReturnValue(invQuery as any);

    const res = await callReceipt();
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("El comprobante no posee autorización CAE");
  });

  it("devuelve factura, datos fiscales del emisor y qrUrl", async () => {
    const invQuery = chain({ data: APPROVED_INVOICE, error: null });
    const settingsQuery = chain({ data: SETTINGS, error: null });

    let fromCount = 0;
    vi.mocked(supabaseAdmin.from).mockImplementation(((table: string) => {
      if (table === "arca_settings") return settingsQuery;
      fromCount++;
      return fromCount === 1 ? invQuery : settingsQuery;
    }) as any);

    const res = await callReceipt(10);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.invoice.id).toBe(10);
    expect(body.issuer).toEqual({
      legalName: "Barbería Turnik",
      fiscalAddress: "Av. Corrientes 1234",
      grossIncome: "20-12345678-9",
      activityStartDate: "2024-01-01",
      cuit: "20123456789",
      pointOfSale: 3,
      taxCondition: "Responsable Monotributo",
    });
    expect(body.qrUrl).toContain("https://www.afip.gob.ar/fe/qr/?p=");
  });
});
