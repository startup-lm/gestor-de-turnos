"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Spinner from "@/components/loading/Spinner";
import { Barber } from "@/lib/types/Barbers";
import { Appointment } from "@/lib/types/Appointment";
import { useAuth } from "@/lib/auth/AuthContext";
import BarberCheckbox from "@/components/turnos/BarberCheckbox";
import { CalendarEvent } from "@/lib/types/CalendarEvent";

const CustomCalendar = dynamic(() => import("@/components/calendar/CustomCalendar"), { ssr: false, loading: () => (<div className="h-96 flex items-center justify-center"><Spinner /></div>), });
const ReservarModal = dynamic(() => import("@/components/turnos/ReservarModal"), { ssr: false, loading: () => null });
const AppointmentDetailsModal = dynamic(() => import("@/components/turnos/AppointmentDetailsModal"), { ssr: false, loading: () => null });

interface Props {
  initialBarbers: Barber[];
}

export default function TurnosClient({ initialBarbers }: Readonly<Props>) {
  const { barberId, role } = useAuth();
  const [selectedBarberId, setSelectedBarberId] = useState(barberId);
  const [isReservarOpen, setIsReservarOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const handleSlotClick = (appt: Appointment, events: CalendarEvent[]) => {
    setSelectedDate(new Date(`${appt.date}T${appt.start_time}:00-03:00`));
    setEvents(events);
    setIsReservarOpen(true);
  };

  const handleEventClick = (appt: Appointment) => {
    if (role !== "guest") {
      setSelectedAppointment(appt);
      setIsDetailOpen(true);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-5 text-center">Reserva tu turno</h1>

      <div className="w-4/5 mx-auto">
        <div className="flex flex-col items-center mb-6">
          <h2 className="mb-3 text-center">
            {role === "guest" ? "¿Con quién te querés cortar?" : "Elegí el barbero para ver sus turnos"}
          </h2>
          <BarberCheckbox
            barbers={initialBarbers}
            selectedBarberId={selectedBarberId}
            onChange={setSelectedBarberId}
          />
        </div>


        <div className={selectedBarberId < 0 ? "opacity-50 pointer-events-none" : ""} >
          <div className="sm:hidden">
            <CustomCalendar
              selectedBarberId={selectedBarberId}
              role={role}
              isMobile={true}
              onSlotClick={handleSlotClick}
              onEventClick={handleEventClick}
            />
          </div>
          <div className="hidden sm:block">
            <CustomCalendar
              selectedBarberId={selectedBarberId}
              role={role}
              isMobile={false}
              onSlotClick={handleSlotClick}
              onEventClick={handleEventClick}
            />
          </div>
        </div>

        {isReservarOpen && (
          <ReservarModal
            onClose={() => setIsReservarOpen(false)}
            selectedDate={selectedDate}
            selectedBarber={
              initialBarbers.find((b) => b.id === selectedBarberId)?.name || ""
            }
            selectedBarberId={selectedBarberId}
            events={events}
          />
        )}

        {isDetailOpen && selectedAppointment && (
          <AppointmentDetailsModal
            onClose={() => setIsDetailOpen(false)}
            appointment={selectedAppointment}
            barbers={initialBarbers}
          />
        )}
      </div>
    </div>
  );
}
