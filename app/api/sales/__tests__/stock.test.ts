/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as auth from "@/lib/api/auth";
import * as flags from "@/lib/flags/server";
import * as stock from "@/lib/finance/stock";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { POST as createSale } from "@/app/api/sales/route";
import { PATCH as patchSale, DELETE as deleteSale } from "@/app/api/sales/[id]/route";

vi.mock("@/lib/api/auth", () => ({
  requireAdmin: vi.fn(),
  requireBarberOrAdmin: vi.fn(),
}));

vi.mock("@/lib/supabase/supabaseAdmin", () => ({
  supabaseAdmin: { from: vi.fn() },
}));

vi.mock("@/lib/flags/server", () => ({
  requirePlanFeature: vi.fn().mockResolvedValue(null),
  isServerFeatureEnabled: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/finance/stock", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/finance/stock")>()),
  adjustProductStock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const ADMIN = { user: {}, barber: { id: 1, role: "admin" } } as any;
const SALE = { barber_id: 1, product_id: 3, price: 1000, quantity: 2, payment_method: "Efectivo" };
const STORED = { id: 5, barber_id: 1, product_id: 3, price: 1000, quantity: 2, arca_invoice_id: null, payout_id: null };

/** Consulta encadenable de Supabase que resuelve `result` */
function chain(result: { data: unknown; error: unknown } = { data: null, error: null }) {
  const q: Record<string, any> = {};
  for (const m of ["select", "eq", "insert", "update", "delete"]) q[m] = vi.fn(() => q);
  q.maybeSingle = vi.fn(() => Promise.resolve(result));
  q.single = vi.fn(() => Promise.resolve(result));
  q.then = (resolve: (v: unknown) => unknown) => resolve(result);
  return q;
}

/** barbers responde el % de comisión; sales responde `sales` */
function mockTables(sales: ReturnType<typeof chain>) {
  const barbers = chain({ data: { commission: 0.5, sale_commission: 0.3 }, error: null });
  vi.mocked(supabaseAdmin.from).mockImplementation(((table: string) => (table === "barbers" ? barbers : sales)) as any);
}

const json = (body: unknown, method = "POST") =>
  new Request("http://localhost:3000/api/x", { method, body: JSON.stringify(body) });
const params = (id: number) => ({ params: Promise.resolve({ id: String(id) }) });
const adjust = vi.mocked(stock.adjustProductStock);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth.requireBarberOrAdmin).mockResolvedValue(ADMIN);
  vi.mocked(flags.isServerFeatureEnabled).mockResolvedValue(true);
  adjust.mockResolvedValue({ ok: true, stock: 10 });
});

describe("Ventas: control de stock", () => {
  it("al vender, descuenta las unidades del producto", async () => {
    const sales = chain({ data: { id: 10 }, error: null });
    mockTables(sales);

    const response = await createSale(json(SALE));
    expect(response.status).toBe(200);
    expect(adjust).toHaveBeenCalledWith(3, -2);
    expect(sales.insert).toHaveBeenCalled();
  });

  it("sin stock suficiente no registra la venta", async () => {
    const sales = chain({ data: { id: 10 }, error: null });
    mockTables(sales);
    adjust.mockResolvedValueOnce({ ok: false, reason: "insufficient", stock: 1 });

    const response = await createSale(json(SALE));
    expect(response.status).toBe(409);
    expect((await response.json()).error).toMatch(/quedan 1/);
    expect(sales.insert).not.toHaveBeenCalled();
  });

  it("si la venta no se guarda, devuelve las unidades", async () => {
    mockTables(chain({ data: null, error: { message: "db" } }));

    const response = await createSale(json(SALE));
    expect(response.status).toBe(500);
    expect(adjust).toHaveBeenNthCalledWith(1, 3, -2);
    expect(adjust).toHaveBeenNthCalledWith(2, 3, 2);
  });

  it("con el flag apagado, vende sin tocar el stock", async () => {
    vi.mocked(flags.isServerFeatureEnabled).mockResolvedValue(false);
    mockTables(chain({ data: { id: 10 }, error: null }));

    const response = await createSale(json(SALE));
    expect(response.status).toBe(200);
    expect(adjust).not.toHaveBeenCalled();
  });

  it("al subir la cantidad, descuenta solo la diferencia", async () => {
    mockTables(chain({ data: STORED, error: null }));

    const response = await patchSale(json({ quantity: 5 }, "PATCH"), params(5));
    expect(response.status).toBe(200);
    expect(adjust).toHaveBeenCalledTimes(1);
    expect(adjust).toHaveBeenCalledWith(3, -3);
  });

  it("al cambiar de producto, toma el nuevo y devuelve el anterior", async () => {
    mockTables(chain({ data: STORED, error: null }));

    const response = await patchSale(json({ product_id: 4, quantity: 1 }, "PATCH"), params(5));
    expect(response.status).toBe(200);
    expect(adjust).toHaveBeenNthCalledWith(1, 4, -1);
    expect(adjust).toHaveBeenNthCalledWith(2, 3, 2);
  });

  it("si el producto nuevo no tiene stock, no cambia nada", async () => {
    const sales = chain({ data: STORED, error: null });
    mockTables(sales);
    adjust.mockResolvedValueOnce({ ok: false, reason: "insufficient", stock: 0 });

    const response = await patchSale(json({ product_id: 4 }, "PATCH"), params(5));
    expect(response.status).toBe(409);
    expect(adjust).toHaveBeenCalledTimes(1);
    expect(sales.update).not.toHaveBeenCalled();
  });

  it("si la edición no se guarda, revierte los ajustes", async () => {
    const sales = chain({ data: STORED, error: null });
    sales.update = vi.fn(() => chain({ data: null, error: { message: "db" } }));
    mockTables(sales);

    const response = await patchSale(json({ product_id: 4, quantity: 1 }, "PATCH"), params(5));
    expect(response.status).toBe(500);
    // tomar 1 del 4, devolver 2 al 3, y revertir en orden inverso
    expect(adjust.mock.calls).toEqual([
      [4, -1],
      [3, 2],
      [3, -2],
      [4, 1],
    ]);
  });

  it("editar solo el precio no toca el stock", async () => {
    mockTables(chain({ data: STORED, error: null }));

    const response = await patchSale(json({ price: 2000 }, "PATCH"), params(5));
    expect(response.status).toBe(200);
    expect(adjust).not.toHaveBeenCalled();
  });

  it("al borrar una venta, sus unidades vuelven al stock", async () => {
    mockTables(chain({ data: STORED, error: null }));

    const response = await deleteSale(json({}, "DELETE"), params(5));
    expect(response.status).toBe(200);
    expect(adjust).toHaveBeenCalledWith(3, 2);
  });
});
