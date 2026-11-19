/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/appointments/all/route";
import * as auth from "@/lib/api/auth";
import * as fetchAll from "@/lib/supabase/fetchAllRows";
import * as rates from "@/lib/finance/barberRates";

vi.mock("@/lib/api/auth", () => ({
  requireBarberOrAdmin: vi.fn(),
}));

vi.mock("@/lib/supabase/fetchAllRows", () => ({
  fetchAllRows: vi.fn(),
}));

vi.mock("@/lib/finance/barberRates", () => ({
  getAllBarberRates: vi.fn(),
}));

vi.mock("@/lib/supabase/supabaseAdmin", () => ({
  supabaseAdmin: { from: vi.fn() },
}));

const ROWS = [
  { barber_id: 1, date: "2026-11-02", end_time: "20:00:00", type: "appointment", paid: true, price: 1000, payment_method: "Efectivo", commission_rate: 0.5 },
  { barber_id: 1, date: "2026-11-03", end_time: "14:30:00", type: "appointment", paid: false, price: 2000, payment_method: null, commission_rate: 0.5 },
  { barber_id: 1, date: "2026-11-03", end_time: "15:30:00", type: "appointment", paid: false, price: 3000, payment_method: null, commission_rate: 0.5 },
  { barber_id: 1, date: "2026-11-02", end_time: "12:00:00", type: "block", paid: false, price: 0, payment_method: null, commission_rate: 0.5 },
  { barber_id: 1, date: "2026-11-04", end_time: "10:00:00", type: "appointment", paid: true, price: 500, payment_method: "Efectivo", commission_rate: 0.5 },
  { barber_id: 2, date: "2026-11-01", end_time: "11:00:00", type: null, paid: false, price: 4000, payment_method: null, commission_rate: 0.5 },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-03T18:00:00Z"));
  vi.mocked(auth.requireBarberOrAdmin).mockResolvedValue({ barber: { id: 1, role: "admin" } } as any);
  vi.mocked(fetchAll.fetchAllRows).mockResolvedValue({ data: ROWS, error: null } as any);
  vi.mocked(rates.getAllBarberRates).mockResolvedValue({ rates: new Map(), error: null } as any);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GET /api/appointments/all", () => {
  it("cuenta turnos que ya terminaron (cobrados o no) en pastAppt y mantiene totales de cobrados", async () => {
    const request = new Request("http://localhost/api/appointments/all?start_date=2026-11-01&end_date=2026-11-04");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.barberTotals).toEqual([
      { barberId: 1, totalAppt: 2, totalRevenue: 1500, totalCommission: 750, pastAppt: 2 },
      { barberId: 2, totalAppt: 0, totalRevenue: 0, totalCommission: 0, pastAppt: 1 },
    ]);
    expect(data.paymentMethodTotals).toEqual({ Efectivo: 1500 });
  });

  it("responde 400 sin start_date", async () => {
    const request = new Request("http://localhost/api/appointments/all?end_date=2026-11-04");
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/start_date/);
  });
});
