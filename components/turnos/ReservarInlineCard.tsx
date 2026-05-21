"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, User, Clock, ArrowLeft } from "lucide-react";
import { sendConfirmAppointment } from "../../utils/whatsapp";
import ReserveButton from "../buttons/ReserveButton";
import { CalendarEvent } from "@/lib/types/CalendarEvent";
import { Barber } from "@/lib/types/Barbers";
import ClientAutocompleteFields from "./ClientAutocompleteFields";
import { useReservarLogic } from "@/lib/hooks/useReservarLogic";
import { useBusinessContext } from "@/lib/context/BusinessContext";
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
}

export default function ReservarInlineCard({
  onClose,
  selectedDate,
  selectedBarber,
  selectedBarberId,
  events,
  onAppointmentCreated,
  barbers
}: Readonly<Props>) {
  const {
    isGuest,
    services,
    selectedServiceId,
    setSelectedServiceId,
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
  } = useReservarLogic(selectedDate, selectedBarber, selectedBarberId, events, onAppointmentCreated, barbers);

  const { businessSettings } = useBusinessContext();

  const handleWhatsapp = () => {
    sendConfirmAppointment(
      appointmentId,
      selectedDate,
      selectedDate.toTimeString().slice(0, 5),
      name,
      businessSettings?.phone
    );
    onClose();
  };

  return (
    <>
      <div 
        className="w-full bg-[var(--bg-carousel)] border border-[var(--foreground)]/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden animate-fade-in-up"
        style={{ animation: "fadeInUp 450ms cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      >
        {/* Botón superior de retroceso */}
        <button 
          type="button" 
          onClick={onClose} 
          className="group mb-6 inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[var(--accent)] transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Volver a la agenda
        </button>

        {/* Título de Paso 3 */}
        <h2 className="text-2xl md:text-3xl font-extrabold mb-8 text-center bg-gradient-to-r from-[var(--foreground)] via-[var(--foreground)] to-[var(--accent)] bg-clip-text text-transparent tracking-tight">
          Completá tu Reserva
        </h2>

        <form onSubmit={handleReservar} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* COLUMNA IZQUIERDA: Resumen Glassmorphic */}
            <div className="bg-[var(--background)]/40 border border-[var(--foreground)]/5 p-6 rounded-2xl flex flex-col gap-5 shadow-inner md:sticky md:top-4">
              <h3 className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider border-b border-[var(--foreground)]/5 pb-3">
                Resumen del Turno
              </h3>

              {/* Barbero */}
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--accent)]/20 text-[var(--accent)]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none mb-1">
                    Profesional
                  </span>
                  <span className="font-bold text-base text-[var(--foreground)]">
                    {assignedBarber.name}
                  </span>
                </div>
              </div>

              {/* Fecha */}
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--accent)]/20 text-[var(--accent)]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none mb-1">
                    Fecha
                  </span>
                  <span className="font-bold text-base text-[var(--foreground)] capitalize">
                    {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                  </span>
                </div>
              </div>

              {/* Hora */}
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--accent)]/20 text-[var(--accent)]">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none mb-1">
                    Horario
                  </span>
                  <span className="font-bold text-base text-[var(--foreground)]">
                    {selectedDate.toTimeString().slice(0, 5)} hs
                  </span>
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: Datos del Cliente */}
            <div className="space-y-5 bg-[var(--background)]/20 border border-[var(--foreground)]/5 p-6 rounded-2xl shadow-sm">
              <h3 className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider border-b border-[var(--foreground)]/5 pb-3">
                Información de Contacto
              </h3>

              {!isGuest ? (
                /* Modo Barber/Admin: Autocomplete */
                <ClientAutocompleteFields
                  name={name}
                  phone={phone}
                  onNameChange={setName}
                  onPhoneChange={setPhone}
                  onClientResolved={() => {}}
                />
              ) : (
                /* Modo Cliente (Guest) */
                <div className="space-y-5">
                  {/* Nombre */}
                  <div>
                    <label 
                      htmlFor="reservar-guest-name" 
                      className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2"
                    >
                      Nombre y Apellido
                    </label>
                    <input 
                      id="reservar-guest-name" 
                      type="text" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      required 
                      placeholder="Ej: Juan Pérez" 
                      className="!bg-[var(--background)] !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl p-3 w-full block text-sm shadow-inner"
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label 
                      htmlFor="reservar-guest-phone" 
                      className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2"
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
                        className: "w-full border-none focus:outline-none p-0 bg-transparent text-[var(--foreground)] text-sm",
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid rgba(249, 250, 251, 0.1)',
                        padding: '0.75rem',
                        borderRadius: '0.75rem',
                        backgroundColor: 'var(--background)',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Selección de Servicio */}
              <div>
                <label 
                  htmlFor="reservar-service" 
                  className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2"
                >
                  Servicio Requerido
                </label>
                <select 
                  id="reservar-service" 
                  required 
                  className="!bg-[var(--background)] !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl p-3 w-full block text-sm h-[48px] shadow-inner cursor-pointer" 
                  value={selectedServiceId} 
                  onChange={e => setSelectedServiceId(Number(e.target.value))} 
                >
                  <option value={-1} disabled style={{ color: "grey" }}>
                    Seleccioná un servicio...
                  </option>
                  {services?.map(s => (
                    <option key={s.id} value={s.id} style={{ color: "black" }}>
                      {s.name} ({s.duration} min)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Botón de Confirmación Centrado */}
          <div className="flex justify-center pt-6 border-t border-[var(--foreground)]/5">
            <div className="w-[200px]">
              <ReserveButton 
                id="btn-reservar-submit" 
                type="submit" 
                loading={loading} 
                disabled={isDisabled} 
              />
            </div>
          </div>
        </form>
      </div>

      {/* Popup Modal final de Éxito / Whatsapp */}
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
    </>
  );
}
