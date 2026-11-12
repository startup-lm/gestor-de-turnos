/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as auth from "@/lib/api/auth";
import * as flags from "@/lib/flags/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { PUT } from "@/app/api/arca/config/route";

vi.mock("@/lib/api/auth", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/flags/server", () => ({
  isServerFeatureEnabled: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/supabase/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

function chain(result: { data: unknown; error: unknown } = { data: null, error: null }) {
  const q: Record<string, any> = {};
  for (const m of ["select", "eq", "is", "order", "limit", "insert", "update", "delete", "upsert"]) {
    q[m] = vi.fn(() => q);
  }
  q.maybeSingle = vi.fn(() => Promise.resolve(result));
  q.single = vi.fn(() => Promise.resolve(result));
  q.then = (resolve: (v: unknown) => unknown) => resolve(result);
  return q;
}

const reqJson = (body: unknown) =>
  new Request("http://localhost:3000/api/arca/config", {
    method: "PUT",
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth.requireAdmin).mockResolvedValue({ email: "admin@test.com" } as any);
  vi.mocked(flags.isServerFeatureEnabled).mockResolvedValue(true);
});

describe("PUT /api/arca/config", () => {
  it("si el entorno cambia y el payload no trae URLs nuevas, pone wsaa_url y wsfe_url en null", async () => {
    const current = {
      environment: "homo",
      wsaa_url: "https://proxy-homo/wsaa",
      wsfe_url: "https://proxy-homo/wsfe",
    };
    const selectQuery = chain({ data: current, error: null });
    const upsertQuery = chain({ data: { id: 1, environment: "prod", wsaa_url: null, wsfe_url: null }, error: null });

    let fromCount = 0;
    vi.mocked(supabaseAdmin.from).mockImplementation((() => {
      fromCount++;
      return fromCount === 1 ? selectQuery : upsertQuery;
    }) as any);

    const res = await PUT(reqJson({ environment: "prod" }));
    expect(res.status).toBe(200);
    expect(upsertQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        environment: "prod",
        wsaa_url: null,
        wsfe_url: null,
      })
    );
  });

  it("rechaza con 400 si se manda una URL que no coincide con el entorno elegido", async () => {
    const current = { environment: "prod", wsaa_url: null, wsfe_url: null };
    const selectQuery = chain({ data: current, error: null });
    vi.mocked(supabaseAdmin.from).mockReturnValue(selectQuery as any);

    // Entorno resultante prod, pero manda url de homologación
    const res = await PUT(reqJson({ wsaaUrl: "https://wsaahomo.afip.gov.ar/ws/services/LoginCms" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("La dirección de ARCA no corresponde al entorno elegido");

    // O cambia entorno a homo pero manda url de prod
    const res2 = await PUT(reqJson({ environment: "homo", wsfeUrl: "https://servicios1.afip.gov.ar/wsfev1/service.asmx" }));
    expect(res2.status).toBe(400);
    expect((await res2.json()).error).toBe("La dirección de ARCA no corresponde al entorno elegido");
  });

  it("una URL vacía se guarda como null y una válida se acepta", async () => {
    const current = { environment: "homo", wsaa_url: "https://wsaahomo.afip.gov.ar/...", wsfe_url: null };
    const selectQuery = chain({ data: current, error: null });
    const upsertQuery = chain({ data: { id: 1, environment: "homo" }, error: null });

    let fromCount = 0;
    vi.mocked(supabaseAdmin.from).mockImplementation((() => {
      fromCount++;
      return fromCount === 1 ? selectQuery : upsertQuery;
    }) as any);

    const res = await PUT(reqJson({ wsaaUrl: "   ", wsfeUrl: "https://wswhomo.afip.gov.ar/wsfev1/service.asmx" }));
    expect(res.status).toBe(200);
    expect(upsertQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        wsaa_url: null,
        wsfe_url: "https://wswhomo.afip.gov.ar/wsfev1/service.asmx",
      })
    );
  });
});
