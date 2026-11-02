/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/cash/movements/route";
import * as auth from "@/lib/api/auth";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import * as planServer from "@/lib/flags/server";

// Mock del módulo de autenticación
vi.mock("@/lib/api/auth", () => ({
  requireAdmin: vi.fn(),
}));

// El plan se testea en lib/flags/__tests__/server.test.ts: acá se asume habilitado
vi.mock("@/lib/flags/server", () => ({
  requirePlanFeature: vi.fn(async () => null),
}));

// Mock del cliente supabaseAdmin
vi.mock("@/lib/supabase/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

describe("API /api/cash/movements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/cash/movements", () => {
    it("debe rechazar con 401 si el usuario no es admin", async () => {
      vi.mocked(auth.requireAdmin).mockResolvedValueOnce(null);

      const request = new Request("http://localhost:3000/api/cash/movements");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toMatch(/no autorizado/i);
    });

    it("debe retornar los movimientos de caja si el usuario es admin", async () => {
      vi.mocked(auth.requireAdmin).mockResolvedValueOnce({ email: "admin@test.com" } as any);

      const mockData = [
        {
          id: 1,
          type: "expense",
          category: "insumos",
          amount: 5000,
          barbers: { name: "Lucas" },
        },
      ];

      const queryMock = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: mockData, error: null })),
      };

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(queryMock as any);

      const request = new Request("http://localhost:3000/api/cash/movements?type=expense");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual(mockData);
      expect(queryMock.eq).toHaveBeenCalledWith("type", "expense");
    });
  });

  describe("POST /api/cash/movements", () => {
    const post = (body: Record<string, unknown>) =>
      POST(new Request("http://localhost:3000/api/cash/movements", { method: "POST", body: JSON.stringify(body) }));
    const forbidden = () =>
      Response.json({ error: "Tu plan no incluye esta función" }, { status: 403 }) as any;

    it("un gasto requiere el registro de gastos del plan", async () => {
      vi.mocked(auth.requireAdmin).mockResolvedValueOnce({ email: "admin@test.com" } as any);
      vi.mocked(planServer.requirePlanFeature).mockResolvedValueOnce(forbidden());

      const response = await post({ type: "expense", amount: 100, description: "Insumos" });

      expect(response.status).toBe(403);
      expect(planServer.requirePlanFeature).toHaveBeenCalledWith("expenses");
      expect(supabaseAdmin.from).not.toHaveBeenCalled();
    });

    it("un adelanto requiere la liquidación de comisiones del plan", async () => {
      vi.mocked(auth.requireAdmin).mockResolvedValueOnce({ email: "admin@test.com" } as any);
      vi.mocked(planServer.requirePlanFeature).mockResolvedValueOnce(forbidden());

      const response = await post({ type: "advance", amount: 100, description: "Adelanto", barber_id: 2 });

      expect(response.status).toBe(403);
      expect(planServer.requirePlanFeature).toHaveBeenCalledWith("commission_payouts");
    });

    it("debe rechazar con 401 si no es admin", async () => {
      vi.mocked(auth.requireAdmin).mockResolvedValueOnce(null);

      const request = new Request("http://localhost:3000/api/cash/movements", {
        method: "POST",
        body: JSON.stringify({ amount: 1000 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it("debe registrar un movimiento correctamente si es admin", async () => {
      vi.mocked(auth.requireAdmin).mockResolvedValueOnce({ email: "admin@test.com" } as any);

      const insertMock = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { id: 99, amount: 2500 },
          error: null,
        }),
      };

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(insertMock as any);

      const request = new Request("http://localhost:3000/api/cash/movements", {
        method: "POST",
        body: JSON.stringify({
          type: "expense",
          category: "limpieza",
          amount: 2500,
          description: "Artículos de limpieza",
        }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.id).toBe(99);
      expect(insertMock.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "expense",
          amount: 2500,
          created_by: "admin@test.com",
        })
      );
    });
  });
});
