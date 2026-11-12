/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as auth from "@/lib/api/auth";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { GET } from "@/app/api/arca/invoices/route";
import { createdAtBound } from "@/lib/dates/argentina";

vi.mock("@/lib/api/auth", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/supabase/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

function chain(result: { data: unknown; error: unknown } = { data: [], error: null }) {
  const q: Record<string, any> = {};
  for (const m of ["select", "eq", "is", "gte", "lte", "order", "limit"]) {
    q[m] = vi.fn(() => q);
  }
  q.then = (resolve: (v: unknown) => unknown) => resolve(result);
  return q;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth.requireAdmin).mockResolvedValue({ email: "admin@test.com" } as any);
});

describe("GET /api/arca/invoices", () => {
  it("rechaza con 401 si no es admin", async () => {
    vi.mocked(auth.requireAdmin).mockResolvedValueOnce(null);
    const res = await GET(new Request("http://localhost:3000/api/arca/invoices"));
    expect(res.status).toBe(401);
  });

  it("trae error_message, receiver_iva_condition y environment en el select", async () => {
    const q = chain({ data: [{ id: 1, error_message: "Error de prueba", receiver_iva_condition: 5, environment: "prod" }], error: null });
    vi.mocked(supabaseAdmin.from).mockReturnValueOnce(q as any);

    const res = await GET(new Request("http://localhost:3000/api/arca/invoices"));
    expect(res.status).toBe(200);
    expect(q.select).toHaveBeenCalledWith(
      expect.stringContaining("error_message")
    );
    expect(q.select).toHaveBeenCalledWith(
      expect.stringContaining("receiver_iva_condition")
    );
    expect(q.select).toHaveBeenCalledWith(
      expect.stringContaining("environment")
    );
  });

  it("filtra por environment cuando se pasa el parámetro", async () => {
    const q = chain({ data: [], error: null });
    vi.mocked(supabaseAdmin.from).mockReturnValueOnce(q as any);

    const res = await GET(new Request("http://localhost:3000/api/arca/invoices?environment=prod"));
    expect(res.status).toBe(200);
    expect(q.eq).toHaveBeenCalledWith("environment", "prod");
  });

  it("usa createdAtBound para date_from y date_to", async () => {
    const q = chain({ data: [], error: null });
    vi.mocked(supabaseAdmin.from).mockReturnValueOnce(q as any);

    const res = await GET(
      new Request("http://localhost:3000/api/arca/invoices?date_from=2026-11-10&date_to=2026-11-10")
    );
    expect(res.status).toBe(200);
    expect(q.gte).toHaveBeenCalledWith("created_at", createdAtBound("2026-11-10", "start"));
    expect(q.lte).toHaveBeenCalledWith("created_at", createdAtBound("2026-11-10", "end"));
  });
});
