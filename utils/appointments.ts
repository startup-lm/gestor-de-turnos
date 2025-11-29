import { Appointment } from "@/lib/types/Appointment";
import { CalendarEvent } from "@/lib/types/CalendarEvent";

export function generateAllAppointments() {
  const horarios = [];
  const inicio = 11;
  const fin = 20;

  for (let hora = inicio; hora < fin; hora++) {
    horarios.push(`${hora}:00`);
    horarios.push(`${hora}:15`);
    horarios.push(`${hora}:30`);
    horarios.push(`${hora}:45`);
  }
  return horarios;
};

export const transformAppointmentsToEvents = (appointments: Appointment[],role: string): CalendarEvent[] => {
  return appointments.map(appt => {
    const rawStart = new Date(`${appt.date}T${appt.start_time}`);
    const rawEnd   = new Date(`${appt.date}T${appt.end_time}`);
    const start = new Date(rawStart.getTime() + 60 * 1000);
    const end   = new Date(rawEnd.getTime() - 60 * 1000);

    return {
      id: appt.id,
      title: role === 'guest' ? 'Reservado' : appt.client,
      start,
      end,
      paid: appt.paid,
      isAppt: appt.phone !== "0000000000"
    };
  });
};