/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as auth from "@/lib/api/auth";
import * as flags from "@/lib/flags/server";
import * as wsaa from "@/lib/arca/wsaa";
import * as wsfe from "@/lib/arca/wsfe";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { POST } from "@/app/api/arca/test/route";

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

vi.mock("@/lib/arca/wsaa", () => ({
  getAccessTicket: vi.fn(),
  certificateExpiry: vi.fn(),
  withAccessTicket: vi.fn((config, _url, run) =>
    run({ token: "t", sign: "s", expiresAt: "2026-11-04T00:00:00-03:00", cuit: String(config.cuit ?? "").replace(/\D/g, "") })
  ),
}));

vi.mock("@/lib/arca/wsfe", () => ({
  dummy: vi.fn(),
  pointsOfSale: vi.fn(),
  lastAuthorized: vi.fn(),
}));

function chain(result: { data: unknown; error: unknown } = { data: null, error: null }) {
  const q: Record<string, any> = {};
  for (const m of ["select", "eq", "is", "order", "limit"]) {
    q[m] = vi.fn(() => q);
  }
  q.maybeSingle = vi.fn(() => Promise.resolve(result));
  q.then = (resolve: (v: unknown) => unknown) => resolve(result);
  return q;
}

const SETTINGS = {
  id: 1,
  environment: "homo",
  cuit: "20123456789",
  point_of_sale: 3,
  cert_pem: "CERT_PEM",
  key_pem: "KEY_PEM",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth.requireAdmin).mockResolvedValue({ email: "admin@test.com" } as any);
  vi.mocked(flags.isServerFeatureEnabled).mockResolvedValue(true);
  vi.mocked(supabaseAdmin.from).mockReturnValue(chain({ data: SETTINGS, error: null }) as any);
  vi.mocked(wsfe.dummy).mockResolvedValue({ appServer: "OK", dbServer: "OK", authServer: "OK" });
  vi.mocked(wsaa.getAccessTicket).mockResolvedValue({ token: "t", sign: "s", expiresAt: "2026-11-04" });
  vi.mocked(wsaa.withAccessTicket).mockImplementation((config, _url, run) =>
    run({ token: "t", sign: "s", expiresAt: "2026-11-04", cuit: String(config.cuit ?? "").replace(/\D/g, "") })
  );
  vi.mocked(wsfe.pointsOfSale).mockResolvedValue([
    { number: 3, emissionType: "RECE para aplicativo y web services", blocked: false, deregistered: false },
  ]);
  vi.mocked(wsfe.lastAuthorized).mockResolvedValue(15);
  // Default: expires in 60 days
  vi.mocked(wsaa.certificateExpiry).mockReturnValue(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000));
});

describe("POST /api/arca/test", () => {
  it("prueba completa exitosa con punto de venta habilitado y certificado vigente > 30 días", async () => {
    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.steps).toEqual([
      { label: "Servidores de ARCA", ok: true, detail: "Funcionando" },
      { label: "Certificado y clave", ok: true, detail: "ARCA aceptó el certificado" },
      expect.objectContaining({ label: "Vencimiento del certificado", ok: true }),
      { label: "Punto de venta habilitado", ok: true, detail: "RECE para aplicativo y web services" },
      { label: "Punto de venta", ok: true, detail: "Último comprobante C autorizado: 15" },
    ]);
  });

  it("certificado por vencer (<= 30 días): ok: false con aviso, pero no corta la prueba", async () => {
    // Vence en 10 días
    const in10Days = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    vi.mocked(wsaa.certificateExpiry).mockReturnValue(in10Days);

    const res = await POST();
    const body = await res.json();
    expect(body.success).toBe(false);
    const certStep = body.steps.find((s: any) => s.label === "Vencimiento del certificado");
    expect(certStep.ok).toBe(false);
    expect(certStep.detail).toContain("renovalo pronto");
    // Verificamos que los siguientes pasos se ejecutaron
    expect(wsfe.pointsOfSale).toHaveBeenCalled();
    expect(wsfe.lastAuthorized).toHaveBeenCalled();
  });

  it("certificado vencido: ok: false con 'Venció el ...', pero no corta la prueba", async () => {
    const past = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    vi.mocked(wsaa.certificateExpiry).mockReturnValue(past);

    const res = await POST();
    const body = await res.json();
    expect(body.success).toBe(false);
    const certStep = body.steps.find((s: any) => s.label === "Vencimiento del certificado");
    expect(certStep.ok).toBe(false);
    expect(certStep.detail).toContain("Venció el");
    expect(wsfe.pointsOfSale).toHaveBeenCalled();
    expect(wsfe.lastAuthorized).toHaveBeenCalled();
  });

  it("pointsOfSale devuelve null (error 602): ok: true con detalle de homologación", async () => {
    vi.mocked(wsfe.pointsOfSale).mockResolvedValue(null);

    const res = await POST();
    const body = await res.json();
    expect(body.success).toBe(true);
    const posStep = body.steps.find((s: any) => s.label === "Punto de venta habilitado");
    expect(posStep).toEqual({
      label: "Punto de venta habilitado",
      ok: true,
      detail: "ARCA no informa puntos de venta (normal en homologación)",
    });
  });

  it("punto de venta no encontrado en la lista: ok: false y corta la prueba (no llama lastAuthorized)", async () => {
    vi.mocked(wsfe.pointsOfSale).mockResolvedValue([
      { number: 1, emissionType: "RECE", blocked: false, deregistered: false },
    ]);

    const res = await POST();
    const body = await res.json();
    expect(body.success).toBe(false);
    const posStep = body.steps.find((s: any) => s.label === "Punto de venta habilitado");
    expect(posStep.ok).toBe(false);
    expect(posStep.detail).toContain("El punto de venta 3 no está habilitado");
    expect(wsfe.lastAuthorized).not.toHaveBeenCalled();
  });

  it("punto de venta bloqueado: ok: false y corta la prueba", async () => {
    vi.mocked(wsfe.pointsOfSale).mockResolvedValue([
      { number: 3, emissionType: "RECE", blocked: true, deregistered: false },
    ]);

    const res = await POST();
    const body = await res.json();
    expect(body.success).toBe(false);
    const posStep = body.steps.find((s: any) => s.label === "Punto de venta habilitado");
    expect(posStep.ok).toBe(false);
    expect(posStep.detail).toBe("El punto de venta está bloqueado");
    expect(wsfe.lastAuthorized).not.toHaveBeenCalled();
  });

  it("punto de venta dado de baja: ok: false y corta la prueba", async () => {
    vi.mocked(wsfe.pointsOfSale).mockResolvedValue([
      { number: 3, emissionType: "RECE", blocked: false, deregistered: true },
    ]);

    const res = await POST();
    const body = await res.json();
    expect(body.success).toBe(false);
    const posStep = body.steps.find((s: any) => s.label === "Punto de venta habilitado");
    expect(posStep.ok).toBe(false);
    expect(posStep.detail).toBe("El punto de venta está dado de baja");
    expect(wsfe.lastAuthorized).not.toHaveBeenCalled();
  });
});
