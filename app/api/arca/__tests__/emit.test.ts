/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as auth from "@/lib/api/auth";
import * as wsaa from "@/lib/arca/wsaa";
import * as wsfe from "@/lib/arca/wsfe";
import { ArcaError } from "@/lib/arca/soap";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { POST as emitInvoice } from "@/app/api/arca/emit/route";

vi.mock("@/lib/api/auth", () => ({
  requireAdmin: vi.fn(),
  requireBarberOrAdmin: vi.fn(),
}));

vi.mock("@/lib/supabase/supabaseAdmin", () => ({
  supabaseAdmin: { from: vi.fn() },
}));

vi.mock("@/lib/flags/server", () => ({
  requirePlanFeature: vi.fn().mockResolvedValue(null),
  isServerFeatureEnabled: vi.fn().mockResolvedValue(true),
}));

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

vi.mock("@/lib/arca/wsaa", () => ({
  getAccessTicket: vi.fn(),
  withAccessTicket: vi.fn((config, _url, run) =>
    run({ token: "t", sign: "s", expiresAt: "2026-11-04T00:00:00-03:00", cuit: String(config.cuit ?? "").replace(/\D/g, "") })
  ),
}));

vi.mock("@/lib/arca/wsfe", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/arca/wsfe")>()),
  lastAuthorized: vi.fn(),
  requestCae: vi.fn(),
}));

const ADMIN = { user: {}, barber: { id: 1, role: "admin" } } as any;
const BARBER_2 = { user: {}, barber: { id: 2, role: "barber" } } as any;
const SETTINGS = { id: 1, environment: "homo", cuit: "20123456789", point_of_sale: 3, cert_pem: "c", key_pem: "k" };
const PAID = { id: 7, barber_id: 1, price: 12000, paid: true, arca_invoice_id: null };

const APPROVED: wsfe.CaeResult = {
  approved: true,
  cae: "76123456789012",
  caeDueDate: "2026-11-13",
  voucherNumber: 8,
  errors: [],
  observations: [],
};
const rejected = (code: number, message: string): wsfe.CaeResult => ({
  approved: false,
  cae: null,
  caeDueDate: null,
  voucherNumber: 8,
  errors: [{ code, message }],
  observations: [],
});

/** Consulta encadenable de Supabase: cada método devuelve la misma consulta y al final resuelve `result`. */
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

/** appointments: la primera consulta lee el turno; las siguientes lo marcan o lo liberan */
function mockTables(
  source: Record<string, unknown> | null,
  { markResult = [{ id: 7 }], settings = SETTINGS as Record<string, unknown> | null } = {}
) {
  const sourceQuery = chain({ data: source, error: null });
  const markQuery = chain({ data: markResult, error: null });
  const invoices = chain({
    data: { id: 50, cae: APPROVED.cae, cae_due_date: APPROVED.caeDueDate, voucher_number: 8, voucher_type: 11, point_of_sale: 3 },
    error: null,
  });
  const settingsQuery = chain({ data: settings, error: null });
  let appointmentsCalls = 0;
  vi.mocked(supabaseAdmin.from).mockImplementation(((table: string) => {
    if (table === "arca_settings") return settingsQuery;
    if (table === "arca_invoices") return invoices;
    appointmentsCalls++;
    return appointmentsCalls === 1 ? sourceQuery : markQuery;
  }) as any);
  return { invoices, markQuery };
}

const json = (body: unknown) =>
  new Request("http://localhost:3000/api/arca/emit", { method: "POST", body: JSON.stringify(body) });
const emitAppointment = (extra: Record<string, unknown> = {}) =>
  emitInvoice(json({ sourceType: "appointment", sourceId: 7, ...extra }));

const lastAuthorized = vi.mocked(wsfe.lastAuthorized);
const requestCae = vi.mocked(wsfe.requestCae);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth.requireBarberOrAdmin).mockResolvedValue(ADMIN);
  vi.mocked(wsaa.withAccessTicket).mockImplementation((config, _url, run) =>
    run({ token: "t", sign: "s", expiresAt: "2026-11-04T00:00:00-03:00", cuit: String(config.cuit ?? "").replace(/\D/g, "") })
  );
  lastAuthorized.mockResolvedValue(7);
  requestCae.mockResolvedValue(APPROVED);
});

describe("ARCA: permisos y origen del comprobante", () => {
  it("un barbero no puede emitir comprobantes manuales", async () => {
    vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(BARBER_2);
    const response = await emitInvoice(json({ sourceType: "manual", total: 1000 }));
    expect(response.status).toBe(403);
  });

  it("un barbero no puede facturar el turno de otro", async () => {
    vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(BARBER_2);
    mockTables(PAID);
    const response = await emitAppointment();
    expect(response.status).toBe(403);
  });

  it("no factura dos veces el mismo turno", async () => {
    const { invoices } = mockTables({ ...PAID, arca_invoice_id: 3 });
    invoices.maybeSingle.mockResolvedValueOnce({ data: { id: 3, status: "approved" }, error: null });
    const response = await emitAppointment();
    expect(response.status).toBe(409);
    expect((await response.json()).error).toBe("Este turno ya tiene factura");
    expect(requestCae).not.toHaveBeenCalled();
  });

  it("si el turno tiene una factura sin confirmar (error o pending), avisa que la verifique", async () => {
    const { invoices } = mockTables({ ...PAID, arca_invoice_id: 3 });
    invoices.maybeSingle.mockResolvedValueOnce({ data: { id: 3, status: "error" }, error: null });
    const response = await emitAppointment();
    expect(response.status).toBe(409);
    expect((await response.json()).error).toBe("Este cobro tiene una factura sin confirmar. Verificala en Facturas");
    expect(requestCae).not.toHaveBeenCalled();
  });

  it("no factura un turno sin cobrar", async () => {
    mockTables({ ...PAID, paid: false });
    const response = await emitAppointment();
    expect(response.status).toBe(409);
  });

  it("sin certificado o punto de venta pide completar la configuración", async () => {
    mockTables(PAID, { settings: { ...SETTINGS, cert_pem: null } });
    const response = await emitAppointment();
    expect(response.status).toBe(400);
    expect(requestCae).not.toHaveBeenCalled();
  });

  it("con CUIT exige 11 números y la condición frente al IVA", async () => {
    mockTables(PAID);
    expect((await emitAppointment({ docType: 80, docNumber: "123" })).status).toBe(400);
    expect((await emitAppointment({ docType: 80, docNumber: "20123456789" })).status).toBe(400);
  });
});

describe("ARCA: emisión real", () => {
  it("aprobado: usa el total del turno y el número siguiente al último de ARCA, y marca el turno", async () => {
    const { invoices, markQuery } = mockTables(PAID);
    const response = await emitAppointment({ total: 1 });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, cae: APPROVED.cae, voucherNumber: 8 });
    expect(requestCae).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ cuit: "20123456789" }),
      expect.objectContaining({ total: 12000, voucherNumber: 8, voucherType: 11, concept: 2, receiverIvaCondition: 5 })
    );
    expect(invoices.insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending", total: 12000, source_id: 7, environment: "homo", voucher_date: expect.any(String) })
    );
    expect(markQuery.update).toHaveBeenCalledWith({ arca_invoice_id: 50 });
    expect(invoices.update).toHaveBeenCalledWith(expect.objectContaining({ status: "approved", cae: APPROVED.cae }));
  });

  it("si otro pedido ya marcó el turno, borra el pendiente sin llamar a ARCA", async () => {
    const { invoices } = mockTables(PAID, { markResult: [] });
    const response = await emitAppointment();
    expect(response.status).toBe(409);
    expect(invoices.delete).toHaveBeenCalled();
    expect(requestCae).not.toHaveBeenCalled();
  });

  it("rechazado: lo guarda con el motivo y libera el turno", async () => {
    requestCae.mockResolvedValueOnce(rejected(10015, "El DocNro es inválido"));
    const { invoices, markQuery } = mockTables(PAID);
    const response = await emitAppointment();

    expect(response.status).toBe(422);
    expect((await response.json()).error).toContain("El DocNro es inválido");
    expect(invoices.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "rejected", error_message: "El DocNro es inválido (10015)" })
    );
    expect(markQuery.update).toHaveBeenCalledWith({ arca_invoice_id: null });
  });

  it("si el número ya lo tomó otro comprobante, lo vuelve a pedir una vez", async () => {
    requestCae.mockResolvedValueOnce(rejected(wsfe.ERR_WRONG_NUMBER, "Número incorrecto"));
    lastAuthorized.mockResolvedValueOnce(7).mockResolvedValueOnce(8);
    mockTables(PAID);
    const response = await emitAppointment();

    expect(response.status).toBe(200);
    expect(lastAuthorized).toHaveBeenCalledTimes(2);
    expect(requestCae).toHaveBeenLastCalledWith(expect.any(String), expect.anything(), expect.objectContaining({ voucherNumber: 9 }));
  });

  it("sin respuesta de ARCA al pedir el CAE: queda como 'error' y no libera el turno", async () => {
    requestCae.mockRejectedValueOnce(new ArcaError("ARCA no respondió", "network"));
    const { invoices, markQuery } = mockTables(PAID);
    const response = await emitAppointment();

    expect(response.status).toBe(502);
    expect((await response.json()).error).toBe(
      "ARCA no respondió. Entrá a Facturas y tocá \"Verificar en ARCA\" antes de volver a facturar"
    );
    expect(invoices.update).toHaveBeenCalledWith(expect.objectContaining({ voucher_number: 8 }));
    expect(invoices.update).toHaveBeenCalledWith(expect.objectContaining({ status: "error" }));
    expect(invoices.delete).not.toHaveBeenCalled();
    expect(markQuery.update).not.toHaveBeenCalledWith({ arca_invoice_id: null });
  });

  it("si falla el login antes de pedir el CAE, no deja nada guardado", async () => {
    vi.mocked(wsaa.withAccessTicket).mockRejectedValueOnce(new ArcaError("ARCA rechazó el certificado", "auth"));
    const { invoices } = mockTables(PAID);
    const response = await emitAppointment();

    expect(response.status).toBe(502);
    expect((await response.json()).error).toBe("ARCA rechazó el certificado");
    expect(invoices.delete).toHaveBeenCalled();
    expect(requestCae).not.toHaveBeenCalled();
  });

  it("una venta se factura como productos (concepto 1)", async () => {
    mockTables({ id: 7, barber_id: 1, total: 5000, arca_invoice_id: null });
    const response = await emitInvoice(json({ sourceType: "sale", sourceId: 7 }));
    expect(response.status).toBe(200);
    expect(requestCae).toHaveBeenCalledWith(expect.any(String), expect.anything(), expect.objectContaining({ concept: 1, total: 5000 }));
  });
});
