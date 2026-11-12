/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, PATCH, DELETE } from "@/app/api/appointments/route";

const ADMIN = { user: {}, barber: { id: 1, role: "admin" } } as any;
const BARBER_2 = { user: {}, barber: { id: 2, role: "barber" } } as any;
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

    it("anónimo sin rango → 400", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(null);
      const response = await GET(new Request("http://localhost:3000/api/appointments"));
      const json = await response.json();
      expect(response.status).toBe(400);
      expect(json.error).toMatch(/indicá un rango de fechas válido/i);
    });

    it("anónimo con rango → solo los 7 campos de la lista (sin client, phone, price, joins)", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(null);

      const rawGuestAppointments = [
        {
          id: 1,
          barber_id: 1,
          service_id: 2,
          date: "2026-11-20",
          start_time: "15:00:00",
          end_time: "15:30:00",
          type: "appointment",
        },
      ];

      const queryMock = {
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: rawGuestAppointments, error: null })),
      };

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce(queryMock as any);

      const response = await GET(new Request("http://localhost:3000/api/appointments?date=2026-11-20"));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(queryMock.select).toHaveBeenCalledWith("id, barber_id, service_id, date, start_time, end_time, type");
      expect(json[0]).toEqual({
        id: 1,
        barber_id: 1,
        service_id: 2,
        date: "2026-11-20",
        start_time: "15:00",
        end_time: "15:30",
        type: "appointment",
      });
      expect(json[0].client).toBeUndefined();
      expect(json[0].phone).toBeUndefined();
      expect(json[0].price).toBeUndefined();
      expect(json[0].barbers).toBeUndefined();
      expect(json[0].services).toBeUndefined();
      expect(Object.keys(json[0]).sort()).toEqual(
        ["barber_id", "date", "end_time", "id", "service_id", "start_time", "type"].sort()
      );
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
        range: vi.fn().mockResolvedValue({ data: rawAppointments, error: null }),
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

  describe("PATCH - Edición, dueño y protección fiscal ARCA", () => {
    /** Mockea la búsqueda del turno y captura lo que se manda al update. */
    function mockExisting(existing: Record<string, unknown>) {
      const update = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: [{ id: 1, barber_id: 1, date: "2026-11-20" }], error: null }),
        }),
      });
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: existing, error: null }),
        update,
      } as any);
      return update;
    }

    const patch = (body: unknown) =>
      PATCH(new Request("http://localhost:3000/api/appointments", { method: "PATCH", body: JSON.stringify(body) }));

    it("bloquea la modificación de un turno con comprobante fiscal emitido", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(ADMIN);
      mockExisting({ id: 1, barber_id: 1, arca_invoice_id: 1234 });

      const response = await patch({ appointmentId: 1, updates: { paid: true, price: 15000, payment_method: "Efectivo" } });
      expect(response.status).toBe(400);
      expect((await response.json()).error).toMatch(/comprobante fiscal emitido ante ARCA/i);
    });

    it("no permite cobrar sin medio de pago", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(ADMIN);
      const update = mockExisting({ id: 1, barber_id: 1, arca_invoice_id: null });

      const response = await patch({ appointmentId: 1, updates: { paid: true, price: 15000 } });
      expect(response.status).toBe(400);
      expect(update).not.toHaveBeenCalled();
    });

    it("al cobrar congela el % de comisión vigente del barbero", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(ADMIN);
      // La misma consulta mockeada responde al turno y al barbero
      const update = mockExisting({ id: 1, barber_id: 1, paid: false, arca_invoice_id: null, commission: 0.6 });

      const response = await patch({ appointmentId: 1, updates: { paid: true, price: 15000, payment_method: "Efectivo" } });
      expect(response.status).toBe(200);
      expect(update).toHaveBeenCalledWith(expect.objectContaining({ paid: true, commission_rate: 0.6 }));
    });

    it("al revertir el cobro borra el % congelado", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(ADMIN);
      const update = mockExisting({ id: 1, barber_id: 1, paid: true, arca_invoice_id: null });

      await patch({ appointmentId: 1, updates: { paid: false } });
      expect(update).toHaveBeenCalledWith({ paid: false, commission_rate: null });
    });

    it("no permite modificar un turno ya liquidado", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(ADMIN);
      const update = mockExisting({ id: 1, barber_id: 1, paid: true, arca_invoice_id: null, payout_id: 4 });

      const response = await patch({ appointmentId: 1, updates: { paid: false } });
      expect(response.status).toBe(409);
      expect((await response.json()).error).toMatch(/liquidación #4/);
      expect(update).not.toHaveBeenCalled();
    });

    it("permite registrar o revertir el cobro si no tiene comprobante", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(ADMIN);
      const update = mockExisting({ id: 1, barber_id: 1, arca_invoice_id: null });

      const response = await patch({ appointmentId: 1, updates: { paid: false, price: 15000 } });
      expect(response.status).toBe(200);
      expect(update).toHaveBeenCalledWith({ paid: false, price: 15000 });
    });

    it("un barbero no puede modificar el turno de otro barbero", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(BARBER_2);
      const update = mockExisting({ id: 1, barber_id: 1, arca_invoice_id: null });

      const response = await patch({ appointmentId: 1, updates: { price: 1 } });
      expect(response.status).toBe(403);
      expect(update).not.toHaveBeenCalled();
    });

    it("un barbero puede modificar su propio turno", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(BARBER_2);
      mockExisting({ id: 1, barber_id: 2, arca_invoice_id: null });

      const response = await patch({ appointmentId: 1, updates: { client: "Ana" } });
      expect(response.status).toBe(200);
    });

    it("descarta los campos protegidos que vengan del navegador", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(ADMIN);
      const update = mockExisting({ id: 1, barber_id: 1, arca_invoice_id: null });

      await patch({ appointmentId: 1, updates: { client: "Ana", deleted_at: null, arca_invoice_id: 99 } });
      expect(update).toHaveBeenCalledWith({ client: "Ana" });
    });

    it("devuelve 400 si la base responde 23P01 (solapamiento concurrente)", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(ADMIN);
      const update = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: null, error: { code: "23P01", message: "APPOINTMENT_OVERLAP" } }),
        }),
      });
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 1, barber_id: 1, arca_invoice_id: null }, error: null }),
        update,
      } as any);

      const response = await patch({ appointmentId: 1, updates: { client: "Ana" } });
      expect(response.status).toBe(400);
      expect((await response.json()).error).toMatch(/coincide o se solapa/i);
    });
  });

  describe("DELETE - Reglas de eliminación", () => {
    it("debe impedir eliminar un turno que ya fue cobrado", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(ADMIN);

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

    it("un barbero no puede eliminar el turno de otro barbero", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(BARBER_2);
      const update = vi.fn();
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 1, barber_id: 1, paid: false, arca_invoice_id: null, type: "appointment" },
          error: null,
        }),
        update,
      } as any);

      const response = await DELETE(
        new Request("http://localhost:3000/api/appointments", {
          method: "DELETE",
          body: JSON.stringify({ id: 1 }),
        })
      );

      expect(response.status).toBe(403);
      expect(update).not.toHaveBeenCalled();
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
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(ADMIN); // Staff

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

    function mockAnonymousPostDb(options: {
      service?: { id: number; duration: number } | null;
      barber?: { id: number; active: boolean } | null;
      hours?: { open_time: string; close_time: string; closed_days: number[] | null } | null;
      client?: { id: number } | null;
      overlapping?: any[];
      insertResult?: { data?: any; error?: any };
    } = {}) {
      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue(options.insertResult ?? { data: [{ id: 1 }], error: null }),
      });

      vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
        if (table === "services") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: options.service !== undefined ? options.service : { id: 1, duration: 30 },
              error: null,
            }),
          } as any;
        }
        if (table === "barbers") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: options.barber !== undefined ? options.barber : { id: 1, active: true },
              error: null,
            }),
          } as any;
        }
        if (table === "business_hours_global") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: options.hours !== undefined ? options.hours : { open_time: "09:00", close_time: "20:00", closed_days: [] },
              error: null,
            }),
          } as any;
        }
        if (table === "clients") {
          return {
            select: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: options.client !== undefined ? options.client : { id: 88 },
              error: null,
            }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) }),
            insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 88 } }) }) }),
          } as any;
        }
        if (table === "appointments") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            lt: vi.fn().mockReturnThis(),
            gt: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: options.overlapping ?? [],
              error: null,
            }),
            insert: insertMock,
          } as any;
        }
        return {} as any;
      });

      return { insertMock };
    }

    it("POST anónimo con type: 'block', created_by y client_id descarta esos campos y fuerza appointment", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(null);
      const { insertMock } = mockAnonymousPostDb();

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
            type: "block",
            created_by: "hacker",
            client_id: 9999,
          }),
        })
      );

      expect(response.status).toBe(200);
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "appointment",
          client_id: 88,
        })
      );
      const payload = insertMock.mock.calls[0][0];
      expect(payload.created_by).toBeUndefined();
      expect(payload.client_id).not.toBe(9999);
    });

    it("POST anónimo con end_time falso calcula inicio + duración del servicio", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(null);
      const { insertMock } = mockAnonymousPostDb({ service: { id: 1, duration: 45 } });

      const response = await POST(
        new Request("http://localhost:3000/api/appointments", {
          method: "POST",
          body: JSON.stringify({
            client: "Pedro",
            barber_id: 1,
            date: "2030-01-01",
            start_time: "10:00",
            end_time: "18:00",
            phone: "1123456789",
            service_id: 1,
          }),
        })
      );

      expect(response.status).toBe(200);
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          start_time: "10:00:00",
          end_time: "10:45:00",
        })
      );
    });

    it("POST anónimo con barbero inactivo → 400", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(null);
      mockAnonymousPostDb({ barber: { id: 1, active: false } });

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

      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe("El profesional elegido no está disponible");
    });

    it("POST anónimo fuera de horario → 400", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(null);
      mockAnonymousPostDb({ hours: { open_time: "09:00", close_time: "18:00", closed_days: [] } });

      const response = await POST(
        new Request("http://localhost:3000/api/appointments", {
          method: "POST",
          body: JSON.stringify({
            client: "Pedro",
            barber_id: 1,
            date: "2030-01-01",
            start_time: "18:00",
            end_time: "18:30",
            phone: "1123456789",
            service_id: 1,
          }),
        })
      );

      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe("El local no atiende en ese horario");
    });

    it("POST anónimo en día cerrado → 400", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(null);
      // 2030-01-06 es domingo (getUTCDay() = 0)
      mockAnonymousPostDb({ hours: { open_time: "09:00", close_time: "20:00", closed_days: [0] } });

      const response = await POST(
        new Request("http://localhost:3000/api/appointments", {
          method: "POST",
          body: JSON.stringify({
            client: "Pedro",
            barber_id: 1,
            date: "2030-01-06",
            start_time: "10:00",
            end_time: "10:30",
            phone: "1123456789",
            service_id: 1,
          }),
        })
      );

      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe("El local no atiende en ese horario");
    });

    it("POST cuyo insert devuelve { code: '23P01' } → 400 con mensaje de solapamiento", async () => {
      vi.mocked(auth.requireBarberOrAdmin).mockResolvedValueOnce(null);
      mockAnonymousPostDb({ insertResult: { data: null, error: { code: "23P01", message: "APPOINTMENT_OVERLAP" } } });

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

      expect(response.status).toBe(400);
      expect((await response.json()).error).toMatch(/coincide o se solapa/i);
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
          data: [{ id: 1, barber_id: 2, service_id: 1, date: "2026-11-20", start_time: "10:00:00", end_time: "10:30:00", type: "appointment" }],
          error: null,
        })
      ),
    };
    vi.mocked(supabaseAdmin.from).mockReturnValueOnce(queryMock as any);

    const response = await GET(
      new Request("http://localhost:3000/api/appointments?date=2026-11-20&phone=%2B5491100000000&client=Ana&barber_id=2")
    );
    const json = await response.json();

    expect(queryMock.select).toHaveBeenCalledWith("id, barber_id, service_id, date, start_time, end_time, type");
    expect(queryMock.eq).not.toHaveBeenCalledWith("phone", expect.anything());
    expect(queryMock.eq).not.toHaveBeenCalledWith("client", expect.anything());
    expect(queryMock.eq).toHaveBeenCalledWith("date", "2026-11-20");
    expect(queryMock.eq).toHaveBeenCalledWith("barber_id", "2");
    expect(json[0].client).toBeUndefined();
    expect(json[0].phone).toBeUndefined();
    expect(json[0].arca_invoice_id).toBeUndefined();
    expect(json[0].arca_invoices).toBeUndefined();
  });
});
