import { describe, it, expect } from "vitest";
import {
  AppointmentInsertSchema,
  AppointmentPatchSchema,
  AppointmentDeleteSchema,
  ClientUpsertSchema,
} from "@/lib/schemas";

describe("AppointmentInsertSchema", () => {
  it("debe validar exitosamente un turno estándar con datos correctos", () => {
    const validData = {
      client: "Carlos Gómez",
      barber_id: 1,
      date: "2026-11-15",
      start_time: "10:30",
      end_time: "11:00",
      phone: "1123456789",
      service_id: 2,
    };

    const result = AppointmentInsertSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("appointment"); // default
    }
  });

  it("debe aceptar un turno de tipo bloqueo con teléfono especial", () => {
    const blockData = {
      client: "Bloqueo Almuerzo",
      barber_id: 1,
      date: "2026-11-15",
      start_time: "14:00",
      end_time: "15:00",
      phone: "0000000000",
      service_id: 1,
      type: "block",
    };

    const result = AppointmentInsertSchema.safeParse(blockData);
    expect(result.success).toBe(true);
  });

  it("debe fallar si el nombre del cliente está vacío", () => {
    const invalidData = {
      client: "",
      barber_id: 1,
      date: "2026-11-15",
      start_time: "10:30",
      end_time: "11:00",
      service_id: 1,
    };

    const result = AppointmentInsertSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("debe fallar si la fecha o las horas tienen un formato incorrecto", () => {
    const invalidDate = {
      client: "Test",
      barber_id: 1,
      date: "15/11/2026", // Incorrecto (no es YYYY-MM-DD)
      start_time: "10:30",
      end_time: "11:00",
      service_id: 1,
    };

    expect(AppointmentInsertSchema.safeParse(invalidDate).success).toBe(false);

    const invalidTime = {
      client: "Test",
      barber_id: 1,
      date: "2026-11-15",
      start_time: "10h30", // Incorrecto (no es HH:mm)
      end_time: "11:00",
      service_id: 1,
    };

    expect(AppointmentInsertSchema.safeParse(invalidTime).success).toBe(false);
  });

  it("debe fallar si el teléfono no es válido según las reglas de telecomunicaciones", () => {
    const invalidPhone = {
      client: "Test",
      barber_id: 1,
      date: "2026-11-15",
      start_time: "10:30",
      end_time: "11:00",
      phone: "12345", // Muy corto
      service_id: 1,
    };

    expect(AppointmentInsertSchema.safeParse(invalidPhone).success).toBe(false);
  });
});

describe("AppointmentPatchSchema", () => {
  it("acepta un cobro con cualquier medio de pago configurado", () => {
    const result = AppointmentPatchSchema.safeParse({
      appointmentId: 45,
      updates: { paid: true, price: 12000, payment_method: "Transferencia" },
    });
    expect(result.success).toBe(true);
  });

  it("descarta los campos que no se pueden editar desde el navegador", () => {
    const result = AppointmentPatchSchema.safeParse({
      appointmentId: 45,
      updates: { client: "Ana", deleted_at: "2026-01-01", arca_invoice_id: 9, created_by: "x" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.updates).toEqual({ client: "Ana" });
    }
  });

  it("rechaza precio negativo o ID inválido", () => {
    expect(AppointmentPatchSchema.safeParse({ appointmentId: -1, updates: {} }).success).toBe(false);
    expect(
      AppointmentPatchSchema.safeParse({ appointmentId: 10, updates: { price: -500 } }).success
    ).toBe(false);
  });
});

describe("AppointmentDeleteSchema y ClientUpsertSchema", () => {
  it("debe validar AppointmentDeleteSchema", () => {
    expect(AppointmentDeleteSchema.safeParse({ id: 10, deleted_by: "Admin" }).success).toBe(true);
    expect(AppointmentDeleteSchema.safeParse({ id: 0 }).success).toBe(false);
  });

  it("debe validar ClientUpsertSchema con teléfono normalizable", () => {
    expect(
      ClientUpsertSchema.safeParse({
        name: "Martín Fierro",
        phone: "11 2345 6789",
      }).success
    ).toBe(true);

    expect(
      ClientUpsertSchema.safeParse({
        name: "",
        phone: "1123456789",
      }).success
    ).toBe(false);
  });
});
