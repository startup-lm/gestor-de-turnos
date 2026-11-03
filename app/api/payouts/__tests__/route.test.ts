/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/payouts/route";
import * as auth from "@/lib/api/auth";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import * as planServer from "@/lib/flags/server";
import * as payoutData from "@/lib/finance/payoutData";

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

    /** Consulta encadenable: cada método devuelve la misma consulta y al final resuelve `result`. */
    function chain(result: unknown) {
      const q: Record<string, any> = {};
      for (const m of ["select", "eq", "is", "in", "insert", "update", "delete"]) q[m] = vi.fn(() => q);
      q.single = vi.fn(() => Promise.resolve(result));
      q.then = (resolve: (v: unknown) => unknown) => resolve(result);
      return q;
    }

    const post = (body: unknown) =>
      POST(new Request("http://localhost:3000/api/payouts", { method: "POST", body: JSON.stringify(body) }));

    const rows = (n: number) => ({ data: Array.from({ length: n }, (_, i) => ({ id: i })), error: null });

    function mockTables(markedCount = 1, linkedAppointments = 2) {
      const payouts = chain({ data: { id: 77 }, error: null });
      const movements = chain(rows(markedCount));
      const appointments = chain(rows(linkedAppointments));
      const sales = chain(rows(1));
      const tables: Record<string, unknown> = { commission_payouts: payouts, appointments, sales };
      vi.mocked(supabaseAdmin.from).mockImplementation(((table: string) => tables[table] ?? movements) as any);
      return { payouts, movements, appointments, sales };
    }

    it("calcula los montos en el servidor e ignora los del navegador", async () => {
      vi.mocked(auth.requireAdmin).mockResolvedValueOnce({ email: "admin@test.com" } as any);
      vi.mocked(payoutData.loadPayoutData).mockResolvedValueOnce({ data: baseData as any, error: null });
      const { payouts, movements } = mockTables();

      const response = await post({
        barber_id: 2, period_start: "2026-10-01", period_end: "2026-10-15",
        advance_ids: [5], payment_method: "Mercado Pago", total_paid: 1, cuts_commission_amount: 1,
      });

      expect(response.status).toBe(200);
      // 50000 + 3000 de comisiones − 10000 de adelanto
      expect(payouts.insert).toHaveBeenCalledWith(expect.objectContaining({
        cuts_commission_amount: 50000, sales_commission_amount: 3000, advances_deducted: 10000, total_paid: 43000,
      }));
      // El egreso de caja se registra con cualquier medio, no solo efectivo
      expect(movements.insert).toHaveBeenCalledWith(expect.objectContaining({
        type: "commission_payout", amount: 43000, payment_method: "Mercado Pago", payout_id: 77, reference_code: "REC-77",
      }));
      expect(movements.update).toHaveBeenCalledWith({ payout_id: 77 });
    });

    it("ata los turnos y las ventas a la liquidación, incluidos los cobros atrasados", async () => {
      vi.mocked(auth.requireAdmin).mockResolvedValueOnce({ email: "admin@test.com" } as any);
      vi.mocked(payoutData.loadPayoutData).mockResolvedValueOnce({ data: baseData as any, error: null });
      const { appointments, sales } = mockTables();

      const response = await post({ barber_id: 2, period_start: "2026-10-01", period_end: "2026-10-15", payment_method: "Efectivo" });
      expect(response.status).toBe(200);
      expect(appointments.update).toHaveBeenCalledWith({ payout_id: 77 });
      expect(appointments.in).toHaveBeenCalledWith("id", [11, 12]);
      expect(sales.in).toHaveBeenCalledWith("id", [21]);
    });

    it("si otra liquidación tomó un turno en paralelo, deshace todo", async () => {
      vi.mocked(auth.requireAdmin).mockResolvedValueOnce({ email: "admin@test.com" } as any);
      vi.mocked(payoutData.loadPayoutData).mockResolvedValueOnce({ data: baseData as any, error: null });
      const { payouts, appointments } = mockTables(1, 1);

      const response = await post({ barber_id: 2, period_start: "2026-10-01", period_end: "2026-10-15", payment_method: "Efectivo" });
      expect(response.status).toBe(500);
      expect(appointments.update).toHaveBeenCalledWith({ payout_id: null });
      expect(payouts.delete).toHaveBeenCalled();
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
      mockTables();

      const response = await post({
        barber_id: 2, period_start: "2026-10-01", period_end: "2026-10-15", advance_ids: [5, 99], payment_method: "Efectivo",
      });
      expect(response.status).toBe(409);
    });

    it("si no puede marcar los adelantos, deshace la liquidación", async () => {
      vi.mocked(auth.requireAdmin).mockResolvedValueOnce({ email: "admin@test.com" } as any);
      vi.mocked(payoutData.loadPayoutData).mockResolvedValueOnce({ data: baseData as any, error: null });
      const { payouts } = mockTables(0);

      const response = await post({
        barber_id: 2, period_start: "2026-10-01", period_end: "2026-10-15", advance_ids: [5], payment_method: "Efectivo",
      });
      expect(response.status).toBe(500);
      expect(payouts.delete).toHaveBeenCalled();
    });

    it("exige medio de pago y un período válido", async () => {
      vi.mocked(auth.requireAdmin).mockResolvedValue({ email: "admin@test.com" } as any);
      expect((await post({ barber_id: 2, period_start: "2026-10-01", period_end: "2026-10-15" })).status).toBe(400);
      expect((await post({ barber_id: 2, period_start: "2026-10-15", period_end: "2026-10-01", payment_method: "Efectivo" })).status).toBe(400);
      expect(payoutData.loadPayoutData).not.toHaveBeenCalled();
    });
  });
});
