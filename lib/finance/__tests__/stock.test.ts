/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { adjustProductStock, insufficientStockMessage } from "@/lib/finance/stock";

vi.mock("@/lib/supabase/supabaseAdmin", () => ({
  supabaseAdmin: { from: vi.fn() },
}));

/**
 * Simula la tabla products: cada lectura devuelve el próximo stock de `reads`
 * y cada escritura devuelve las filas de `writes` (vacío = otra venta ganó la carrera).
 */
function mockProducts(reads: (number | null)[], writes: unknown[][] = []) {
  const updates: unknown[] = [];
  let readIndex = 0;
  let writeIndex = 0;
  vi.mocked(supabaseAdmin.from).mockImplementation((() => {
    const q: Record<string, any> = {};
    for (const m of ["select", "eq"]) q[m] = vi.fn(() => q);
    q.maybeSingle = vi.fn(() => {
      const stock = reads[readIndex++];
      return Promise.resolve({ data: stock === null ? null : { stock }, error: null });
    });
    q.update = vi.fn((values: unknown) => {
      updates.push(values);
      const w: Record<string, any> = {};
      w.eq = vi.fn(() => w);
      w.select = vi.fn(() => Promise.resolve({ data: writes[writeIndex++] ?? [{ id: 3 }], error: null }));
      return w;
    });
    return q;
  }) as any);
  return { updates };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("adjustProductStock", () => {
  it("descuenta unidades si alcanza", async () => {
    const { updates } = mockProducts([5]);
    expect(await adjustProductStock(3, -2)).toEqual({ ok: true, stock: 3 });
    expect(updates).toEqual([{ stock: 3 }]);
  });

  it("no vende más de lo que hay ni deja stock negativo", async () => {
    const { updates } = mockProducts([1]);
    expect(await adjustProductStock(3, -2)).toEqual({ ok: false, reason: "insufficient", stock: 1 });
    expect(updates).toEqual([]);
  });

  it("si otra venta cambió el stock en el medio, vuelve a leer y reintenta", async () => {
    const { updates } = mockProducts([5, 4], [[], [{ id: 3 }]]);
    expect(await adjustProductStock(3, -1)).toEqual({ ok: true, stock: 3 });
    expect(updates).toEqual([{ stock: 4 }, { stock: 3 }]);
  });

  it("después de varios choques se rinde sin escribir de más", async () => {
    mockProducts([5, 5, 5], [[], [], []]);
    expect(await adjustProductStock(3, -1)).toEqual({ ok: false, reason: "conflict" });
  });

  it("devuelve unidades al stock", async () => {
    const { updates } = mockProducts([0]);
    expect(await adjustProductStock(3, 2)).toEqual({ ok: true, stock: 2 });
    expect(updates).toEqual([{ stock: 2 }]);
  });

  it("avisa si el producto no existe", async () => {
    mockProducts([null]);
    expect(await adjustProductStock(3, -1)).toEqual({ ok: false, reason: "not_found" });
  });
});

describe("insufficientStockMessage", () => {
  it("distingue sin stock de stock insuficiente", () => {
    expect(insufficientStockMessage(0)).toBe("Este producto no tiene stock");
    expect(insufficientStockMessage(2)).toMatch(/quedan 2/);
  });
});
