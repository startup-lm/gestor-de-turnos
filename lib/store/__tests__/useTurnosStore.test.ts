/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from "vitest";
import { useTurnosStore } from "@/lib/store/useTurnosStore";

describe("useTurnosStore", () => {
  beforeEach(() => {
    useTurnosStore.setState({
      isReservarOpen: false,
      isDetailOpen: false,
      selectedAppointment: null,
      events: [],
      calendarRefreshSignal: 0,
    });
  });

  it("debe abrir el panel de reserva con la fecha y eventos especificados", () => {
    const testDate = new Date("2026-11-01T12:00:00");
    const mockEvents = [{ id: 1, title: "Reservado", start: testDate, end: testDate }];

    useTurnosStore.getState().openReservar(testDate, mockEvents as any);

    const state = useTurnosStore.getState();
    expect(state.isReservarOpen).toBe(true);
    expect(state.selectedDate).toBe(testDate);
    expect(state.events).toEqual(mockEvents);
  });

  it("debe cerrar el panel de reserva", () => {
    useTurnosStore.setState({ isReservarOpen: true });
    useTurnosStore.getState().closeReservar();
    expect(useTurnosStore.getState().isReservarOpen).toBe(false);
  });

  it("debe abrir y cerrar el detalle del turno seleccionado", () => {
    const mockAppt = { id: 10, client: "Mateo" } as any;

    useTurnosStore.getState().openDetail(mockAppt);
    expect(useTurnosStore.getState().isDetailOpen).toBe(true);
    expect(useTurnosStore.getState().selectedAppointment).toEqual(mockAppt);

    useTurnosStore.getState().closeDetail();
    expect(useTurnosStore.getState().isDetailOpen).toBe(false);
    expect(useTurnosStore.getState().selectedAppointment).toBeNull();
  });

  it("debe incrementar la señal de refresco del calendario", () => {
    expect(useTurnosStore.getState().calendarRefreshSignal).toBe(0);
    useTurnosStore.getState().triggerCalendarRefresh();
    expect(useTurnosStore.getState().calendarRefreshSignal).toBe(1);
    useTurnosStore.getState().triggerCalendarRefresh();
    expect(useTurnosStore.getState().calendarRefreshSignal).toBe(2);
  });
});
