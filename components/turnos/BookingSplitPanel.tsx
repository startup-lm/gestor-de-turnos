"use client";

import React from "react";
import Image from "next/image";
import logo from "@/public/images/logo.png";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, User, Clock, Scissors, X, CheckCircle, ArrowRight, RotateCcw, AlertCircle } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Service } from "@/lib/types/Services";
import { Barber } from "@/lib/types/Barbers";
import { CalendarEvent } from "@/lib/types/CalendarEvent";
import { useReservarLogic } from "@/lib/hooks/useReservarLogic";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { sendConfirmAppointment } from "@/utils/whatsapp";
import ClientAutocompleteFields from "./ClientAutocompleteFields";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import PopupModal from "@/components/ui/PopupModal";

interface Props {
  onClose: () => void;
  selectedDate: Date;
  selectedBarber: string;
  selectedBarberId: number;
  events: CalendarEvent[];
  onAppointmentCreated?: () => void;
  barbers?: Barber[];
  selectedService?: Service | null;
  onSelectAnotherService?: () => void;
  onSelectAnotherBarber?: () => void;
  onResetFlow?: () => void;
  onServiceChange?: (service: Service | null) => void;
  isMobileModal?: boolean;
}

export default function BookingSplitPanel({
  onClose,
  selectedDate,
  selectedBarber,
  selectedBarberId,
  events,
  onAppointmentCreated,
  barbers,
  selectedService,
  onSelectAnotherService,
  onSelectAnotherBarber,
  onResetFlow,
  onServiceChange,
  isMobileModal = false,
}: Readonly<Props>) {
  const {
    isGuest,
    services,
    selectedServiceId,
    name,
    setName,
    phone,
    setPhone,
    loading,
    appointmentId,
    showWhatsapp,
    bienvenidaName,
    isDisabled,
    popup,
    handleReservar,
    assignedBarber,
  } = useReservarLogic(
    selectedDate,
    selectedBarber,
    selectedBarberId,
    events,
    onAppointmentCreated,
    barbers,
    selectedService?.id
  );

  const { businessSettings } = useBusinessContext();
  const safeServices = services || [];

  const currentService =
    safeServices.find((s) => s.id === selectedServiceId) ||
    selectedService ||
    null;

  const assignedBarberObj = barbers?.find(
    (b) =>
      b.id === (assignedBarber?.id ?? selectedBarberId) ||
      (selectedBarber && b.name === selectedBarber)
  );
  const barberImage = assignedBarberObj?.image;

  const isValidServiceImage = Boolean(
    currentService?.image &&
    currentService.image !== "null" &&
    currentService.image !== ""
  );

  const isValidBarberImage = Boolean(
    barberImage &&
    barberImage !== "null" &&
    barberImage !== ""
  );

  const hasAssignedOrSelectedBarber = Boolean(
    assignedBarber?.name || (selectedBarberId !== 0 && selectedBarber)
  );

  const duration = currentService?.duration || 30;
  const endDate = new Date(selectedDate);
  endDate.setMinutes(endDate.getMinutes() + duration);
  const startTimeStr = selectedDate.toTimeString().slice(0, 5);
  const endTimeStr = endDate.toTimeString().slice(0, 5);
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
  const formattedDate = `${capitalize(format(selectedDate, "EEEE", { locale: es }))} ${format(selectedDate, "d")} de ${capitalize(format(selectedDate, "MMMM", { locale: es }))}`;

  const handleWhatsapp = () => {
    sendConfirmAppointment(
      appointmentId,
      selectedDate,
      startTimeStr,
      name,
      businessSettings?.phone
    );
  };

  // VISTA: Si la reserva fue confirmada exitosamente (Ticket)
  if (appointmentId > 0 && showWhatsapp) {
    return (
      <div className="bg-[var(--bg-carousel)] border border-[var(--accent)]/30 rounded-3xl p-6 md:p-7 shadow-2xl flex flex-col justify-between h-full overflow-y-auto">
        <div className="space-y-6 flex-1 flex flex-col justify-around py-2">
          <div className="flex items-center justify-between border-b border-[var(--foreground)]/10 pb-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-extrabold text-sm tracking-wide uppercase">
                ¡Turno Confirmado!
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center py-2">
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-[var(--accent)] bg-[var(--accent)]/15 px-3 py-1 rounded-full mb-3 border border-[var(--accent)]/30">
              Comprobante #{appointmentId}
            </span>
            <h3 className="text-2xl font-black text-[var(--foreground)]">
              {bienvenidaName ? `¡Te esperamos, ${bienvenidaName}!` : "¡Todo listo para tu corte!"}
            </h3>
            <p className="text-xs text-[var(--foreground)]/60 mt-1">
              Guardamos tu lugar en la agenda. Podés enviar la confirmación a la barbería por WhatsApp.
            </p>
          </div>

          {/* Ticket Card */}
          <div className="bg-[var(--background)] border border-[var(--foreground)]/10 rounded-2xl p-5 space-y-3.5 shadow-inner">
            <div className="flex justify-between items-center text-xs pb-2 border-b border-[var(--foreground)]/5">
              <span className="text-[var(--foreground)]/50 font-medium">Servicio</span>
              <span className="font-bold text-[var(--foreground)]">{currentService?.name || "Servicio"}</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-2 border-b border-[var(--foreground)]/5">
              <span className="text-[var(--foreground)]/50 font-medium">Profesional</span>
              <span className="font-bold text-[var(--accent)]">{assignedBarber?.name}</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-2 border-b border-[var(--foreground)]/5">
              <span className="text-[var(--foreground)]/50 font-medium">Fecha</span>
              <span className="font-bold text-[var(--foreground)]">{formattedDate}</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-2 border-b border-[var(--foreground)]/5">
              <span className="text-[var(--foreground)]/50 font-medium">Horario</span>
              <span className="font-bold text-[var(--accent)]">{startTimeStr} a {endTimeStr} hs</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--foreground)]/50 font-medium">Precio Total</span>
              <span className="font-extrabold text-base text-[var(--accent)]">
                ${currentService?.price?.toLocaleString("es-AR")}
              </span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="space-y-3 pt-6 mt-auto border-t border-[var(--foreground)]/10">
          <button
            type="button"
            onClick={handleWhatsapp}
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 font-extrabold py-3.5 px-4 rounded-xl shadow-lg shadow-[#25D366]/20 transition-all active:scale-95 text-sm"
          >
            <FaWhatsapp className="w-5 h-5 text-slate-950" />
            <span>Confirmar turno</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onResetFlow) onResetFlow();
              else onClose();
            }}
            className="w-full flex items-center justify-center gap-2 bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)]/80 font-bold py-3 px-4 rounded-xl transition-all text-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reservar otro turno</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-carousel)] border border-[var(--foreground)]/10 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col justify-between h-full overflow-y-auto gap-4">
      <div className="space-y-4">
        {/* Header con botón cerrar */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--foreground)]/10">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] block">
              Paso 3 de 3
            </span>
            <h3 className="text-xl md:text-2xl font-black text-[var(--foreground)] tracking-tight">
              Confirmá tu turno
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel de reserva"
            className="p-1.5 rounded-full bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resumen del Turno con mayor presencia */}
        <div className="bg-[var(--background)]/60 border border-[var(--foreground)]/10 rounded-2xl p-5 space-y-4 shadow-inner">
          {/* Servicio */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              {currentService ? (
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-[var(--accent)]/30 bg-[var(--background)] shadow-md">
                  <Image
                    src={isValidServiceImage ? currentService.image : logo}
                    alt={currentService.name}
                    fill
                    sizes="56px"
                    className="object-cover bg-[var(--background)]"
                  />
                </div>
              ) : (
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-amber-500/15 border border-amber-500/30 text-amber-400"
                >
                  <Scissors className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0">
                <span className="block text-[11px] uppercase font-bold text-[var(--foreground)]/50 tracking-wider">
                  Servicio
                </span>
                {currentService ? (
                  <>
                    <span className="font-extrabold text-base md:text-lg text-[var(--foreground)] truncate block leading-tight">
                      {currentService.name}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm md:text-base font-black text-[var(--accent)]">
                        ${currentService.price?.toLocaleString("es-AR")}
                      </span>
                      <span className="text-[11px] text-[var(--foreground)]/60 font-semibold bg-[var(--foreground)]/5 px-2 py-0.5 rounded-md border border-[var(--foreground)]/10">
                        {duration} min
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Pendiente de selección
                    </span>
                  </div>
                )}
              </div>
            </div>
            {onSelectAnotherService && (
              <button
                type="button"
                onClick={onSelectAnotherService}
                className="text-xs font-bold text-[var(--accent)] hover:underline shrink-0 px-2.5 py-1.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-all"
              >
                {currentService ? "Cambiar" : "Seleccionar"}
              </button>
            )}
          </div>

          {/* Barbero */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--foreground)]/10">
            <div className="flex items-center gap-3.5 min-w-0">
              {hasAssignedOrSelectedBarber ? (
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-[var(--accent)]/30 bg-[var(--background)] shadow-md">
                  <Image
                    src={isValidBarberImage && barberImage ? barberImage : logo}
                    alt={assignedBarber?.name || selectedBarber || "Profesional"}
                    fill
                    sizes="56px"
                    className="object-cover bg-[var(--background)]"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] shrink-0">
                  <Scissors className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0">
                <span className="block text-[11px] uppercase font-bold text-[var(--foreground)]/50 tracking-wider">
                  Profesional
                </span>
                <span className="font-extrabold text-base md:text-lg text-[var(--foreground)] truncate block leading-tight">
                  {assignedBarber?.name || (selectedBarberId === 0 ? "Asignación automática" : selectedBarber)}
                </span>
                <span className="text-[11px] text-[var(--foreground)]/60 font-medium block mt-0.5">
                  {selectedBarberId === 0 ? "Barbero asignado automáticamente" : ""}
                </span>
              </div>
            </div>
            {onSelectAnotherBarber && (
              <button
                type="button"
                onClick={onSelectAnotherBarber}
                className="text-xs font-bold text-[var(--accent)] hover:underline shrink-0 px-2.5 py-1.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-all"
              >
                Cambiar
              </button>
            )}
          </div>

          {/* Horario y Fecha */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--foreground)]/10">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] shrink-0 shadow-md">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] uppercase font-bold text-[var(--foreground)]/50 tracking-wider">
                  Fecha y Horario
                </span>
                <span className="font-extrabold text-base md:text-lg text-[var(--foreground)] block leading-tight">
                  {formattedDate}
                </span>
                <span className="block text-sm md:text-base font-black text-[var(--accent)] mt-0.5">
                  {startTimeStr} {currentService ? `a ${endTimeStr} hs (${duration} min)` : "hs (duración a definir)"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-[var(--foreground)]/50 italic text-center py-0.5">
          💡 Podés tocar cualquier otro casillero en el calendario para cambiar de horario.
        </p>

        {/* Saludo si es cliente recurrente */}
        {bienvenidaName && (
          <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-xl p-3 text-xs text-[var(--accent)] font-semibold flex items-center gap-2">
            <span>✨</span>
            <span>¡Hola de nuevo, {bienvenidaName}! Completamos tus datos guardados.</span>
          </div>
        )}
      </div>

      {/* SECCIÓN 2: Completá tus datos (Contenedor con el mismo estilo del resumen) */}
      <form
        id="form-reservar-split"
        onSubmit={handleReservar}
        className="bg-[var(--background)]/60 border border-[var(--foreground)]/10 rounded-2xl p-5 space-y-4 shadow-inner"
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-[var(--foreground)]/10">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] block">
              {!isGuest ? "Gestión" : "Paso final"}
            </span>
            <h4 className="text-base font-extrabold text-[var(--foreground)] tracking-tight">
              {!isGuest ? "Datos del Cliente" : "Completá tus datos"}
            </h4>
          </div>
        </div>

        {!isGuest ? (
          <div className="space-y-4">
            <ClientAutocompleteFields
              name={name}
              phone={phone}
              onNameChange={setName}
              onPhoneChange={setPhone}
              onClientResolved={() => {}}
            />
          </div>
        ) : (
          <div className="space-y-3.5">
            <div>
              <label
                htmlFor="reservar-guest-name"
                className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Nombre y Apellido
              </label>
              <input
                id="reservar-guest-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ej: Juan Pérez"
                className="!bg-[var(--background)] !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl p-3 w-full block text-sm shadow-inner"
              />
            </div>

            <div>
              <label
                htmlFor="reservar-guest-phone"
                className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Número de Celular
              </label>
              <PhoneInput
                id="reservar-guest-phone"
                defaultCountry="AR"
                value={phone}
                onChange={(value) => setPhone(value || "")}
                required={isGuest}
                placeholder="11 2345 6789"
                className="w-full text-sm"
                numberInputProps={{
                  className:
                    "w-full border-none focus:outline-none p-0 bg-transparent text-[var(--foreground)] text-sm",
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid rgba(249, 250, 251, 0.1)",
                  padding: "0.75rem",
                  borderRadius: "0.75rem",
                  backgroundColor: "var(--background)",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.06)",
                }}
              />
            </div>
          </div>
        )}

        {/* Botón de Confirmar Reserva dentro del contenedor */}
        <div className="pt-1">
          <button
            id="btn-reservar-submit"
            type="submit"
            disabled={isDisabled || loading}
            className="w-full flex items-center justify-center gap-2.5 bg-[var(--accent)] hover:bg-[#E8CA8C] text-slate-950 font-extrabold py-3.5 px-5 rounded-xl shadow-lg shadow-[var(--accent)]/20 border border-[var(--accent)]/40 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-sm md:text-base cursor-pointer"
          >
            {loading ? (
              <Scissors className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>
                  {!currentService || selectedServiceId < 0
                    ? "Seleccioná un servicio"
                    : !name
                    ? (isGuest ? "Completá tus datos" : "Ingresá el cliente")
                    : "Confirmar Reserva"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {popup.show && (
        <PopupModal
          message={popup.message}
          success={popup.success}
          showWhatsappButton={showWhatsapp}
          handleWhatsappButton={handleWhatsapp}
          onClose={() => {
            popup.close();
            if (popup.success) onClose();
          }}
        />
      )}
    </div>
  );
}
