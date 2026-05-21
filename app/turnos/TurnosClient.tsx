"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Spinner from "@/components/loading/Spinner";
import { CalendarSkeleton } from "@/components/loading/Skeleton";
import { Barber } from "@/lib/types/Barbers";
import { Appointment } from "@/lib/types/Appointment";
import { useAuth } from "@/lib/auth/AuthContext";
import BarberCheckbox from "@/components/turnos/BarberCheckbox";
import { CalendarEvent } from "@/lib/types/CalendarEvent";
import { useSelectedBarber } from "@/lib/hooks/useSelectedBarber";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { useTurnosStore } from "@/lib/store/useTurnosStore";
import logo from "@/public/images/logo.png";

const CustomCalendar = dynamic(() => import("@/components/calendar/CustomCalendar"), {
  ssr: false,
  loading: () => <CalendarSkeleton />
});
const ReservarInlineCard = dynamic(() => import("@/components/turnos/ReservarInlineCard"), {
  ssr: false,
  loading: () => <div className="flex justify-center py-10"><Spinner /></div>
});
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
    closeReservar, openDetail, closeDetail, triggerCalendarRefresh, openReservar
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

  // Determinar paso activo derivándolo de los estados actuales
  const isBarberSelected = selectedBarberId !== null && selectedBarberId >= 0;
  const activeStep = isReservarOpen ? 3 : isBarberSelected ? 2 : 1;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto min-h-screen">
      {/* Título de la pantalla estandarizado */}
      <h1 className="text-3xl font-bold mb-5 text-center">Reserva tu turno</h1>

      {/* 🌟 Stepper de Progreso Premium */}
      <div className="max-w-xl mx-auto mb-10 mt-2 px-2">
        <div className="flex items-center justify-between relative">
          {/* Línea gris de fondo */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-slate-800 -z-10 rounded-full" />
          
          {/* Línea dorada de progreso */}
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-[var(--accent)] transition-all duration-500 ease-out -z-10 rounded-full shadow-[0_0_8px_rgba(223,186,115,0.5)]" 
            style={{ width: activeStep === 1 ? "0%" : activeStep === 2 ? "50%" : "100%" }}
          />

          {/* Pasos */}
          {[
            { stepNum: 1, label: "Elegí Barbero" },
            { stepNum: 2, label: "Seleccioná Fecha" },
            { stepNum: 3, label: "Completá Datos" }
          ].map((s) => {
            const isCompleted = activeStep > s.stepNum;
            const isActive = activeStep === s.stepNum;
            return (
              <div key={s.stepNum} className="flex flex-col items-center gap-2 bg-[var(--background)] px-2">
                <div 
                  className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-xs md:text-sm transition-all duration-500 border-2 ${
                    isCompleted 
                      ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--background)] shadow-[0_0_15px_rgba(223,186,115,0.4)] scale-100" 
                      : isActive
                      ? "bg-[var(--background)] border-[var(--accent)] text-[var(--accent)] shadow-[0_0_15px_rgba(223,186,115,0.3)] scale-110"
                      : "bg-[var(--background)] border-slate-700 text-slate-500 scale-90"
                  }`}
                >
                  {isCompleted ? "✓" : s.stepNum}
                </div>
                <span 
                  className={`text-[9px] md:text-xs font-semibold tracking-wider uppercase transition-colors duration-300 ${
                    isActive || isCompleted ? "text-[var(--accent)]" : "text-slate-500"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full mx-auto">
        
        {/* RUTA DE PASOS EN PANTALLA */}
        {activeStep === 1 && (
          /* PASO 1: Selector de Profesional */
          <div className="max-w-6xl mx-auto w-full md:w-11/12 lg:w-4/5">
            <div 
              className="flex flex-col items-center mb-6 animate-fade-in-up"
              style={{ animation: "fadeInUp 400ms ease-out forwards" }}
            >
              <h2 className="mb-6 text-center text-lg font-medium text-[var(--foreground)]/80 tracking-wide">
                {role === "guest" ? "¿Con quién te querés cortar?" : "Elegí el barbero para ver sus turnos"}
              </h2>
              <BarberCheckbox
                barbers={initialBarbers}
                selectedBarberId={selectedBarberId}
                onChange={setBarberId}
              />

              {/* Placeholder de agenda vacía */}
              <div className="w-full bg-[var(--bg-carousel)] border border-[var(--foreground)]/5 rounded-2xl p-10 flex flex-col items-center text-center shadow-lg mt-8">
                <div className="w-16 h-16 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mb-4 border border-[var(--accent)]/20 animate-pulse">
                  <span className="text-2xl text-[var(--accent)]">💈</span>
                </div>
                <h3 className="text-lg font-bold mb-2 text-[var(--foreground)]">Elegí tu Profesional</h3>
                <p className="text-sm text-[var(--foreground)]/50 max-w-sm">
                  Seleccioná uno de nuestros barberos especializados arriba para cargar su agenda interactiva y elegir tu horario de preferencia.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeStep === 2 && (
          /* PASO 2: Calendario Activo */
          <div 
            className="space-y-4 animate-fade-in-up"
            style={{ animation: "fadeInUp 400ms ease-out forwards" }}
          >
            {/* Header del profesional seleccionado */}
            <div className="flex flex-row justify-between items-center bg-[var(--bg-carousel)] border border-[var(--foreground)]/5 rounded-2xl p-4 shadow-md gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full ring-2 ring-[var(--accent)]/30 overflow-hidden shadow-inner flex-shrink-0">
                  <Image 
                    src={selectedBarber?.image || logo} 
                    alt={selectedBarber?.name || "Barbero"}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full bg-[var(--background)]"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--foreground)]/40 font-semibold uppercase tracking-wider">Profesional Seleccionado</p>
                  <h4 className="text-base md:text-lg font-bold text-[var(--accent)] leading-snug">{selectedBarber?.name}</h4>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setBarberId(-1)}
                className="text-[10px] md:text-xs font-bold px-4 py-2.5 rounded-xl border border-[var(--accent)]/25 text-[var(--accent)] bg-[var(--accent)]/5 hover:bg-[var(--accent)]/15 transition-all duration-200 active:scale-95 shadow-md flex items-center gap-1.5"
              >
                ← Cambiar Profesional
              </button>
            </div>

            {/* Contenedor del Calendario */}
            <div className="bg-[var(--background)] rounded-2xl overflow-hidden shadow-xl border border-[var(--foreground)]/5">
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
          </div>
        )}

        {activeStep === 3 && (
          /* PASO 3: Formulario de Confirmación Inline */
          <div className="max-w-6xl mx-auto w-full md:w-11/12 lg:w-4/5">
            <ReservarInlineCard
              onClose={closeReservar}
              selectedDate={selectedDate}
              selectedBarber={selectedBarber?.name || ""}
              selectedBarberId={selectedBarberId}
              events={events}
              onAppointmentCreated={handleAppointmentCreated}
            />
          </div>
        )}

        {/* Modal de Detalles de Turno (Admin/Barbero) */}
        {isDetailOpen && selectedAppointment && (
          <AppointmentDetailsModal
            onClose={closeDetail}
            appointment={selectedAppointment}
            barbers={initialBarbers}
          />
        )}
      </div>

      {/* Estilos CSS locales para transiciones fluidas */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
