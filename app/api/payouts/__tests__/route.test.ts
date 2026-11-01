/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/payouts/route";
import * as auth from "@/lib/api/auth";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import * as planServer from "@/lib/flags/server";

vi.mock("@/lib/api/auth", () => ({
  requireAdmin: vi.fn(),
}));

// El plan se testea en lib/flags/__tests__/server.test.ts: acá se asume habilitado
vi.mock("@/lib/flags/server", () => ({
  requirePlanFeature: vi.fn(async () => null),
}));

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

    it("debe insertar liquidación y egreso en caja si se abonó en efectivo", async () => {
      vi.mocked(auth.requireAdmin).mockResolvedValueOnce({ email: "admin@test.com" } as any);

      const payoutInsertMock = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { id: 77 },
          error: null,
        }),
      };

      const cashInsertMock = {
        insert: vi.fn().mockResolvedValueOnce({ data: { id: 101 }, error: null }),
      };

      vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
        if (table === "commission_payouts") return payoutInsertMock as any;
        if (table === "cash_movements") return cashInsertMock as any;
        return {} as any;
      });

      const response = await POST(
        new Request("http://localhost:3000/api/payouts", {
          method: "POST",
          body: JSON.stringify({
            barber_id: 2,
            period_start: "2026-10-01",
            period_end: "2026-10-15",
            total_paid: 50000,
            payment_method: "Efectivo",
            cuts_count: 20,
            cuts_commission_amount: 45000,
            sales_count: 2,
            sales_commission_amount: 5000,
          }),
        })
      );

      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.id).toBe(77);

      // Verificación de regla de negocio cruzada: egreso automático en caja
      expect(cashInsertMock.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          barber_id: 2,
          type: "commission_payout",
          category: "comision",
          amount: 50000,
          payment_method: "Efectivo",
          reference_code: "REC-77",
        })
      );
    });
  });
});
