"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { CalendarSkeleton } from "@/components/loading/Skeleton";
import { Barber } from "@/lib/types/Barbers";
import { Service } from "@/lib/types/Services";
import { Appointment } from "@/lib/types/Appointment";
import { useAuth } from "@/lib/auth/AuthContext";
import { CalendarEvent } from "@/lib/types/CalendarEvent";
import { useSelectedBarber } from "@/lib/hooks/useSelectedBarber";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { useTurnosStore } from "@/lib/store/useTurnosStore";
import { useShallow } from "zustand/react/shallow";
import { useFetchOnce } from "@/lib/hooks/useFetchOnce";
import { getServices } from "@/lib/repository/services";
import ServiceSelectionCards from "@/components/turnos/ServiceSelectionCards";
import BarberSelectionCards from "@/components/turnos/BarberSelectionCards";
import { Check } from "lucide-react";

const BookingSplitPanel = dynamic(
  () => import("@/components/turnos/BookingSplitPanel"),
  { ssr: false, loading: () => null }
);

const CustomCalendar = dynamic(() => import("@/components/calendar/CustomCalendar"), {
  ssr: false,
  loading: () => <CalendarSkeleton />,
});

const AppointmentDetailsSplitPanel = dynamic(
  () => import("@/components/turnos/AppointmentDetailsSplitPanel"),
  { ssr: false, loading: () => null }
);

interface Props {
  initialBarbers: Barber[];
  initialServices?: Service[];
}

export default function TurnosClient({ initialBarbers, initialServices }: Readonly<Props>) {
  const { barberId, role } = useAuth();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  // Servicios disponibles
  const { data: fetchedServices = [] } = useFetchOnce<Service[]>("services", getServices);
  const services: Service[] = useMemo(() => {
    if (initialServices && initialServices.length > 0) return initialServices;
    return fetchedServices || [];
  }, [initialServices, fetchedServices]);

  // Manejo de barbero seleccionado
  const { selectedBarberId, selectedBarber, setBarberId } = useSelectedBarber(
    initialBarbers,
    role,
    barberId
  );

  // Servicio seleccionado
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Inicializar servicio desde query param (?service=id_o_slug)
  useEffect(() => {
    const serviceParam = searchParams.get("service");
    if (serviceParam && services.length > 0 && !selectedService) {
      const match = services.find(
        (s) => s.id === Number(serviceParam) || s.name.toLowerCase() === serviceParam.toLowerCase()
      );
      if (match) {
        setSelectedService(match);
        if (role === "guest" && (selectedBarberId === null || selectedBarberId < 0)) {
          setCurrentStep(2);
        }
      }
    }
  }, [searchParams, services, selectedService, role, selectedBarberId]);

  // Paso actual (1: Servicio, 2: Barbero, 3: Calendario & Split-View)
  // Para barberos/admin logueados, inicializar directamente en el calendario (paso 3)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(() => {
    if (role !== "guest") return 3;
    return 1;
  });

  // Asegurar que usuarios logueados (admin/barbero) vean directamente la agenda en el Paso 3
  useEffect(() => {
    if (role !== "guest") {
      setCurrentStep(3);
    }
  }, [role]);

  const {
    isReservarOpen,
    isDetailOpen,
    selectedAppointment,
    selectedDate,
    events,
    calendarRefreshSignal,
    closeReservar,
    openDetail,
    closeDetail,
    triggerCalendarRefresh,
    openReservar,
  } = useTurnosStore(
    useShallow((state) => ({
      isReservarOpen: state.isReservarOpen,
      isDetailOpen: state.isDetailOpen,
      selectedAppointment: state.selectedAppointment,
      selectedDate: state.selectedDate,
      events: state.events,
      calendarRefreshSignal: state.calendarRefreshSignal,
      closeReservar: state.closeReservar,
      openDetail: state.openDetail,
      closeDetail: state.closeDetail,
      triggerCalendarRefresh: state.triggerCalendarRefresh,
      openReservar: state.openReservar,
    }))
  );

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    if (role !== "guest" && selectedBarberId !== null && selectedBarberId >= 0) {
      setCurrentStep(3);
    } else {
      setCurrentStep(2);
    }
  };

  const handleSelectBarber = (barberIdToSet: number) => {
    setBarberId(barberIdToSet);
    setCurrentStep(3);
  };

  const handleSlotClick = useCallback(
    (appt: Appointment, evts: CalendarEvent[]) => {
      // Preservar la fecha y hora seleccionada
      const slotDate = new Date(`${appt.date}T${appt.start_time}:00-03:00`);
      closeDetail();
      openReservar(slotDate, evts);
    },
    [openReservar, closeDetail]
  );

  const handleCloseReservar = useCallback(() => {
    closeReservar();
    if (role !== "guest") {
      setSelectedService(null);
    }
  }, [closeReservar, role]);

  const handleEventClick = useCallback(
    (appt: Appointment) => {
      if (role !== "guest") {
        handleCloseReservar();
        openDetail(appt);
      }
    },
    [role, openDetail, handleCloseReservar]
  );

  const handleAppointmentCreated = () => {
    triggerCalendarRefresh();
  };

  const handleResetFlow = () => {
    handleCloseReservar();
    setSelectedService(null);
    if (role === "guest") {
      setBarberId(-1);
      setCurrentStep(1);
    } else {
      setCurrentStep(3);
    }
  };

  return (
    <div className="p-4 md:p-6 w-full max-w-[1720px] mx-auto min-h-screen">
      {/* Título de la pantalla */}
      <h1 className="text-3xl font-extrabold mb-4 text-center tracking-tight text-[var(--foreground)]">
        Reserva tu turno
      </h1>

      {/* 🌟 Stepper Interactivo Premium */}
      <div className="max-w-xl mx-auto mb-8 mt-2 px-2">
        <div className="flex items-center justify-between relative">
          {/* Línea gris de fondo */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-slate-800 -z-10 rounded-full" />

          {/* Línea dorada de progreso */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-[var(--accent)] transition-all duration-500 ease-out -z-10 rounded-full shadow-[0_0_8px_rgba(223,186,115,0.5)]"
            style={{
              width: currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%",
            }}
          />

          {/* Pasos interactivos */}
          {[
            { stepNum: 1, label: "1. Servicio", canClick: true },
            { stepNum: 2, label: "2. Barbero", canClick: Boolean(selectedService) || role !== "guest" },
            {
              stepNum: 3,
              label: "3. Fecha y Hora",
              canClick: (Boolean(selectedService) && selectedBarberId >= 0) || role !== "guest",
            },
          ].map((s) => {
            const isCompleted = currentStep > s.stepNum;
            const isActive = currentStep === s.stepNum;
            return (
              <button
                key={s.stepNum}
                type="button"
                disabled={!s.canClick}
                onClick={() => {
                  if (s.canClick) setCurrentStep(s.stepNum as 1 | 2 | 3);
                }}
                className={`flex flex-col items-center gap-2 bg-[var(--background)] px-2 transition-transform ${
                  s.canClick ? "cursor-pointer hover:scale-105" : "cursor-not-allowed opacity-60"
                }`}
              >
                <div
                  className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-xs md:text-sm transition-all duration-300 border-2 ${
                    isCompleted
                      ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--background)] shadow-[0_0_15px_rgba(223,186,115,0.4)]"
                      : isActive
                      ? "bg-[var(--background)] border-[var(--accent)] text-[var(--accent)] shadow-[0_0_15px_rgba(223,186,115,0.3)] scale-110"
                      : "bg-[var(--background)] border-slate-700 text-slate-500"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s.stepNum}
                </div>
                <span
                  className={`text-[10px] md:text-xs font-bold tracking-wider uppercase transition-colors duration-300 ${
                    isActive || isCompleted ? "text-[var(--accent)]" : "text-slate-500"
                  }`}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENIDO SEGÚN PASO ACTIVO */}
      <div className="w-full mx-auto">
        {/* PASO 1: Elegir Servicio */}
        {currentStep === 1 && (
          <ServiceSelectionCards
            services={services}
            selectedServiceId={selectedService?.id ?? null}
            onSelectService={handleSelectService}
          />
        )}

        {/* PASO 2: Elegir Barbero */}
        {currentStep === 2 && (
          <BarberSelectionCards
            barbers={initialBarbers}
            selectedBarberId={selectedBarberId}
            onSelectBarber={handleSelectBarber}
            onBack={() => setCurrentStep(1)}
            selectedServiceName={selectedService?.name}
          />
        )}

        {/* PASO 3: Calendario Interactivo con Split-View */}
        {currentStep === 3 && (
          <div className="animate-fade-in">
            {/* Layout Principal: Calendario (Izquierda) + Panel Dinámico (Derecha en Desktop) */}
            <div
              className={`flex flex-col lg:flex-row items-stretch w-full relative transition-all duration-300 ${
                (isReservarOpen || (isDetailOpen && selectedAppointment)) && !isMobile ? "gap-6" : "gap-0"
              }`}
            >
              {/* Columna Izquierda: Calendario interactivo (siempre visible) */}
              <div
                className="w-full transition-all duration-300 ease-out min-w-0 flex flex-col"
                style={{
                  flex: (isReservarOpen || (isDetailOpen && selectedAppointment)) && !isMobile ? "1 1 0%" : "1 1 100%",
                }}
              >
                <div className="bg-[var(--background)] rounded-2xl overflow-hidden shadow-xl border border-[var(--foreground)]/10 h-full">
                  <CustomCalendar
                    key={`cal-${selectedBarberId}`}
                    selectedBarberId={selectedBarberId}
                    barbers={initialBarbers}
                    role={role}
                    isMobile={isMobile}
                    onSlotClick={handleSlotClick}
                    onEventClick={handleEventClick}
                    refreshSignal={calendarRefreshSignal}
                  />
                </div>
              </div>

              {/* Columna Derecha: Panel de Reserva / Detalle en Desktop con deslizamiento suave */}
              {!isMobile && (
                <div
                  className={`transition-all duration-300 ease-out shrink-0 self-stretch ${
                    isReservarOpen || (isDetailOpen && selectedAppointment)
                      ? "w-[400px] xl:w-[440px] opacity-100 translate-x-0 pointer-events-auto"
                      : "w-0 opacity-0 translate-x-8 pointer-events-none overflow-hidden"
                  }`}
                  style={{
                    transitionProperty: "width, opacity, transform",
                  }}
                >
                  <div className="w-[400px] xl:w-[440px] h-full flex flex-col">
                    {isReservarOpen && (
                      <BookingSplitPanel
                        onClose={handleCloseReservar}
                        selectedDate={selectedDate}
                        selectedBarber={selectedBarber?.name || ""}
                        selectedBarberId={selectedBarberId}
                        events={events}
                        barbers={initialBarbers}
                        selectedService={selectedService}
                        onServiceChange={setSelectedService}
                        onSelectAnotherService={() => setCurrentStep(1)}
                        onSelectAnotherBarber={() => setCurrentStep(2)}
                        onResetFlow={handleResetFlow}
                        onAppointmentCreated={handleAppointmentCreated}
                      />
                    )}
                    {isDetailOpen && selectedAppointment && (
                      <AppointmentDetailsSplitPanel
                        key={selectedAppointment.id}
                        onClose={closeDetail}
                        appointment={selectedAppointment}
                        barbers={initialBarbers}
                        onAppointmentChanged={triggerCalendarRefresh}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Sheet Modal para Dispositivos Móviles (< 1024px) */}
            {(isReservarOpen || (isDetailOpen && selectedAppointment)) && isMobile && (
              <>
                {/* Backdrop semi-transparente */}
                <div
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
                  onClick={() => {
                    if (isReservarOpen) handleCloseReservar();
                    if (isDetailOpen) closeDetail();
                  }}
                />
                {/* Drawer que sube desde abajo */}
                <div className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto bg-[var(--bg-carousel)] rounded-t-3xl border-t-2 border-[var(--accent)]/40 shadow-2xl p-4 animate-slide-up">
                  {/* Tirador visual de arrastre */}
                  <div className="w-12 h-1.5 bg-slate-600 rounded-full mx-auto mb-4" />
                  {isReservarOpen && (
                    <BookingSplitPanel
                      onClose={handleCloseReservar}
                      selectedDate={selectedDate}
                      selectedBarber={selectedBarber?.name || ""}
                      selectedBarberId={selectedBarberId}
                      events={events}
                      barbers={initialBarbers}
                      selectedService={selectedService}
                      onServiceChange={setSelectedService}
                      onSelectAnotherService={() => {
                        handleCloseReservar();
                        setCurrentStep(1);
                      }}
                      onSelectAnotherBarber={() => {
                        handleCloseReservar();
                        setCurrentStep(2);
                      }}
                      onResetFlow={handleResetFlow}
                      onAppointmentCreated={handleAppointmentCreated}
                    />
                  )}
                  {isDetailOpen && selectedAppointment && (
                    <AppointmentDetailsSplitPanel
                      key={selectedAppointment.id}
                      onClose={closeDetail}
                      appointment={selectedAppointment}
                      barbers={initialBarbers}
                      onAppointmentChanged={triggerCalendarRefresh}
                      isMobileModal
                    />
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Animaciones CSS locales */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-up {
          animation: slideUp 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
