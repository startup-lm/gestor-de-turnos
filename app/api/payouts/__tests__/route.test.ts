/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/payouts/route";
import * as auth from "@/lib/api/auth";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import * as planServer from "@/lib/flags/server";
import * as payoutData from "@/lib/finance/payoutData";

vi.mock("@/lib/finance/openShift", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/finance/openShift")>()),
  currentShiftId: vi.fn().mockResolvedValue({ shiftId: null, error: null }),
  closedShiftLock: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/api/auth", () => ({
  requireAdmin: vi.fn(),
}));

// El plan se testea en lib/flags/__tests__/server.test.ts: acá se asume habilitado
vi.mock("@/lib/flags/server", () => ({
  requirePlanFeature: vi.fn(async () => null),
}));

// Las consultas de turnos/ventas/adelantos se mockean: acá se prueba el registro
vi.mock("@/lib/finance/payoutData", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/finance/payoutData")>()),
  loadPayoutData: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

vi.mock("@/lib/supabase/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe("API /api/payouts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/payouts", () => {
    it("debe rechazar con 401 si no es admin", async () => {
      vi.mocked(auth.requireAdmin).mockResolvedValueOnce(null);

      const response = await GET(new Request("http://localhost:3000/api/payouts"));
      expect(response.status).toBe(401);
    });

    it("debe retornar el listado de liquidaciones para el admin", async () => {
      vi.mocked(auth.requireAdmin).mockResolvedValueOnce({ email: "admin@test.com" } as any);

      const mockPayouts = [
        { id: 10, barber_id: 2, total_paid: 45000, barbers: { name: "Martín" } },
      ];

      const queryMock = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: mockPayouts, error: null })),
      };

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(queryMock as any);

      const response = await GET(new Request("http://localhost:3000/api/payouts?barber_id=2"));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual(mockPayouts);
      expect(queryMock.eq).toHaveBeenCalledWith("barber_id", 2);
    });
  });

  describe("POST /api/payouts", () => {
    it("debe rechazar con 403 si el plan no incluye liquidación de comisiones", async () => {
      vi.mocked(auth.requireAdmin).mockResolvedValueOnce({ email: "admin@test.com" } as any);
      vi.mocked(planServer.requirePlanFeature).mockResolvedValueOnce(
        Response.json({ error: "Tu plan no incluye esta función" }, { status: 403 }) as any
      );

      const response = await POST(
        new Request("http://localhost:3000/api/payouts", { method: "POST", body: "{}" })
      );

      expect(response.status).toBe(403);
      expect(planServer.requirePlanFeature).toHaveBeenCalledWith("commission_payouts");
      expect(supabaseAdmin.from).not.toHaveBeenCalled();
    });

    it("debe rechazar si faltan campos obligatorios", async () => {
      vi.mocked(auth.requireAdmin).mockResolvedValueOnce({ email: "admin@test.com" } as any);

      const response = await POST(
        new Request("http://localhost:3000/api/payouts", {
          method: "POST",
          body: JSON.stringify({ barber_id: 2 }), // Faltan period_start, period_end, total_paid
        })
      );

      expect(response.status).toBe(400);
    });

    const baseData = {
      barber: { id: 2, name: "Martín", commission: 0.5, sale_commission: 0.1, active: true },
      // Comisiones ya calculadas con el % congelado de cada turno o venta
      cuts: { count: 2, revenue: 100000, commission: 50000, lateCount: 1, ids: [11, 12] },
      sales: { count: 1, revenue: 30000, commission: 3000, lateCount: 0, ids: [21] },
      advances: [{ id: 5, amount: 10000, type: "advance" }],
    };

    const post = (body: unknown) =>
      POST(new Request("http://localhost:3000/api/payouts", { method: "POST", body: JSON.stringify(body) }));

    it("calcula los montos en el servidor e ignora los del navegador llamando a register_commission_payout", async () => {
      vi.mocked(auth.requireAdmin).mockResolvedValueOnce({ email: "admin@test.com" } as any);
      vi.mocked(payoutData.loadPayoutData).mockResolvedValueOnce({ data: baseData as any, error: null });
      vi.mocked(supabaseAdmin.rpc).mockResolvedValueOnce({ data: { id: 77 }, error: null } as any);

      const response = await post({
        barber_id: 2,
        period_start: "2026-10-01",
        period_end: "2026-10-15",
        advance_ids: [5],
        payment_method: "Mercado Pago",
        reference_code: "REF-123",
        receipt_notes: "Notas",
        total_paid: 1,
        cuts_commission_amount: 1,
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ success: true, id: 77 });
      expect(supabaseAdmin.rpc).toHaveBeenCalledWith("register_commission_payout", {
        p_payout: {
          barber_id: 2,
          period_start: "2026-10-01",
          period_end: "2026-10-15",
          cuts_count: 2,
          cuts_commission_amount: 50000,
          sales_count: 1,
          sales_commission_amount: 3000,
          advances_deducted: 10000,
          total_paid: 43000,
          payment_method: "Mercado Pago",
          payment_date: expect.any(String),
          reference_code: "REF-123",
          receipt_notes: "Notas",
          paid_by: "admin@test.com",
        },
        p_appointment_ids: [11, 12],
        p_sale_ids: [21],
        p_advance_ids: [5],
        p_movement: {
          amount: 43000,
          payment_method: "Mercado Pago",
          description: "Liquidación de comisiones período 2026-10-01 al 2026-10-15",
          shift_id: null,
          created_by: "admin@test.com",
        },
      });
    });

    it("si el total a pagar es 0, p_movement es null", async () => {
      vi.mocked(auth.requireAdmin).mockResolvedValueOnce({ email: "admin@test.com" } as any);
      const zeroData = {
        ...baseData,
        cuts: { count: 0, revenue: 0, commission: 0, lateCount: 0, ids: [] },
        sales: { count: 0, revenue: 0, commission: 0, lateCount: 0, ids: [] },
        advances: [],
      };
      vi.mocked(payoutData.loadPayoutData).mockResolvedValueOnce({ data: zeroData as any, error: null });
      vi.mocked(supabaseAdmin.rpc).mockResolvedValueOnce({ data: { id: 78 }, error: null } as any);

      const response = await post({
        barber_id: 2,
        period_start: "2026-10-01",
        period_end: "2026-10-15",
        advance_ids: [],
        payment_method: "Efectivo",
      });

      expect(response.status).toBe(200);
      expect(supabaseAdmin.rpc).toHaveBeenCalledWith(
        "register_commission_payout",
        expect.objectContaining({
          p_movement: null,
          p_payout: expect.objectContaining({ total_paid: 0 }),
        })
      );
    });

    it("si otra liquidación tomó algún ítem en paralelo (conflicto P0409), responde 409", async () => {
      vi.mocked(auth.requireAdmin).mockResolvedValueOnce({ email: "admin@test.com" } as any);
      vi.mocked(payoutData.loadPayoutData).mockResolvedValueOnce({ data: baseData as any, error: null });
      vi.mocked(supabaseAdmin.rpc).mockResolvedValueOnce({
        data: null,
        error: { code: "P0409", message: "PAYOUT_CONFLICT" },
      } as any);

      const response = await post({
        barber_id: 2,
        period_start: "2026-10-01",
        period_end: "2026-10-15",
        advance_ids: [5],
        payment_method: "Efectivo",
      });

      expect(response.status).toBe(409);
      expect((await response.json()).error).toBe(
        "Algún turno, venta o adelanto ya fue liquidado. Actualizá y probá de nuevo"
      );
    });

    it("si falla la base de datos en el rpc, responde 500", async () => {
      vi.mocked(auth.requireAdmin).mockResolvedValueOnce({ email: "admin@test.com" } as any);
      vi.mocked(payoutData.loadPayoutData).mockResolvedValueOnce({ data: baseData as any, error: null });
      vi.mocked(supabaseAdmin.rpc).mockResolvedValueOnce({
        data: null,
        error: { code: "50000", message: "db error" },
      } as any);

      const response = await post({
        barber_id: 2,
        period_start: "2026-10-01",
        period_end: "2026-10-15",
        advance_ids: [5],
        payment_method: "Efectivo",
      });

      expect(response.status).toBe(500);
    });

    it("rechaza un período que termina después de hoy", async () => {
      vi.mocked(auth.requireAdmin).mockResolvedValueOnce({ email: "admin@test.com" } as any);

      const response = await post({ barber_id: 2, period_start: "2099-01-01", period_end: "2099-01-31", payment_method: "Efectivo" });
      expect(response.status).toBe(400);
      expect((await response.json()).error).toMatch(/después de hoy/);
      expect(payoutData.loadPayoutData).not.toHaveBeenCalled();
    });

    it("rechaza un adelanto que ya fue descontado o es de otro profesional", async () => {
      vi.mocked(auth.requireAdmin).mockResolvedValueOnce({ email: "admin@test.com" } as any);
      vi.mocked(payoutData.loadPayoutData).mockResolvedValueOnce({ data: baseData as any, error: null });

      const response = await post({
        barber_id: 2, period_start: "2026-10-01", period_end: "2026-10-15", advance_ids: [5, 99], payment_method: "Efectivo",
      });
      expect(response.status).toBe(409);
    });

    it("exige medio de pago y un período válido", async () => {
      vi.mocked(auth.requireAdmin).mockResolvedValue({ email: "admin@test.com" } as any);
      expect((await post({ barber_id: 2, period_start: "2026-10-01", period_end: "2026-10-15" })).status).toBe(400);
      expect((await post({ barber_id: 2, period_start: "2026-10-15", period_end: "2026-10-01", payment_method: "Efectivo" })).status).toBe(400);
      expect(payoutData.loadPayoutData).not.toHaveBeenCalled();
    });
  });
});
