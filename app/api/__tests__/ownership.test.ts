/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as auth from "@/lib/api/auth";
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

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

// El stock se prueba aparte (app/api/sales/__tests__/stock.test.ts): acá siempre alcanza
vi.mock("@/lib/finance/stock", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/finance/stock")>()),
  adjustProductStock: vi.fn().mockResolvedValue({ ok: true, stock: 99 }),
}));

const ADMIN = { user: {}, barber: { id: 1, role: "admin" } } as any;
const BARBER_2 = { user: {}, barber: { id: 2, role: "barber" } } as any;

/** Consulta encadenable de Supabase: cada método devuelve la misma consulta y al final resuelve `result`. */
function chain(result: { data: unknown; error: unknown } = { data: null, error: null }) {
  const q: Record<string, any> = {};
  for (const m of ["select", "eq", "is", "order", "limit", "insert", "update", "delete"]) {
    q[m] = vi.fn(() => q);
  }
  q.maybeSingle = vi.fn(() => Promise.resolve(result));
  q.single = vi.fn(() => Promise.resolve(result));
  q.then = (resolve: (v: unknown) => unknown) => resolve(result);
  return q;
}

const json = (body: unknown, method = "POST") =>
  new Request("http://localhost:3000/api/x", { method, body: JSON.stringify(body) });
const params = (id: number) => ({ params: Promise.resolve({ id: String(id) }) });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Ventas: permisos y total", () => {
  it("un barbero no puede registrar una venta a nombre de otro", async () => {
    vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(BARBER_2);
    const response = await createSale(json({ barber_id: 1, product_id: 3, price: 1000, quantity: 1, payment_method: "Efectivo" }));
    expect(response.status).toBe(403);
    expect(supabaseAdmin.from).not.toHaveBeenCalled();
  });

  it("el total lo calcula el servidor, ignorando el del navegador", async () => {
    vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(BARBER_2);
    const q = chain({ data: { id: 10 }, error: null });
    vi.mocked(supabaseAdmin.from).mockReturnValue(q as any);

    const response = await createSale(json({ barber_id: 2, product_id: 3, price: 1500, quantity: 2, total: 1, payment_method: "Efectivo" }));
    expect(response.status).toBe(200);
    expect(q.insert).toHaveBeenCalledWith(expect.objectContaining({ total: 3000, barber_id: 2 }));
  });

  it("exige medio de pago: sin él la venta no se puede ubicar en la caja", async () => {
    vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(ADMIN);
    const response = await createSale(json({ barber_id: 1, product_id: 3, price: 1000, quantity: 1 }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/medio de pago/);
    expect(supabaseAdmin.from).not.toHaveBeenCalled();
  });

  it("congela el % de comisión por venta vigente del barbero", async () => {
    vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(ADMIN);
    const q = chain({ data: { id: 10, commission: 0.5, sale_commission: 0.3 }, error: null });
    vi.mocked(supabaseAdmin.from).mockReturnValue(q as any);

    const response = await createSale(json({ barber_id: 1, product_id: 3, price: 1000, quantity: 1, payment_method: "Efectivo" }));
    expect(response.status).toBe(200);
    expect(q.insert).toHaveBeenCalledWith(expect.objectContaining({ commission_rate: 0.3, payment_method: "Efectivo" }));
  });

  it("no permite editar ni borrar una venta ya liquidada", async () => {
    vi.mocked(auth.requireBarberOrAdmin).mockResolvedValue(ADMIN);
    const q = chain({ data: { id: 5, barber_id: 1, price: 1000, quantity: 1, arca_invoice_id: null, payout_id: 8 }, error: null });
    vi.mocked(supabaseAdmin.from).mockReturnValue(q as any);

    const edited = await patchSale(json({ price: 2000 }, "PATCH"), params(5));
    expect(edited.status).toBe(409);
    expect((await edited.json()).error).toMatch(/liquidación #8/);
    const deleted = await deleteSale(json({}, "DELETE"), params(5));
    expect(deleted.status).toBe(409);
    expect(q.update).not.toHaveBeenCalled();
    expect(q.delete).not.toHaveBeenCalled();
  });

  it("rechaza cantidades inválidas", async () => {
    vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(ADMIN);
    const response = await createSale(json({ barber_id: 1, product_id: 3, price: 1500, quantity: 0 }));
    expect(response.status).toBe(400);
  });

  it("un barbero no puede editar la venta de otro", async () => {
    vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(BARBER_2);
    const q = chain({ data: { id: 5, barber_id: 1, price: 100, quantity: 1, arca_invoice_id: null }, error: null });
    vi.mocked(supabaseAdmin.from).mockReturnValue(q as any);

    const response = await patchSale(json({ price: 1 }, "PATCH"), params(5));
    expect(response.status).toBe(403);
    expect(q.update).not.toHaveBeenCalled();
  });

  it("un barbero no puede pasarle su venta a otro barbero", async () => {
    vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(BARBER_2);
    const q = chain({ data: { id: 5, barber_id: 2, price: 100, quantity: 1, arca_invoice_id: null }, error: null });
    vi.mocked(supabaseAdmin.from).mockReturnValue(q as any);

    const response = await patchSale(json({ barber_id: 1 }, "PATCH"), params(5));
    expect(response.status).toBe(403);
  });

  it("al editar, el total se recalcula con los valores finales", async () => {
    vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(ADMIN);
    const q = chain({ data: { id: 5, barber_id: 2, price: 100, quantity: 3, arca_invoice_id: null }, error: null });
    vi.mocked(supabaseAdmin.from).mockReturnValue(q as any);

    const response = await patchSale(json({ price: 200, total: 1 }, "PATCH"), params(5));
    expect(response.status).toBe(200);
    expect(q.update).toHaveBeenCalledWith({ price: 200, total: 600 });
  });

  it("un barbero no puede borrar la venta de otro", async () => {
    vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(BARBER_2);
    const q = chain({ data: { id: 5, barber_id: 1, price: 100, quantity: 1, arca_invoice_id: null }, error: null });
    vi.mocked(supabaseAdmin.from).mockReturnValue(q as any);

    const response = await deleteSale(new Request("http://localhost/api/sales/5", { method: "DELETE" }), params(5));
    expect(response.status).toBe(403);
    expect(q.delete).not.toHaveBeenCalled();
  });

  it("borrar una venta inexistente responde 404", async () => {
    vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(ADMIN);
    vi.mocked(supabaseAdmin.from).mockReturnValue(chain() as any);

    const response = await deleteSale(new Request("http://localhost/api/sales/5", { method: "DELETE" }), params(5));
    expect(response.status).toBe(404);
  });
});
