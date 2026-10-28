import { describe, it, expect } from "vitest";
import { generateAllAppointments, transformAppointmentsToEvents } from "@/utils/appointments";
import { Appointment } from "@/lib/types/Appointment";

describe("generateAllAppointments", () => {
  it("debe generar horarios con los valores por defecto (10:30 a 20:00 cada 30 min, con corte 14:00-15:00)", () => {
    const slots = generateAllAppointments();

    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0]).toBe("10:30");
    expect(slots).toContain("11:00");
    expect(slots).toContain("13:30");
    // Horario de almuerzo excluido
    expect(slots).not.toContain("14:00");
    expect(slots).not.toContain("14:30");
    // Reanuda a las 15:00
    expect(slots).toContain("15:00");
    // Último slot antes del cierre (20:00)
    expect(slots[slots.length - 1]).toBe("19:30");
  });

  it("debe respetar configuración personalizada de apertura, cierre e intervalos", () => {
    const slots = generateAllAppointments({
      openTime: "09:00",
      closeTime: "11:00",
      stepMinutes: 30,
      breakStart: null,
      breakEnd: null,
    });

    expect(slots).toEqual(["09:00", "09:30", "10:00", "10:30"]);
  });

  it("debe devolver un arreglo vacío si stepMinutes es menor o igual a cero", () => {
    expect(generateAllAppointments({ stepMinutes: 0 })).toEqual([]);
    expect(generateAllAppointments({ stepMinutes: -15 })).toEqual([]);
  });

  it("debe devolver un arreglo vacío si el horario de cierre es menor o igual al de apertura", () => {
    expect(generateAllAppointments({ openTime: "18:00", closeTime: "10:00" })).toEqual([]);
    expect(generateAllAppointments({ openTime: "10:00", closeTime: "10:00" })).toEqual([]);
  });

  it("debe devolver un arreglo vacío si los horarios no tienen formato válido", () => {
    expect(generateAllAppointments({ openTime: "invalido", closeTime: "20:00" })).toEqual([]);
  });
});

describe("transformAppointmentsToEvents", () => {
  const mockAppointments: Appointment[] = [
    {
      id: 1,
      client: "Juan Pérez",
      phone: "+5491122334455",
      date: "2026-10-30",
      start_time: "14:00",
      end_time: "14:30",
      barber_id: 2,
      service_id: 1,
      paid: true,
      price: 15000,
    },
    {
      id: 2,
      client: "Bloqueo Almuerzo",
      phone: "0000000000",
      date: "2026-10-30",
      start_time: "13:00",
      end_time: "14:00",
      barber_id: 2,
      service_id: 1,
      paid: false,
      price: 0,
    },
  ];

  it("debe enmascarar el nombre del cliente con 'Reservado' para rol 'guest'", () => {
    const events = transformAppointmentsToEvents(mockAppointments, "guest");

    expect(events[0].title).toBe("Reservado");
    expect(events[1].title).toBe("Reservado");
  });

  it("debe mostrar el nombre real del cliente para rol 'admin' o 'barber'", () => {
    const adminEvents = transformAppointmentsToEvents(mockAppointments, "admin");
    const barberEvents = transformAppointmentsToEvents(mockAppointments, "barber");

    expect(adminEvents[0].title).toBe("Juan Pérez");
    expect(barberEvents[0].title).toBe("Juan Pérez");
  });

  it("debe identificar correctamente si es un turno de cliente o un bloqueo", () => {
    const events = transformAppointmentsToEvents(mockAppointments, "admin");

    expect(events[0].isAppt).toBe(true);
    expect(events[1].isAppt).toBe(false); // phone === '0000000000'
  });

  it("debe aplicar el margen de 1 minuto para visualización en el calendario", () => {
    const events = transformAppointmentsToEvents(mockAppointments, "admin");

    const expectedStart = new Date("2026-10-30T14:01:00");
    const expectedEnd = new Date("2026-10-30T14:29:00");

    expect(events[0].start.getTime()).toBe(expectedStart.getTime());
    expect(events[0].end.getTime()).toBe(expectedEnd.getTime());
  });
});
