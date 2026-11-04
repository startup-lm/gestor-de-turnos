/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/finance/cash-summary/route";
import * as auth from "@/lib/api/auth";
import * as planServer from "@/lib/flags/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { fetchAllRows } from "@/lib/supabase/fetchAllRows";

vi.mock("@/lib/api/auth", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/flags/server", () => ({
  getServerPlanContext: vi.fn(),
  PLAN_FORBIDDEN_MESSAGE: "Tu plan no incluye esta función",
}));
vi.mock("@/lib/supabase/supabaseAdmin", () => ({ supabaseAdmin: { from: vi.fn() } }));
vi.mock("@/lib/supabase/fetchAllRows", () => ({
  fetchAllRows: vi.fn(async () => ({ data: [], error: null })),
}));

function mockSettings(data: Record<string, unknown> = {}) {
  vi.mocked(supabaseAdmin.from).mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  } as any);
}

const get = (query = "?start_date=2026-11-03&end_date=2026-11-03") =>
  GET(new Request(`http://localhost:3000/api/finance/cash-summary${query}`));

describe("GET /api/finance/cash-summary", () => {
  beforeEach(() => {
    vi.mocked(supabaseAdmin.from).mockReset();
    vi.mocked(fetchAllRows).mockClear();
    vi.mocked(auth.requireAdmin).mockResolvedValue({ email: "admin@test.com" } as any);
    mockSettings();
  });

  it("sin admin → 401", async () => {
    vi.mocked(auth.requireAdmin).mockResolvedValue(null);

    const response = await get();

    expect(response.status).toBe(401);
  });

  it("admin, finances y cash_register apagados → 403", async () => {
    vi.mocked(planServer.getServerPlanContext).mockResolvedValue({
      plan: "basic",
      limits: { maxBarbers: 1, maxPaymentMethods: 0 },
      isEnabled: () => false,
    });

    const response = await get();

    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe("Tu plan no incluye esta función");
  });

  it("admin, solo cash_register → 200 con medios por defecto si custom_payment_methods está apagado", async () => {
    vi.mocked(planServer.getServerPlanContext).mockResolvedValue({
      plan: "standard",
      limits: { maxBarbers: 4, maxPaymentMethods: Infinity },
      isEnabled: (flag: string) => flag === "cash_register",
    });
    mockSettings({
      payment_methods: ["Transferencia"],
      plan: "standard",
      features: { custom_payment_methods: false },
    });

    const response = await get();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.rows).toEqual([
      { method: "Efectivo", income: 0, outcome: 0, net: 0 },
      { method: "Mercado Pago", income: 0, outcome: 0, net: 0 },
    ]);
  });

  it("admin, solo finances → 200", async () => {
    vi.mocked(planServer.getServerPlanContext).mockResolvedValue({
      plan: "premium",
      limits: { maxBarbers: Infinity, maxPaymentMethods: Infinity },
      isEnabled: (flag: string) => flag === "finances",
    });

    const response = await get();

    expect(response.status).toBe(200);
  });
});
