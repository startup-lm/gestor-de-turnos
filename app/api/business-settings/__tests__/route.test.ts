/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PUT } from "@/app/api/business-settings/route";
import * as auth from "@/lib/api/auth";
import * as planServer from "@/lib/flags/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { getPlanLimits, isFeatureEnabled, PlanName } from "@/lib/flags";

vi.mock("@/lib/api/auth", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/flags/server", () => ({ getServerPlanContext: vi.fn() }));
vi.mock("@/lib/supabase/supabaseAdmin", () => ({ supabaseAdmin: { from: vi.fn() } }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

function withPlan(plan: PlanName, features: Record<string, boolean> | null = null) {
  vi.mocked(planServer.getServerPlanContext).mockResolvedValue({
    plan,
    limits: getPlanLimits(plan),
    isEnabled: (flag: string) => isFeatureEnabled(flag, features, plan),
  });
}

/** Mockea el upsert y devuelve el spy para ver qué se guardó. */
function mockUpsert() {
  const upsert = vi.fn().mockReturnThis();
  vi.mocked(supabaseAdmin.from).mockReturnValue({
    upsert,
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: 1, plan: "premium" }, error: null }),
  } as any);
  return upsert;
}

const put = (body: Record<string, unknown>) =>
  PUT(new Request("http://localhost:3000/api/business-settings", { method: "PUT", body: JSON.stringify(body) }));

describe("PUT /api/business-settings con límites del plan", () => {
  beforeEach(() => {
    vi.mocked(supabaseAdmin.from).mockReset();
    vi.mocked(auth.requireAdmin).mockResolvedValue({ email: "admin@test.com" } as any);
  });

  it("standard rechaza más de 3 medios de cobro", async () => {
    withPlan("standard", { custom_payment_methods: true });
    const upsert = mockUpsert();

    const response = await put({ payment_methods: ["A", "B", "C", "D"] });

    expect(response.status).toBe(403);
    expect((await response.json()).error).toMatch(/hasta 3 medios de cobro/);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("standard guarda hasta 3 medios de cobro", async () => {
    withPlan("standard", { custom_payment_methods: true });
    const upsert = mockUpsert();

    const response = await put({ payment_methods: ["A", "B", "C"] });

    expect(response.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith({ id: 1, payment_methods: ["A", "B", "C"] });
  });

  it("premium sin override no guarda payment_methods", async () => {
    withPlan("premium");
    const upsert = mockUpsert();

    const response = await put({ payment_methods: ["A"] });

    expect(response.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith({ id: 1 });
  });

  it("basic no guarda medios de cobro ni criterio de asignación", async () => {
    withPlan("basic");
    const upsert = mockUpsert();

    await put({ business_name: "Mi local", payment_methods: ["A"], assignment_criteria: "balanced" });

    expect(upsert).toHaveBeenCalledWith({ id: 1, business_name: "Mi local" });
  });

  it("standard guarda el criterio de asignación", async () => {
    withPlan("standard");
    const upsert = mockUpsert();

    await put({ assignment_criteria: "balanced" });

    expect(upsert).toHaveBeenCalledWith({ id: 1, assignment_criteria: "balanced" });
  });
});
