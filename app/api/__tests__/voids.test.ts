/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as auth from "@/lib/api/auth";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { POST as voidPayout } from "@/app/api/payouts/[id]/void/route";
import { POST as voidMovement } from "@/app/api/cash/movements/[id]/void/route";

vi.mock("@/lib/api/auth", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/supabase/supabaseAdmin", () => ({ supabaseAdmin: { from: vi.fn() } }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

function chain(result: unknown) {
  const q: Record<string, any> = {};
  for (const m of ["select", "eq", "is", "update"]) q[m] = vi.fn(() => q);
  q.maybeSingle = vi.fn(() => Promise.resolve(result));
  q.then = (resolve: (v: unknown) => unknown) => resolve({ data: null, error: null });
  return q;
}

const req = () => new Request("http://localhost/api/x", { method: "POST" });
const params = (id: number) => ({ params: Promise.resolve({ id: String(id) }) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth.requireAdmin).mockResolvedValue({ email: "admin@test.com" } as any);
});

describe("Anular liquidación", () => {
  it("anula la liquidación, libera sus adelantos y anula su egreso", async () => {
    const q = chain({ data: { id: 3, voided_at: null }, error: null });
    vi.mocked(supabaseAdmin.from).mockReturnValue(q as any);

    const response = await voidPayout(req(), params(3));
    expect(response.status).toBe(200);
    expect(q.update).toHaveBeenCalledWith(expect.objectContaining({ voided_at: expect.any(String) }));
    expect(q.update).toHaveBeenCalledWith({ payout_id: null });
  });

  it("no anula dos veces", async () => {
    vi.mocked(supabaseAdmin.from).mockReturnValue(chain({ data: { id: 3, voided_at: "2026-11-01" }, error: null }) as any);
    expect((await voidPayout(req(), params(3))).status).toBe(409);
  });

  it("sin sesión de admin responde 401", async () => {
    vi.mocked(auth.requireAdmin).mockResolvedValueOnce(null);
    expect((await voidPayout(req(), params(3))).status).toBe(401);
    expect(supabaseAdmin.from).not.toHaveBeenCalled();
  });
});

describe("Anular movimiento de caja", () => {
  it("un pago de comisión se anula desde su liquidación", async () => {
    vi.mocked(supabaseAdmin.from).mockReturnValue(chain({ data: { id: 8, type: "commission_payout", voided_at: null }, error: null }) as any);
    expect((await voidMovement(req(), params(8))).status).toBe(409);
  });

  it("un adelanto ya descontado no se puede anular", async () => {
    vi.mocked(supabaseAdmin.from).mockReturnValue(chain({ data: { id: 8, type: "advance", voided_at: null, payout_id: 4 }, error: null }) as any);
    const response = await voidMovement(req(), params(8));
    expect(response.status).toBe(409);
    expect((await response.json()).error).toMatch(/#4/);
  });

  it("anula un gasto", async () => {
    const q = chain({ data: { id: 8, type: "expense", voided_at: null, payout_id: null }, error: null });
    vi.mocked(supabaseAdmin.from).mockReturnValue(q as any);
    expect((await voidMovement(req(), params(8))).status).toBe(200);
    expect(q.update).toHaveBeenCalledWith({ voided_at: expect.any(String) });
  });
});
