/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as auth from "@/lib/api/auth";
import * as openShift from "@/lib/finance/openShift";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { POST as closeShift } from "@/app/api/cash/shifts/[id]/close/route";
import { PATCH as patchAppointment } from "@/app/api/appointments/route";

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

vi.mock("@/lib/finance/openShift", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/finance/openShift")>()),
  loadShiftExpected: vi.fn(),
  currentShiftId: vi.fn(),
  closedShiftLock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const STAFF = { user: { email: "dueno@local.com" }, barber: { id: 1, role: "admin" } } as any;
const EXPECTED = [
  { method: "Efectivo", income: 50000, outcome: 2000, expected: 48000 },
  { method: "Mercado Pago", income: 30000, outcome: 0, expected: 30000 },
];

/** Consulta encadenable que resuelve `result`; `update` devuelve `updated` */
function chain(result: unknown, updated: { data: unknown; error: unknown } = { data: [{ id: 3 }], error: null }) {
  const q: Record<string, any> = {};
  for (const m of ["select", "eq", "is"]) q[m] = vi.fn(() => q);
  q.maybeSingle = vi.fn(() => Promise.resolve({ data: result, error: null }));
  q.update = vi.fn(() => {
    const w: Record<string, any> = {};
    w.eq = vi.fn(() => w);
    w.select = vi.fn(() => Promise.resolve(updated));
    return w;
  });
  return q;
}

const close = (body: unknown, id = 3) =>
  closeShift(new Request("http://localhost:3000/api/cash/shifts/3/close", { method: "POST", body: JSON.stringify(body) }), {
    params: Promise.resolve({ id: String(id) }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth.requireBarberOrAdmin).mockResolvedValue(STAFF);
  vi.mocked(openShift.loadShiftExpected).mockResolvedValue({ rows: EXPECTED, error: null });
  vi.mocked(openShift.closedShiftLock).mockResolvedValue(null);
  vi.mocked(openShift.currentShiftId).mockResolvedValue({ shiftId: 3, error: null });
});

describe("Cierre de caja", () => {
  it("exige el efectivo contado", async () => {
    vi.mocked(supabaseAdmin.from).mockReturnValue(chain({ id: 3, status: "open", initial_cash: 0 }) as any);
    const response = await close({ counted: { "Mercado Pago": 30000 } });
    expect(response.status).toBe(400);
  });

  it("guarda lo esperado del servidor, lo contado y la diferencia", async () => {
    const shifts = chain({ id: 3, status: "open", initial_cash: 0 });
    vi.mocked(supabaseAdmin.from).mockReturnValue(shifts as any);

    // El navegador no puede mandar lo esperado: lo calcula el servidor
    const response = await close({ counted: { Efectivo: 47000, "Mercado Pago": 30000 }, expected: 1 });
    expect(response.status).toBe(200);
    expect(shifts.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "closed",
        closed_by: "dueno@local.com",
        expected_cash: 48000,
        actual_cash: 47000,
        cash_difference: -1000,
        method_totals: [
          { method: "Efectivo", expected: 48000, counted: 47000 },
          { method: "Mercado Pago", expected: 30000, counted: 30000 },
        ],
      })
    );
  });

  it("no se cierra dos veces", async () => {
    vi.mocked(supabaseAdmin.from).mockReturnValue(chain({ id: 3, status: "closed", initial_cash: 0 }) as any);
    const response = await close({ counted: { Efectivo: 100 } });
    expect(response.status).toBe(409);
  });

  it("si otra persona la cerró en el medio, avisa en vez de pisar el cierre", async () => {
    vi.mocked(supabaseAdmin.from).mockReturnValue(
      chain({ id: 3, status: "open", initial_cash: 0 }, { data: [], error: null }) as any
    );
    const response = await close({ counted: { Efectivo: 100 } });
    expect(response.status).toBe(409);
  });
});

describe("Cobros y caja", () => {
  const patch = (body: unknown) =>
    patchAppointment(new Request("http://localhost:3000/api/appointments", { method: "PATCH", body: JSON.stringify(body) }));

  function mockAppointment(existing: Record<string, unknown>) {
    const q = chain(existing, { data: [{ id: 1, barber_id: 1, date: "2026-11-03" }], error: null });
    vi.mocked(supabaseAdmin.from).mockReturnValue(q as any);
    return q;
  }

  it("al cobrar un turno, entra en el período de caja en curso", async () => {
    const q = mockAppointment({ id: 1, barber_id: 1, paid: false, commission: 0.5 });
    const response = await patch({ appointmentId: 1, updates: { paid: true, price: 15000, payment_method: "Efectivo" } });
    expect(response.status).toBe(200);
    expect(q.update).toHaveBeenCalledWith(expect.objectContaining({ paid: true, shift_id: 3 }));
  });

  it("al revertir el cobro, sale de la caja", async () => {
    const q = mockAppointment({ id: 1, barber_id: 1, paid: true, shift_id: 3 });
    await patch({ appointmentId: 1, updates: { paid: false } });
    expect(q.update).toHaveBeenCalledWith(expect.objectContaining({ paid: false, shift_id: null }));
  });

  it("no se modifica un turno de un cierre ya hecho", async () => {
    const q = mockAppointment({ id: 1, barber_id: 1, paid: true, shift_id: 2 });
    vi.mocked(openShift.closedShiftLock).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: openShift.CLOSED_SHIFT_MESSAGE }), { status: 409 }) as any
    );
    const response = await patch({ appointmentId: 1, updates: { price: 1 } });
    expect(response.status).toBe(409);
    expect(q.update).not.toHaveBeenCalled();
  });

  it("con la caja apagada en el plan se cobra igual, sin período", async () => {
    vi.mocked(openShift.currentShiftId).mockResolvedValueOnce({ shiftId: null, error: null });
    const q = mockAppointment({ id: 1, barber_id: 1, paid: false, commission: 0.5 });
    const response = await patch({ appointmentId: 1, updates: { paid: true, price: 15000, payment_method: "Efectivo" } });
    expect(response.status).toBe(200);
    expect(q.update).toHaveBeenCalledWith(expect.objectContaining({ paid: true, shift_id: null }));
  });
});
