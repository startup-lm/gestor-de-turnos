"use client";

import dynamic from "next/dynamic";
import Spinner from "@/components/loading/Spinner";
import { Barber } from "@/lib/types/Barbers";
import { Appointment } from "@/lib/types/Appointment";
import { useAuth } from "@/lib/auth/AuthContext";
import BarberCheckbox from "@/components/turnos/BarberCheckbox";
import { CalendarEvent } from "@/lib/types/CalendarEvent";
import { useSelectedBarber } from "@/lib/hooks/useSelectedBarber";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { useTurnosStore } from "@/lib/store/useTurnosStore";

const CustomCalendar = dynamic(() => import("@/components/calendar/CustomCalendar"), {
  ssr: false,
  loading: () => (<div className="h-96 flex items-center justify-center"><Spinner /></div>)
});
const ReservarModal = dynamic(() => import("@/components/turnos/ReservarModal"), { ssr: false, loading: () => null });
const AppointmentDetailsModal = dynamic(() => import("@/components/turnos/AppointmentDetailsModal"), { ssr: false, loading: () => null });

interface Props {
  initialBarbers: Barber[];
}

export default function TurnosClient({ initialBarbers }: Readonly<Props>) {
  const { barberId, role } = useAuth();
  const { selectedBarberId, selectedBarber, setBarberId } = useSelectedBarber(initialBarbers, role, barberId);
  const isMobile = useIsMobile();

  const {
    isReservarOpen, isDetailOpen, selectedAppointment, selectedDate, events, calendarRefreshSignal,
    openReservar, closeReservar, openDetail, closeDetail, triggerCalendarRefresh
  } = useTurnosStore();

  const handleSlotClick = (appt: Appointment, evts: CalendarEvent[]) => {
    openReservar(new Date(`${appt.date}T${appt.start_time}:00-03:00`), evts);
  };

  const handleEventClick = (appt: Appointment) => {
    if (role !== "guest") {
      openDetail(appt);
    }
  };

  const handleAppointmentCreated = () => {
    triggerCalendarRefresh();
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-5 text-center">Reserva tu turno</h1>

      <div className="w-4/5 mx-auto">
        <div className="flex flex-col items-center mb-6 relative">
          <h2 className="mb-3 text-center">
            {role === "guest" ? "¿Con quién te querés cortar?" : "Elegí el barbero para ver sus turnos"}
          </h2>
          <BarberCheckbox
            barbers={initialBarbers}
            selectedBarberId={selectedBarberId}
            onChange={setBarberId}
          />
        </div>

        <div className={selectedBarberId < 0 ? "opacity-50 pointer-events-none" : ""}>
          <CustomCalendar
            key={`cal-${selectedBarberId}`}
            selectedBarberId={selectedBarberId}
            role={role}
            isMobile={isMobile}
            onSlotClick={handleSlotClick}
            onEventClick={handleEventClick}
            refreshSignal={calendarRefreshSignal}
          />
        </div>

        {isReservarOpen && (
          <ReservarModal
            onClose={closeReservar}
            selectedDate={selectedDate}
            selectedBarber={selectedBarber?.name || ""}
            selectedBarberId={selectedBarberId}
            events={events}
            onAppointmentCreated={handleAppointmentCreated}
          />
        )}

        {isDetailOpen && selectedAppointment && (
          <AppointmentDetailsModal
            onClose={closeDetail}
            appointment={selectedAppointment}
            barbers={initialBarbers}
          />
        )}
      </div>
    </div>
  );
}
