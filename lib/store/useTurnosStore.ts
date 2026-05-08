import { create } from "zustand";
import { Appointment } from "@/lib/types/Appointment";
import { CalendarEvent } from "@/lib/types/CalendarEvent";

interface TurnosState {
  isReservarOpen: boolean;
  isDetailOpen: boolean;
  selectedAppointment: Appointment | null;
  selectedDate: Date;
  events: CalendarEvent[];
  calendarRefreshSignal: number;

  openReservar: (date: Date, evts: CalendarEvent[]) => void;
  closeReservar: () => void;
  
  openDetail: (appointment: Appointment) => void;
  closeDetail: () => void;

  triggerCalendarRefresh: () => void;
}

export const useTurnosStore = create<TurnosState>((set) => ({
  isReservarOpen: false,
  isDetailOpen: false,
  selectedAppointment: null,
  selectedDate: new Date(),
  events: [],
  calendarRefreshSignal: 0,

  openReservar: (date, evts) => set({ isReservarOpen: true, selectedDate: date, events: evts }),
  closeReservar: () => set({ isReservarOpen: false }),
  
  openDetail: (appointment) => set({ isDetailOpen: true, selectedAppointment: appointment }),
  closeDetail: () => set({ isDetailOpen: false, selectedAppointment: null }),

  triggerCalendarRefresh: () => set((state) => ({ calendarRefreshSignal: state.calendarRefreshSignal + 1 })),
}));
