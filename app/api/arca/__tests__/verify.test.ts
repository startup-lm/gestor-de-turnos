/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as auth from "@/lib/api/auth";
import * as flags from "@/lib/flags/server";
import * as wsaa from "@/lib/arca/wsaa";
import * as wsfe from "@/lib/arca/wsfe";
import { ArcaError } from "@/lib/arca/soap";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { POST } from "@/app/api/arca/invoices/[id]/verify/route";

vi.mock("@/lib/api/auth", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/flags/server", () => ({
  isServerFeatureEnabled: vi.fn().mockResolvedValue(true),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/arca/wsaa", () => ({
  getAccessTicket: vi.fn(),
}));

vi.mock("@/lib/arca/wsfe", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/arca/wsfe")>()),
  consultVoucher: vi.fn(),
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

const SETTINGS = {
  id: 1,
  environment: "homo",
  cuit: "20123456789",
  point_of_sale: 3,
  cert_pem: "c",
  key_pem: "k",
};

const BASE_INVOICE = {
  id: 10,
  created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 min ago
  status: "error",
  total: 12000,
  customer_name: "Cons. Final",
  cae: null,
  cae_due_date: null,
  voucher_number: 8,
  voucher_type: 11,
  point_of_sale: 3,
  source_type: "appointment",
  source_id: 7,
  doc_type: 99,
  doc_number: null,
  invoice_type: 11,
};

function setupMocks({
  invoice = BASE_INVOICE as Record<string, unknown> | null,
  settings = SETTINGS as Record<string, unknown> | null,
} = {}) {
  const invoiceQuery = chain({ data: invoice, error: null });
  const settingsQuery = chain({ data: settings, error: null });
  const appointmentsQuery = chain({ data: [{ id: 7 }], error: null });
  const salesQuery = chain({ data: [{ id: 7 }], error: null });

  vi.mocked(supabaseAdmin.from).mockImplementation(((table: string) => {
    if (table === "arca_settings") return settingsQuery;
    if (table === "arca_invoices") return invoiceQuery;
    if (table === "appointments") return appointmentsQuery;
    if (table === "sales") return salesQuery;
    return chain();
  }) as any);

  return { invoiceQuery, settingsQuery, appointmentsQuery, salesQuery };
}

const callVerify = (id: string | number = 10) =>
  POST(new Request(`http://localhost:3000/api/arca/invoices/${id}/verify`, { method: "POST" }), {
    params: Promise.resolve({ id: String(id) }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth.requireAdmin).mockResolvedValue({ email: "admin@test.com" } as any);
  vi.mocked(flags.isServerFeatureEnabled).mockResolvedValue(true);
  vi.mocked(wsaa.getAccessTicket).mockResolvedValue({
    token: "t",
    sign: "s",
    expiresAt: "2026-11-04T00:00:00-03:00",
  });
});

describe("POST /api/arca/invoices/[id]/verify", () => {
  it("rechaza con 401 si no es admin", async () => {
    vi.mocked(auth.requireAdmin).mockResolvedValueOnce(null);
    const res = await callVerify();
    expect(res.status).toBe(401);
  });

  it("responde 404 si la feature arca está deshabilitada", async () => {
    vi.mocked(flags.isServerFeatureEnabled).mockResolvedValueOnce(false);
    const res = await callVerify();
    expect(res.status).toBe(404);
  });

  it("responde 404 si la factura no existe", async () => {
    setupMocks({ invoice: null });
    const res = await callVerify(999);
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Factura no encontrada");
  });

  it("responde 409 si la factura está en estado approved", async () => {
    setupMocks({ invoice: { ...BASE_INVOICE, status: "approved" } });
    const res = await callVerify();
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("Esta factura no necesita verificación");
  });

  it("responde 409 si la factura está en pending creada hace menos de 2 minutos", async () => {
    setupMocks({
      invoice: {
        ...BASE_INVOICE,
        status: "pending",
        created_at: new Date().toISOString(), // recent
      },
    });
    const res = await callVerify();
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("Esta factura no necesita verificación");
  });

  it("sin número de comprobante (voucher_number null): rechaza y libera el turno", async () => {
    const { invoiceQuery, appointmentsQuery } = setupMocks({
      invoice: { ...BASE_INVOICE, voucher_number: null },
    });

    const res = await callVerify();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, status: "rejected" });
    expect(invoiceQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "rejected", error_message: "No llegó a enviarse a ARCA" })
    );
    expect(appointmentsQuery.update).toHaveBeenCalledWith({ arca_invoice_id: null });
    expect(wsfe.consultVoucher).not.toHaveBeenCalled();
  });

  it("encontrado en ARCA y coincide: aprueba la factura y no libera el turno", async () => {
    const { invoiceQuery, appointmentsQuery } = setupMocks();
    vi.mocked(wsfe.consultVoucher).mockResolvedValueOnce({
      found: true,
      approved: true,
      cae: "76123456789012",
      caeDueDate: "2026-11-13",
      total: 12000,
      docType: 99,
      docNumber: "0",
      voucherNumber: 8,
    });

    const res = await callVerify();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      status: "approved",
      cae: "76123456789012",
    });
    expect(invoiceQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "approved",
        cae: "76123456789012",
        cae_due_date: "2026-11-13",
        error_message: null,
      })
    );
    expect(appointmentsQuery.update).not.toHaveBeenCalled();
  });

  it("no encontrado en ARCA: marca como rechazada y libera el turno", async () => {
    const { invoiceQuery, appointmentsQuery } = setupMocks();
    vi.mocked(wsfe.consultVoucher).mockResolvedValueOnce({ found: false });

    const res = await callVerify();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, status: "rejected" });
    expect(invoiceQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "rejected",
        error_message: "ARCA no tiene este comprobante: no se emitió",
        voucher_number: null,
      })
    );
    expect(appointmentsQuery.update).toHaveBeenCalledWith({ arca_invoice_id: null });
  });

  it("encontrado en ARCA pero con otro total: rechaza y libera el turno", async () => {
    const { invoiceQuery, appointmentsQuery } = setupMocks();
    vi.mocked(wsfe.consultVoucher).mockResolvedValueOnce({
      found: true,
      approved: true,
      cae: "99999999999999",
      caeDueDate: "2026-11-13",
      total: 50000, // different from 12000
      docType: 99,
      docNumber: "0",
      voucherNumber: 8,
    });

    const res = await callVerify();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, status: "rejected" });
    expect(invoiceQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "rejected",
        error_message: "ARCA no tiene este comprobante: no se emitió",
        voucher_number: null,
      })
    );
    expect(appointmentsQuery.update).toHaveBeenCalledWith({ arca_invoice_id: null });
  });

  it("error de ARCA: devuelve 502 sin modificar la factura ni liberar", async () => {
    const { invoiceQuery, appointmentsQuery } = setupMocks();
    vi.mocked(wsfe.consultVoucher).mockRejectedValueOnce(new ArcaError("Error de comunicación", "network"));

    const res = await callVerify();
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("Error de comunicación");
    expect(invoiceQuery.update).not.toHaveBeenCalled();
    expect(appointmentsQuery.update).not.toHaveBeenCalled();
  });
});
