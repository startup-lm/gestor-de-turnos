/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as auth from "@/lib/api/auth";
import * as flags from "@/lib/flags/server";
import * as wsaa from "@/lib/arca/wsaa";
import * as wsfe from "@/lib/arca/wsfe";
import { ArcaError } from "@/lib/arca/soap";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { POST } from "@/app/api/arca/invoices/[id]/credit-note/route";

vi.mock("@/lib/api/auth", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/supabase/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

vi.mock("@/lib/flags/server", () => ({
  isServerFeatureEnabled: vi.fn().mockResolvedValue(true),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/arca/wsaa", () => ({
  getAccessTicket: vi.fn(),
  withAccessTicket: vi.fn((config, _url, run) =>
    run({
      token: "tok",
      sign: "sig",
      expiresAt: "2026-11-13T00:00:00-03:00",
      cuit: String(config.cuit ?? "").replace(/\D/g, ""),
    })
  ),
}));

vi.mock("@/lib/arca/wsfe", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/arca/wsfe")>()),
  lastAuthorized: vi.fn(),
  requestCae: vi.fn(),
}));

function chain(result: { data: unknown; error: unknown } = { data: null, error: null }) {
  const q: Record<string, any> = {};
  for (const m of ["select", "eq", "neq", "is", "order", "limit", "insert", "update", "delete"]) {
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
  cert_pem: "CERT",
  key_pem: "KEY",
};

const ORIGINAL_INVOICE = {
  id: 10,
  created_at: "2026-11-12T10:00:00Z",
  voucher_date: "2026-11-12",
  status: "approved",
  total: 12000,
  customer_name: "Consumidor Final",
  cae: "76123456789012",
  cae_due_date: "2026-11-22",
  voucher_number: 8,
  voucher_type: 11,
  point_of_sale: 3,
  source_type: "appointment",
  source_id: 7,
  doc_type: 99,
  doc_number: null,
  invoice_type: 11,
  receiver_iva_condition: 5,
  environment: "homo",
};

const APPROVED_CN: wsfe.CaeResult = {
  approved: true,
  cae: "76999999999999",
  caeDueDate: "2026-11-22",
  voucherNumber: 2,
  errors: [],
  observations: [],
};

const callCreditNote = (id: string | number = 10) =>
  POST(new Request(`http://localhost:3000/api/arca/invoices/${id}/credit-note`, { method: "POST" }), {
    params: Promise.resolve({ id: String(id) }),
  });

describe("POST /api/arca/invoices/[id]/credit-note", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth.requireAdmin).mockResolvedValue({ email: "admin@test.com" } as any);
    vi.mocked(flags.isServerFeatureEnabled).mockResolvedValue(true);
    vi.mocked(wsaa.withAccessTicket).mockImplementation((config, _url, run) =>
      run({
        token: "tok",
        sign: "sig",
        expiresAt: "2026-11-13T00:00:00-03:00",
        cuit: String(config.cuit ?? "").replace(/\D/g, ""),
      })
    );
    vi.mocked(wsfe.lastAuthorized).mockResolvedValue(1);
    vi.mocked(wsfe.requestCae).mockResolvedValue(APPROVED_CN);
  });

  it("rechaza con 401 si no es admin", async () => {
    vi.mocked(auth.requireAdmin).mockResolvedValueOnce(null);
    const res = await callCreditNote();
    expect(res.status).toBe(401);
  });

  it("responde 404 si la feature arca está deshabilitada", async () => {
    vi.mocked(flags.isServerFeatureEnabled).mockResolvedValueOnce(false);
    const res = await callCreditNote();
    expect(res.status).toBe(404);
  });

  it("responde 404 si la factura original no existe", async () => {
    const origQuery = chain({ data: null, error: null });
    vi.mocked(supabaseAdmin.from).mockReturnValue(origQuery as any);

    const res = await callCreditNote(999);
    expect(res.status).toBe(404);
  });

  it("responde 409 si la factura original no está aprobada", async () => {
    const origQuery = chain({ data: { ...ORIGINAL_INVOICE, status: "pending" }, error: null });
    const settingsQuery = chain({ data: SETTINGS, error: null });

    let fromCount = 0;
    vi.mocked(supabaseAdmin.from).mockImplementation(((table: string) => {
      if (table === "arca_settings") return settingsQuery;
      fromCount++;
      return fromCount === 1 ? origQuery : settingsQuery;
    }) as any);

    const res = await callCreditNote();
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("Solo se pueden anular facturas aprobadas");
  });

  it("responde 409 si la factura no es tipo 11 (Factura C)", async () => {
    const origQuery = chain({ data: { ...ORIGINAL_INVOICE, voucher_type: 13, invoice_type: 13 }, error: null });
    const settingsQuery = chain({ data: SETTINGS, error: null });

    let fromCount = 0;
    vi.mocked(supabaseAdmin.from).mockImplementation(((table: string) => {
      if (table === "arca_settings") return settingsQuery;
      fromCount++;
      return fromCount === 1 ? origQuery : settingsQuery;
    }) as any);

    const res = await callCreditNote();
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("Solo se pueden anular facturas tipo C");
  });

  it("responde 409 si la factura es de otro entorno", async () => {
    const origQuery = chain({ data: { ...ORIGINAL_INVOICE, environment: "prod" }, error: null });
    const settingsQuery = chain({ data: SETTINGS, error: null }); // homo

    let fromCount = 0;
    vi.mocked(supabaseAdmin.from).mockImplementation(((table: string) => {
      if (table === "arca_settings") return settingsQuery;
      fromCount++;
      return fromCount === 1 ? origQuery : settingsQuery;
    }) as any);

    const res = await callCreditNote();
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("Esta factura es de otro entorno de ARCA");
  });

  it("responde 409 si la factura ya tiene una nota de crédito previa", async () => {
    const origQuery = chain({ data: ORIGINAL_INVOICE, error: null });
    const settingsQuery = chain({ data: SETTINGS, error: null });
    const cnCheckQuery = chain({ data: { id: 55, status: "approved" }, error: null });

    let invCalls = 0;
    vi.mocked(supabaseAdmin.from).mockImplementation(((table: string) => {
      if (table === "arca_settings") return settingsQuery;
      if (table === "arca_invoices") {
        invCalls++;
        return invCalls === 1 ? origQuery : cnCheckQuery;
      }
      return chain();
    }) as any);

    const res = await callCreditNote();
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("Esta factura ya tiene una nota de crédito");
  });

  it("responde 409 si ocurre colisión por pedidos simultáneos (código 23505)", async () => {
    const origQuery = chain({ data: ORIGINAL_INVOICE, error: null });
    const settingsQuery = chain({ data: SETTINGS, error: null });
    const cnCheckQuery = chain({ data: null, error: null });
    const pendingQuery = chain({
      data: null,
      error: { code: "23505", message: "duplicate key value violates unique constraint" },
    });

    let invCalls = 0;
    vi.mocked(supabaseAdmin.from).mockImplementation(((table: string) => {
      if (table === "arca_settings") return settingsQuery;
      if (table === "arca_invoices") {
        invCalls++;
        if (invCalls === 1) return origQuery;
        if (invCalls === 2) return cnCheckQuery;
        return pendingQuery;
      }
      return chain();
    }) as any);

    const res = await callCreditNote();
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("Esta factura ya tiene una nota de crédito");
  });

  it("emisión exitosa: emite nota tipo 13 con comprobante asociado, anula original y libera cobro", async () => {
    const origQuery = chain({ data: ORIGINAL_INVOICE, error: null });
    const settingsQuery = chain({ data: SETTINGS, error: null });
    const cnCheckQuery = chain({ data: null, error: null });
    const pendingQuery = chain({
      data: {
        id: 77,
        cae: APPROVED_CN.cae,
        cae_due_date: APPROVED_CN.caeDueDate,
        voucher_number: 2,
        voucher_type: 13,
        point_of_sale: 3,
      },
      error: null,
    });
    const appointmentsQuery = chain({ data: [{ id: 7 }], error: null });

    let invCalls = 0;
    vi.mocked(supabaseAdmin.from).mockImplementation(((table: string) => {
      if (table === "arca_settings") return settingsQuery;
      if (table === "appointments") return appointmentsQuery;
      if (table === "arca_invoices") {
        invCalls++;
        if (invCalls === 1) return origQuery;
        if (invCalls === 2) return cnCheckQuery;
        return pendingQuery;
      }
      return chain();
    }) as any);

    const res = await callCreditNote(10);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      success: true,
      invoiceId: 77,
      cae: APPROVED_CN.cae,
      voucherNumber: 2,
      voucherType: 13,
    });

    // 1. lastAuthorized consultó tipo 13
    expect(wsfe.lastAuthorized).toHaveBeenCalledWith(expect.any(String), expect.anything(), 3, 13);

    // 2. requestCae llamado con tipo 13 y comprobante asociado 11
    expect(wsfe.requestCae).toHaveBeenCalledWith(
      expect.any(String),
      expect.anything(),
      expect.objectContaining({
        voucherType: 13,
        voucherNumber: 2,
        total: 12000,
        associated: {
          type: 11,
          pointOfSale: 3,
          number: 8,
          cuit: "20123456789",
          date: "20261112",
        },
      })
    );

    // 3. Nota de crédito queda aprobada con credit_note_of_id
    expect(pendingQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "approved",
        credit_note_of_id: 10,
        cae: APPROVED_CN.cae,
      })
    );

    // 4. Factura original pasa a voided
    expect(pendingQuery.update).toHaveBeenCalledWith({ status: "voided" });

    // 5. El turno asociado se libera
    expect(appointmentsQuery.update).toHaveBeenCalledWith({ arca_invoice_id: null });
  });

  it("si la factura original no tiene voucher_date y created_at está en UTC nocturno, usa la fecha argentina para CbtesAsoc", async () => {
    const origWithoutVoucherDate = {
      ...ORIGINAL_INVOICE,
      voucher_date: null,
      created_at: "2026-11-12T01:30:00Z", // 22:30 del 11/11 en Argentina (UTC-3)
    };
    const origQuery = chain({ data: origWithoutVoucherDate, error: null });
    const settingsQuery = chain({ data: SETTINGS, error: null });
    const cnCheckQuery = chain({ data: null, error: null });
    const pendingQuery = chain({
      data: {
        id: 78,
        cae: APPROVED_CN.cae,
        cae_due_date: APPROVED_CN.caeDueDate,
        voucher_number: 2,
        voucher_type: 13,
        point_of_sale: 3,
      },
      error: null,
    });
    const appointmentsQuery = chain({ data: [{ id: 7 }], error: null });

    let invCalls = 0;
    vi.mocked(supabaseAdmin.from).mockImplementation(((table: string) => {
      if (table === "arca_settings") return settingsQuery;
      if (table === "appointments") return appointmentsQuery;
      if (table === "arca_invoices") {
        invCalls++;
        if (invCalls === 1) return origQuery;
        if (invCalls === 2) return cnCheckQuery;
        return pendingQuery;
      }
      return chain();
    }) as any);

    const res = await callCreditNote(10);
    expect(res.status).toBe(200);

    expect(wsfe.requestCae).toHaveBeenCalledWith(
      expect.any(String),
      expect.anything(),
      expect.objectContaining({
        associated: expect.objectContaining({
          date: "20261111",
        }),
      })
    );
  });

  it("rechazada por ARCA: guarda nota de crédito como rejected y no anula la original", async () => {
    vi.mocked(wsfe.requestCae).mockResolvedValueOnce({
      approved: false,
      cae: null,
      caeDueDate: null,
      voucherNumber: 2,
      errors: [{ code: 10015, message: "Comprobante asociado inválido" }],
      observations: [],
    });

    const origQuery = chain({ data: ORIGINAL_INVOICE, error: null });
    const settingsQuery = chain({ data: SETTINGS, error: null });
    const cnCheckQuery = chain({ data: null, error: null });
    const pendingQuery = chain({ data: { id: 77 }, error: null });
    const appointmentsQuery = chain({ data: [{ id: 7 }], error: null });

    let invCalls = 0;
    vi.mocked(supabaseAdmin.from).mockImplementation(((table: string) => {
      if (table === "arca_settings") return settingsQuery;
      if (table === "appointments") return appointmentsQuery;
      if (table === "arca_invoices") {
        invCalls++;
        if (invCalls === 1) return origQuery;
        if (invCalls === 2) return cnCheckQuery;
        return pendingQuery;
      }
      return chain();
    }) as any);

    const res = await callCreditNote(10);
    expect(res.status).toBe(422);
    expect((await res.json()).error).toContain("Comprobante asociado inválido");

    expect(pendingQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "rejected",
        error_message: "Comprobante asociado inválido (10015)",
      })
    );
    expect(pendingQuery.update).not.toHaveBeenCalledWith({ status: "voided" });
    expect(appointmentsQuery.update).not.toHaveBeenCalled();
  });

  it("sin respuesta de ARCA: guarda como error y no anula la original", async () => {
    vi.mocked(wsfe.requestCae).mockRejectedValueOnce(new ArcaError("ARCA no respondió", "network"));

    const origQuery = chain({ data: ORIGINAL_INVOICE, error: null });
    const settingsQuery = chain({ data: SETTINGS, error: null });
    const cnCheckQuery = chain({ data: null, error: null });
    const pendingQuery = chain({ data: { id: 77 }, error: null });
    const appointmentsQuery = chain({ data: [{ id: 7 }], error: null });

    let invCalls = 0;
    vi.mocked(supabaseAdmin.from).mockImplementation(((table: string) => {
      if (table === "arca_settings") return settingsQuery;
      if (table === "appointments") return appointmentsQuery;
      if (table === "arca_invoices") {
        invCalls++;
        if (invCalls === 1) return origQuery;
        if (invCalls === 2) return cnCheckQuery;
        return pendingQuery;
      }
      return chain();
    }) as any);

    const res = await callCreditNote(10);
    expect(res.status).toBe(502);
    expect((await res.json()).error).toContain("ARCA no respondió");

    expect(pendingQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "error",
      })
    );
    expect(pendingQuery.update).not.toHaveBeenCalledWith({ status: "voided" });
    expect(appointmentsQuery.update).not.toHaveBeenCalled();
  });

  it("si falla antes de ARCA (login), borra el comprobante pendiente", async () => {
    vi.mocked(wsaa.withAccessTicket).mockRejectedValueOnce(new ArcaError("Fallo de firma", "auth"));

    const origQuery = chain({ data: ORIGINAL_INVOICE, error: null });
    const settingsQuery = chain({ data: SETTINGS, error: null });
    const cnCheckQuery = chain({ data: null, error: null });
    const pendingQuery = chain({ data: { id: 77 }, error: null });

    let invCalls = 0;
    vi.mocked(supabaseAdmin.from).mockImplementation(((table: string) => {
      if (table === "arca_settings") return settingsQuery;
      if (table === "arca_invoices") {
        invCalls++;
        if (invCalls === 1) return origQuery;
        if (invCalls === 2) return cnCheckQuery;
        return pendingQuery;
      }
      return chain();
    }) as any);

    const res = await callCreditNote(10);
    expect(res.status).toBe(502);
    expect(pendingQuery.delete).toHaveBeenCalled();
  });
});
