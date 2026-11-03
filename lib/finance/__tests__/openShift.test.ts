/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as flags from "@/lib/flags/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { currentShiftId, closedShiftLock } from "@/lib/finance/openShift";

vi.mock("@/lib/supabase/supabaseAdmin", () => ({
  supabaseAdmin: { from: vi.fn() },
}));

vi.mock("@/lib/flags/server", () => ({
  isServerFeatureEnabled: vi.fn(),
}));

/** cash_shifts: cada lectura devuelve el próximo de `reads`; el insert devuelve `insert` */
function mockShifts(reads: unknown[], insert: { data: unknown; error: unknown } = { data: { id: 9 }, error: null }) {
  const inserted: unknown[] = [];
  let readIndex = 0;
  vi.mocked(supabaseAdmin.from).mockImplementation((() => {
    const q: Record<string, any> = {};
    for (const m of ["select", "eq"]) q[m] = vi.fn(() => q);
    q.maybeSingle = vi.fn(() => Promise.resolve({ data: reads[readIndex++] ?? null, error: null }));
    q.insert = vi.fn((values: unknown) => {
      inserted.push(values);
      const w: Record<string, any> = {};
      w.select = vi.fn(() => w);
      w.single = vi.fn(() => Promise.resolve(insert));
      return w;
    });
    return q;
  }) as any);
  return { inserted };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(flags.isServerFeatureEnabled).mockResolvedValue(true);
});

describe("currentShiftId", () => {
  it("con la caja apagada en el plan no toca la base", async () => {
    vi.mocked(flags.isServerFeatureEnabled).mockResolvedValue(false);
    expect(await currentShiftId("a@b.com")).toEqual({ shiftId: null, error: null });
    expect(supabaseAdmin.from).not.toHaveBeenCalled();
  });

  it("usa el período en curso si ya hay uno", async () => {
    const { inserted } = mockShifts([{ id: 4, status: "open" }]);
    expect(await currentShiftId("a@b.com")).toEqual({ shiftId: 4, error: null });
    expect(inserted).toEqual([]);
  });

  it("sin período en curso, el primer cobro lo crea (no hay que abrir la caja)", async () => {
    const { inserted } = mockShifts([null]);
    expect(await currentShiftId("a@b.com")).toEqual({ shiftId: 9, error: null });
    expect(inserted).toEqual([{ opened_by: "a@b.com", initial_cash: 0, status: "open" }]);
  });

  it("si otro cobro lo creó al mismo tiempo, usa ese", async () => {
    mockShifts([null, { id: 7, status: "open" }], { data: null, error: { code: "23505" } });
    expect(await currentShiftId("a@b.com")).toEqual({ shiftId: 7, error: null });
  });
});

describe("closedShiftLock", () => {
  it("bloquea lo que es de un cierre ya hecho", async () => {
    mockShifts([{ status: "closed" }]);
    const response = await closedShiftLock(3);
    expect(response?.status).toBe(409);
  });

  it("deja modificar lo del período en curso o lo que no tiene caja", async () => {
    mockShifts([{ status: "open" }]);
    expect(await closedShiftLock(3)).toBeNull();
    expect(await closedShiftLock(null)).toBeNull();
  });
});
