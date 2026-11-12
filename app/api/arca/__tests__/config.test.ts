/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as auth from "@/lib/api/auth";
import * as flags from "@/lib/flags/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { GET, PUT } from "@/app/api/arca/config/route";

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

  it("acepta y guarda datos fiscales del emisor", async () => {
    const current = { environment: "homo" };
    const selectQuery = chain({ data: current, error: null });
    const upsertQuery = chain({
      data: {
        id: 1,
        environment: "homo",
        legal_name: "Turnik Barbería S.A.",
        fiscal_address: "Av. Corrientes 1234, CABA",
        gross_income: "30-12345678-9",
        activity_start_date: "2024-05-01",
      },
      error: null,
    });

    let fromCount = 0;
    vi.mocked(supabaseAdmin.from).mockImplementation((() => {
      fromCount++;
      return fromCount === 1 ? selectQuery : upsertQuery;
    }) as any);

    const res = await PUT(
      reqJson({
        legalName: "  Turnik Barbería S.A.  ",
        fiscalAddress: "Av. Corrientes 1234, CABA",
        grossIncome: "30-12345678-9",
        activityStartDate: "2024-05-01",
      })
    );

    expect(res.status).toBe(200);
    expect(upsertQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        legal_name: "Turnik Barbería S.A.",
        fiscal_address: "Av. Corrientes 1234, CABA",
        gross_income: "30-12345678-9",
        activity_start_date: "2024-05-01",
      })
    );
  });

  it("valida que la fecha de inicio de actividades tenga formato AAAA-MM-DD", async () => {
    const current = { environment: "homo" };
    const selectQuery = chain({ data: current, error: null });
    vi.mocked(supabaseAdmin.from).mockReturnValue(selectQuery as any);

    const res = await PUT(reqJson({ activityStartDate: "01/05/2024" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("La fecha de inicio de actividades tiene que tener formato AAAA-MM-DD");
  });

  it("se guarda cifrado: guarda keyPem y keyPassphrase con enc:v1: cuando hay ARCA_ENCRYPTION_KEY e invalida el ticket WSAA", async () => {
    const originalKey = process.env.ARCA_ENCRYPTION_KEY;
    process.env.ARCA_ENCRYPTION_KEY = "test-secret-key-32-bytes-minimum";

    try {
      const current = {
        environment: "homo",
        wsaa_token: "OLD_TOKEN",
        wsaa_sign: "OLD_SIGN",
        wsaa_expires_at: "2026-11-03T20:00:00-03:00",
        key_pem: null,
      };
      const selectQuery = chain({ data: current, error: null });
      const upsertQuery = chain({
        data: {
          id: 1,
          key_pem: "enc:v1:fake",
          key_passphrase: "enc:v1:fake",
          wsaa_token: null,
          wsaa_sign: null,
          wsaa_expires_at: null,
        },
        error: null,
      });

      let fromCount = 0;
      vi.mocked(supabaseAdmin.from).mockImplementation((() => {
        fromCount++;
        return fromCount === 1 ? selectQuery : upsertQuery;
      }) as any);

      const res = await PUT(
        reqJson({
          keyPem: "MI_CLAVE_PRIVADA_PEM_TEST",
          keyPassphrase: "mi-passphrase-secreta",
        })
      );

      expect(res.status).toBe(200);
      expect(upsertQuery.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          key_pem: expect.stringMatching(/^enc:v1:/),
          key_passphrase: expect.stringMatching(/^enc:v1:/),
          wsaa_token: null,
          wsaa_sign: null,
          wsaa_expires_at: null,
        })
      );
    } finally {
      process.env.ARCA_ENCRYPTION_KEY = originalKey;
    }
  });

  it("sin ARCA_ENCRYPTION_KEY se guarda en texto plano", async () => {
    const originalKey = process.env.ARCA_ENCRYPTION_KEY;
    delete process.env.ARCA_ENCRYPTION_KEY;

    try {
      const current = { environment: "homo" };
      const selectQuery = chain({ data: current, error: null });
      const upsertQuery = chain({
        data: { id: 1, key_pem: "CLAVE_TEST_SIN_CIFRAR" },
        error: null,
      });

      let fromCount = 0;
      vi.mocked(supabaseAdmin.from).mockImplementation((() => {
        fromCount++;
        return fromCount === 1 ? selectQuery : upsertQuery;
      }) as any);

      const res = await PUT(reqJson({ keyPem: "CLAVE_TEST_SIN_CIFRAR" }));
      expect(res.status).toBe(200);
      expect(upsertQuery.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          key_pem: "CLAVE_TEST_SIN_CIFRAR",
        })
      );
    } finally {
      process.env.ARCA_ENCRYPTION_KEY = originalKey;
    }
  });
});

describe("GET /api/arca/config", () => {
  it("devuelve los datos fiscales del emisor", async () => {
    const row = {
      id: 1,
      environment: "prod",
      cuit: "20123456789",
      point_of_sale: 2,
      legal_name: "Barbería Central",
      fiscal_address: "San Martín 456",
      gross_income: "20123456789",
      activity_start_date: "2023-01-15",
      cert_pem: "CERT",
      key_pem: "KEY",
      key_passphrase: null,
    };
    const selectQuery = chain({ data: row, error: null });
    vi.mocked(supabaseAdmin.from).mockReturnValue(selectQuery as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toMatchObject({
      legal_name: "Barbería Central",
      fiscal_address: "San Martín 456",
      gross_income: "20123456789",
      activity_start_date: "2023-01-15",
      has_cert: true,
      has_key: true,
    });
    // Certificado y clave crudos nunca salen al cliente
    expect(data.cert_pem).toBeUndefined();
    expect(data.key_pem).toBeUndefined();
  });
});
