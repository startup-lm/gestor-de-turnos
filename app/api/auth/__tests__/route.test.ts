/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/route";
import * as auth from "@/lib/api/auth";
import * as planServer from "@/lib/flags/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

vi.mock("@/lib/api/auth", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/flags/server", () => ({ checkBarberLimit: vi.fn() }));
vi.mock("@/lib/supabase/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
    auth: { admin: { createUser: vi.fn() } },
  },
}));

function mockExistingBarber(barber: { id: number } | null) {
  vi.mocked(supabaseAdmin.from).mockReturnValue({
    select: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: barber, error: null }),
  } as any);
}

const post = (body: Record<string, unknown>) =>
  POST(new Request("http://localhost:3000/api/auth", { method: "POST", body: JSON.stringify(body) }));

describe("POST /api/auth (alta de cuenta de un profesional)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth.requireAdmin).mockResolvedValue({ email: "admin@test.com" } as any);
    vi.mocked(planServer.checkBarberLimit).mockResolvedValue(null);
    vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValue({ data: {}, error: null } as any);
  });

  it("crea la cuenta confirmada desde el servidor", async () => {
    mockExistingBarber(null);

    const response = await post({ email: " Nuevo@Test.com ", password: "secreta1" });

    expect(response.status).toBe(200);
    expect(supabaseAdmin.auth.admin.createUser).toHaveBeenCalledWith({
      email: "nuevo@test.com",
      password: "secreta1",
      email_confirm: true,
    });
  });

  it("valida el límite del plan si el profesional es nuevo", async () => {
    mockExistingBarber(null);
    vi.mocked(planServer.checkBarberLimit).mockResolvedValueOnce(
      Response.json({ error: "Alcanzaste el límite de profesionales de tu plan" }, { status: 403 }) as any
    );

    const response = await post({ email: "nuevo@test.com", password: "secreta1" });

    expect(response.status).toBe(403);
    expect(supabaseAdmin.auth.admin.createUser).not.toHaveBeenCalled();
  });

  it("no cuenta para el límite si el profesional ya existe (solo le falta la cuenta)", async () => {
    mockExistingBarber({ id: 3 });

    const response = await post({ email: "existente@test.com", password: "secreta1" });

    expect(response.status).toBe(200);
    expect(planServer.checkBarberLimit).not.toHaveBeenCalled();
  });

  it("rechaza contraseñas cortas", async () => {
    const response = await post({ email: "nuevo@test.com", password: "123" });
    expect(response.status).toBe(400);
  });

  it("responde 409 si el email ya tiene cuenta", async () => {
    mockExistingBarber(null);
    vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValueOnce({
      data: {},
      error: { code: "email_exists", status: 422, message: "already registered" },
    } as any);

    const response = await post({ email: "nuevo@test.com", password: "secreta1" });

    expect(response.status).toBe(409);
  });
});
