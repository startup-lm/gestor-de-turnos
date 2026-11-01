/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, PUT, DELETE } from "@/app/api/appointments/route";
import * as auth from "@/lib/api/auth";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

vi.mock("@/lib/api/auth", () => ({
  requireBarberOrAdmin: vi.fn(),
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/supabase/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

describe("API /api/appointments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabaseAdmin.from).mockReset();
  });

  describe("GET - Enmascaramiento y privacidad", () => {
    const rawAppointments = [
      {
        id: 1,
        client: "Agustín Benítez",
        phone: "+5491122334455",
        date: "2026-11-20",
        start_time: "15:00:00",
        end_time: "15:30:00",
        price: 15000,
        payment_method: "Efectivo",
        barbers: { name: "Lucas" },
        services: { name: "Corte" },
        arca_invoices: null,
      },
    ];

    it("debe enmascarar datos sensibles para usuarios no autenticados (guest)", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(null);

      const queryMock = {
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: rawAppointments, error: null })),
      };

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(queryMock as any);

      const response = await GET(new Request("http://localhost:3000/api/appointments?date=2026-11-20"));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json[0].client).toBe("Ocupado");
      expect(json[0].phone).toBeNull();
      expect(json[0].price).toBeNull();
      expect(json[0].payment_method).toBeNull();
      expect(json[0].start_time).toBe("15:00");
    });

    it("debe mostrar datos reales para personal autenticado (barbero o admin)", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce({
        user: { email: "barber@test.com" },
        barber: { id: 1, role: "barber", active: true },
      } as any);

      const queryMock = {
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: rawAppointments, error: null })),
      };

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(queryMock as any);

      const response = await GET(new Request("http://localhost:3000/api/appointments?date=2026-11-20"));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json[0].client).toBe("Agustín Benítez");
      expect(json[0].phone).toBe("+5491122334455");
      expect(json[0].price).toBe(15000);
      expect(json[0].payment_method).toBe("Efectivo");
    });
  });

  describe("PUT - Cobro y protección fiscal ARCA", () => {
    it("debe bloquear la modificación de un turno con comprobante fiscal emitido", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce({} as any);

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValueOnce({
            data: { id: 1, arca_invoice_id: 1234 },
            error: null,
          }),
        }),
      };

      vi.mocked(supabaseAdmin.from).mockImplementation(mockSupabase.from as any);

      const response = await PUT(
        new Request("http://localhost:3000/api/appointments", {
          method: "PUT",
          body: JSON.stringify({
            appointmentId: 1,
            isPaid: true,
            price: 15000,
            payment_method: "Efectivo",
          }),
        })
      );

      const json = await response.json();
      expect(response.status).toBe(400);
      expect(json.error).toMatch(/comprobante fiscal emitido ante ARCA/i);
    });

    it("debe permitir revertir o registrar cobro si no tiene comprobante fiscal", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce({} as any);

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValueOnce({
            data: { id: 1, arca_invoice_id: null },
            error: null,
          }),
          update: vi.fn().mockReturnThis(),
        }),
      };

      mockSupabase.from().update.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValueOnce({
            data: [{ id: 1, barber_id: 1, date: "2026-11-20" }],
            error: null,
          }),
        }),
      });

      vi.mocked(supabaseAdmin.from).mockImplementation(mockSupabase.from as any);

      const response = await PUT(
        new Request("http://localhost:3000/api/appointments", {
          method: "PUT",
          body: JSON.stringify({
            appointmentId: 1,
            isPaid: false, // Reversión de cobro
            price: 15000,
          }),
        })
      );

      const json = await response.json();
      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });

  describe("DELETE - Reglas de eliminación", () => {
    it("debe impedir eliminar un turno que ya fue cobrado", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce({} as any);

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValueOnce({
            data: { id: 1, paid: true, arca_invoice_id: null, type: "appointment" },
            error: null,
          }),
        }),
      };

      vi.mocked(supabaseAdmin.from).mockImplementation(mockSupabase.from as any);

      const response = await DELETE(
        new Request("http://localhost:3000/api/appointments", {
          method: "DELETE",
          body: JSON.stringify({ id: 1, deleted_by: "Admin" }),
        })
      );

      const json = await response.json();
      expect(response.status).toBe(400);
      expect(json.error).toMatch(/ya fue cobrado/i);
    });
  });

  describe("POST - Creación, solapamiento y validación", () => {
    it("debe rechazar si un cliente anónimo intenta reservar en el pasado", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(null); // Guest

      const response = await POST(
        new Request("http://localhost:3000/api/appointments", {
          method: "POST",
          body: JSON.stringify({
            client: "Pedro",
            barber_id: 1,
            date: "2020-01-01", // Fecha pasada
            start_time: "10:00",
            end_time: "10:30",
            phone: "1123456789",
            service_id: 1,
          }),
        })
      );

      const json = await response.json();
      expect(response.status).toBe(400);
      expect(json.error).toMatch(/no es posible reservar turnos en fechas u horarios pasados/i);
    });

    it("debe rechazar si el turno se solapa con otro turno activo del mismo barbero", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce({} as any); // Staff

      const overlapQueryMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce({
          data: [{ id: 99 }], // Turno existente que colisiona
          error: null,
        }),
      };

      vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
        if (table === "clients") {
          return {
            select: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 5 }, error: null }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) }),
          } as any;
        }
        if (table === "appointments") {
          return overlapQueryMock as any;
        }
        return {} as any;
      });

      const response = await POST(
        new Request("http://localhost:3000/api/appointments", {
          method: "POST",
          body: JSON.stringify({
            client: "Pedro",
            barber_id: 1,
            date: "2030-01-01",
            start_time: "10:00",
            end_time: "10:30",
            phone: "1123456789",
            service_id: 1,
          }),
        })
      );

      const json = await response.json();
      expect(response.status).toBe(400);
      expect(json.error).toMatch(/coincide o se solapa/i);
    });
  });
});

describe("API /api/appointments - filtros y datos fiscales", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabaseAdmin.from).mockReset();
  });

  it("un anónimo no puede filtrar por teléfono ni ver facturas ARCA", async () => {
    vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(null);

    const queryMock = {
      select: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      then: vi.fn((resolve) =>
        resolve({
          data: [{ id: 1, client: "Ana", phone: "+5491100000000", client_id: 7, arca_invoice_id: 3, arca_invoices: { cae: "123" } }],
          error: null,
        })
      ),
    };
    vi.mocked(supabaseAdmin.from).mockReturnValueOnce(queryMock as any);

    const response = await GET(
      new Request("http://localhost:3000/api/appointments?phone=%2B5491100000000&client=Ana&barber_id=2")
    );
    const json = await response.json();

    expect(queryMock.eq).not.toHaveBeenCalledWith("phone", expect.anything());
    expect(queryMock.eq).not.toHaveBeenCalledWith("client", expect.anything());
    expect(queryMock.eq).toHaveBeenCalledWith("barber_id", "2");
    expect(json[0]).toMatchObject({ client: "Ocupado", phone: null, client_id: null, arca_invoice_id: null, arca_invoices: null });
  });
});
