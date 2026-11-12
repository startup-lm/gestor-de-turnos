/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks de dependencias
vi.mock("@/lib/api/auth", () => ({
  requireAdmin: vi.fn(),
  requireBarberOrAdmin: vi.fn(),
}));

vi.mock("@/lib/flags/server", () => ({
  checkBarberLimit: vi.fn().mockResolvedValue(null),
  requirePlanFeature: vi.fn().mockResolvedValue(null),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/lib/supabase/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      update: mockUpdate,
      insert: mockInsert,
      delete: mockDelete,
      select: mockSelect,
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: {}, error: null }),
        })),
      })),
      eq: mockEq,
    })),
    auth: {
      admin: {
        createUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
        deleteUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
        listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
      },
    },
  },
}));

import * as auth from "@/lib/api/auth";
import { POST as barbersPost, PUT as barbersPut, DELETE as barbersDelete } from "@/app/api/barbers/route";
import { POST as productsPost, PUT as productsPut, DELETE as productsDelete } from "@/app/api/products/route";
import { POST as servicesPost, PUT as servicesPut, DELETE as servicesDelete } from "@/app/api/services/route";
import { PUT as businessHoursPut } from "@/app/api/business-hours/route";
import { POST as authPost, DELETE as authDelete } from "@/app/api/auth/route";
import { POST as cashMovementsPost } from "@/app/api/cash/movements/route";
import { POST as payoutsPost } from "@/app/api/payouts/route";
import { DELETE as storageDelete } from "@/app/api/storage/route";
import { POST as googleReviewsPost } from "@/app/api/google-reviews/candidate/route";

describe("Validación de esquemas y payloads en API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth.requireAdmin).mockResolvedValue({ email: "admin@test.com" } as any);
    vi.mocked(auth.requireBarberOrAdmin).mockResolvedValue({
      user: { email: "admin@test.com" },
      barber: { id: 1, role: "admin" },
    } as any);

    mockUpdate.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }),
      }),
    });
    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
      }),
    });
    mockDelete.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }),
      }),
    });
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    });
  });

  const jsonRequest = (body: any) =>
    new Request("http://localhost:3000", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });

  describe("POST/PUT/DELETE /api/barbers", () => {
    it("POST /api/barbers rechaza con 400 si el email es inválido", async () => {
      const res = await barbersPost(jsonRequest({ name: "Carlos", email: "invalido" }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Email inválido");
    });

    it("PUT /api/barbers rechaza con 400 si el id no es entero positivo", async () => {
      const res = await barbersPut(jsonRequest({ id: -1, name: "Carlos" }));
      expect(res.status).toBe(400);
    });

    it("PUT /api/barbers descarta claves extra como deleted_at antes de enviar a supabase", async () => {
      const updateEq = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }),
      });
      mockUpdate.mockReturnValue({ eq: updateEq });

      const res = await barbersPut(
        jsonRequest({
          id: 5,
          name: "Carlos Editado",
          deleted_at: "2026-01-01",
          extra_fake_column: 1234,
        })
      );
      expect(res.status).toBe(200);
      expect(mockUpdate).toHaveBeenCalledWith({
        name: "Carlos Editado",
      });
      expect(updateEq).toHaveBeenCalledWith("id", 5);
    });

    it("DELETE /api/barbers rechaza con 400 si el id es inválido", async () => {
      const res = await barbersDelete(jsonRequest({ id: "abc" }));
      expect(res.status).toBe(400);
    });
  });

  describe("POST/PUT/DELETE /api/products", () => {
    it("POST /api/products rechaza con 400 si el precio es negativo", async () => {
      const res = await productsPost(jsonRequest({ name: "Cera", price: -50 }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("El precio no puede ser negativo");
    });

    it("PUT /api/products rechaza con 400 si el id no es válido", async () => {
      const res = await productsPut(jsonRequest({ id: 0, price: 100 }));
      expect(res.status).toBe(400);
    });

    it("DELETE /api/products rechaza con 400 si el id falta", async () => {
      const res = await productsDelete(jsonRequest({}));
      expect(res.status).toBe(400);
    });
  });

  describe("POST/PUT/DELETE /api/services", () => {
    it("POST /api/services rechaza con 400 si duration <= 0", async () => {
      const res = await servicesPost(jsonRequest({ name: "Corte", price: 5000, duration: 0 }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("La duración debe ser mayor a cero");
    });

    it("PUT /api/services rechaza con 400 si el precio es negativo", async () => {
      const res = await servicesPut(jsonRequest({ id: 1, price: -100 }));
      expect(res.status).toBe(400);
    });

    it("DELETE /api/services rechaza con 400 si el id no es positivo", async () => {
      const res = await servicesDelete(jsonRequest({ id: -2 }));
      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/business-hours", () => {
    it("rechaza con 400 si open_time tiene formato incorrecto", async () => {
      const resInvalid = await businessHoursPut(
        jsonRequest({
          open_time: "9am",
          close_time: "20:00",
          closed_days: [0],
        })
      );
      expect(resInvalid.status).toBe(400);
    });

    it("rechaza con 400 si closed_days contiene un día fuera de 0-6", async () => {
      const res = await businessHoursPut(
        jsonRequest({
          open_time: "09:00",
          close_time: "20:00",
          closed_days: [7],
        })
      );
      expect(res.status).toBe(400);
    });
  });

  describe("POST/DELETE /api/auth", () => {
    it("POST /api/auth rechaza con 400 si password < 6 caracteres", async () => {
      const res = await authPost(jsonRequest({ email: "barbero@test.com", password: "123" }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("La contraseña debe tener al menos 6 caracteres");
    });

    it("DELETE /api/auth rechaza con 400 si email es inválido", async () => {
      const res = await authDelete(jsonRequest({ email: "no-es-un-email" }));
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/cash/movements", () => {
    it("rechaza con 400 si el body tiene JSON malformado", async () => {
      const res = await cashMovementsPost(jsonRequest("{ roto "));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Datos inválidos");
    });

    it("rechaza con 400 si amount no es numérico", async () => {
      const res = await cashMovementsPost(
        jsonRequest({
          type: "expense",
          amount: "cien",
          description: "Insumos",
        })
      );
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/payouts", () => {
    it("rechaza con 400 si el período tiene formato inválido", async () => {
      const res = await payoutsPost(
        jsonRequest({
          barber_id: 1,
          period_start: "01/10/2026",
          period_end: "15/10/2026",
          payment_method: "Efectivo",
        })
      );
      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/storage", () => {
    it("rechaza con 400 si falta el bucket o path", async () => {
      const res = await storageDelete(jsonRequest({ bucket: "products" }));
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/google-reviews/candidate", () => {
    it("rechaza con 400 si el JSON está roto", async () => {
      const res = await googleReviewsPost(jsonRequest("{ roto"));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Datos inválidos");
    });
  });
});
