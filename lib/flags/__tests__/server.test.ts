/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { getServerPlanContext, requirePlanFeature, checkBarberLimit } from "@/lib/flags/server";

vi.mock("@/lib/supabase/supabaseAdmin", () => ({
  supabaseAdmin: { from: vi.fn() },
}));

/** Simula business_settings con el plan dado y la tabla barbers con `barberCount` filas. */
function mockDb(settings: { plan?: string; features?: Record<string, boolean> } | null, barberCount = 0) {
  vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
    if (table === "business_settings") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: settings, error: null }),
      } as any;
    }
    return {
      select: vi.fn().mockResolvedValue({ count: barberCount, error: null }),
    } as any;
  });
}

describe("lib/flags/server", () => {
  beforeEach(() => {
    vi.mocked(supabaseAdmin.from).mockReset();
  });

  it("lee el plan del cliente y expone flags y límites", async () => {
    mockDb({ plan: "standard", features: {} });
    const ctx = await getServerPlanContext();
    expect(ctx.plan).toBe("standard");
    expect(ctx.limits.maxBarbers).toBe(4);
    expect(ctx.isEnabled("sales")).toBe(true);
    expect(ctx.isEnabled("finances")).toBe(false);
  });

  it("si la lectura falla, asume basic: nunca habilita de más", async () => {
    vi.mocked(supabaseAdmin.from).mockImplementation(() => {
      throw new Error("db caída");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const ctx = await getServerPlanContext();
    expect(ctx.plan).toBe("basic");
    expect(ctx.isEnabled("sales")).toBe(false);
  });

  it("requirePlanFeature devuelve 403 si el plan no incluye la feature", async () => {
    mockDb({ plan: "standard" });
    const res = await requirePlanFeature("expenses");
    expect(res?.status).toBe(403);
  });

  it("requirePlanFeature devuelve null si el plan la incluye", async () => {
    mockDb({ plan: "premium" });
    expect(await requirePlanFeature("expenses")).toBeNull();
  });

  describe("checkBarberLimit", () => {
    it("basic no permite dar de alta profesionales", async () => {
      mockDb({ plan: "basic" }, 1);
      const res = await checkBarberLimit();
      expect(res?.status).toBe(403);
    });

    it("standard permite hasta 4 profesionales", async () => {
      mockDb({ plan: "standard" }, 3);
      expect(await checkBarberLimit()).toBeNull();

      mockDb({ plan: "standard" }, 4);
      const res = await checkBarberLimit();
      expect(res?.status).toBe(403);
      expect((await res!.json()).error).toMatch(/límite de profesionales/);
    });

    it("premium no tiene límite y no cuenta filas", async () => {
      mockDb({ plan: "premium" }, 100);
      expect(await checkBarberLimit()).toBeNull();
      expect(supabaseAdmin.from).not.toHaveBeenCalledWith("barbers");
    });
  });
});
