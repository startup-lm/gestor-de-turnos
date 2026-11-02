/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as auth from "@/lib/api/auth";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

vi.mock("@/lib/api/auth", () => ({
  requireAdmin: vi.fn(),
  requireBarberOrAdmin: vi.fn(),
}));

// Si una ruta toca la base antes de validar la sesión, el test falla
vi.mock("@/lib/supabase/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: vi.fn(() => { throw new Error("La ruta accedió a la base sin autenticar"); }),
    rpc: vi.fn(() => { throw new Error("La ruta accedió a la base sin autenticar"); }),
    storage: { from: vi.fn(() => { throw new Error("La ruta accedió al storage sin autenticar"); }) },
    auth: { admin: { listUsers: vi.fn(() => { throw new Error("La ruta accedió a auth sin autenticar"); }) } },
  },
}));

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

type Handler = (req: Request, ctx?: any) => Promise<Response>;
type Case = { name: string; load: () => Promise<Record<string, unknown>>; methods: string[]; withParams?: boolean };

/** Todas las rutas que requieren sesión de staff o admin, con los métodos protegidos. */
const PROTECTED_ROUTES: Case[] = [
  { name: "admin/revalidate", load: () => import("@/app/api/admin/revalidate/route"), methods: ["POST"] },
  { name: "appointments/all", load: () => import("@/app/api/appointments/all/route"), methods: ["GET"] },
  { name: "appointments", load: () => import("@/app/api/appointments/route"), methods: ["PUT", "DELETE", "PATCH"] },
  { name: "arca/config", load: () => import("@/app/api/arca/config/route"), methods: ["GET", "PUT"] },
  { name: "arca/emit", load: () => import("@/app/api/arca/emit/route"), methods: ["POST"] },
  { name: "arca/invoices", load: () => import("@/app/api/arca/invoices/route"), methods: ["GET"] },
  { name: "arca/status", load: () => import("@/app/api/arca/status/route"), methods: ["GET"] },
  { name: "auth", load: () => import("@/app/api/auth/route"), methods: ["GET", "POST", "DELETE"] },
  { name: "barbers", load: () => import("@/app/api/barbers/route"), methods: ["POST", "PUT", "DELETE"] },
  { name: "business-hours", load: () => import("@/app/api/business-hours/route"), methods: ["PUT"] },
  { name: "business-settings", load: () => import("@/app/api/business-settings/route"), methods: ["PUT"] },
  { name: "cash/movements", load: () => import("@/app/api/cash/movements/route"), methods: ["GET", "POST"] },
  { name: "clients", load: () => import("@/app/api/clients/route"), methods: ["GET", "POST"] },
  { name: "google-reviews/candidate", load: () => import("@/app/api/google-reviews/candidate/route"), methods: ["GET", "POST"] },
  { name: "google-reviews/sync", load: () => import("@/app/api/google-reviews/sync/route"), methods: ["POST"] },
  { name: "payouts", load: () => import("@/app/api/payouts/route"), methods: ["GET", "POST"] },
  { name: "products", load: () => import("@/app/api/products/route"), methods: ["POST", "PUT", "DELETE"] },
  { name: "sales/[id]", load: () => import("@/app/api/sales/[id]/route"), methods: ["GET", "PATCH", "DELETE"], withParams: true },
  { name: "sales/all", load: () => import("@/app/api/sales/all/route"), methods: ["GET"] },
  { name: "sales/barber", load: () => import("@/app/api/sales/barber/route"), methods: ["GET"] },
  { name: "sales/list", load: () => import("@/app/api/sales/list/route"), methods: ["GET"] },
  { name: "sales", load: () => import("@/app/api/sales/route"), methods: ["GET", "POST", "PUT", "DELETE"] },
  { name: "services", load: () => import("@/app/api/services/route"), methods: ["POST", "PUT", "DELETE"] },
  { name: "storage", load: () => import("@/app/api/storage/route"), methods: ["POST", "DELETE"] },
];

function buildRequest(name: string, method: string) {
  const url = `http://localhost:3000/api/${name}?start_date=2026-01-01&end_date=2026-01-31&email=a@b.com`;
  if (method === "GET") return new Request(url);
  if (name === "storage" && method === "POST") {
    const form = new FormData();
    form.append("bucket", "branding");
    form.append("file", new Blob(["x"], { type: "image/png" }));
    return new Request(url, { method, body: form });
  }
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: 1, bucket: "branding", path: "logo.png", total: 100 }),
  });
}

describe("Guards de autenticación en la API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth.requireAdmin).mockResolvedValue(null);
    vi.mocked(auth.requireBarberOrAdmin).mockResolvedValue(null);
  });

  for (const route of PROTECTED_ROUTES) {
    for (const method of route.methods) {
      it(`${method} /api/${route.name} sin sesión responde 401 sin tocar la base`, async () => {
        const mod = await route.load();
        const handler = mod[method] as Handler;
        expect(handler, `${route.name} no exporta ${method}`).toBeTypeOf("function");

        const ctx = route.withParams ? { params: Promise.resolve({ id: "1" }) } : undefined;
        const response = await handler(buildRequest(route.name, method), ctx);

        expect(response.status).toBe(401);
        expect(supabaseAdmin.from).not.toHaveBeenCalled();
      });
    }
  }
});
