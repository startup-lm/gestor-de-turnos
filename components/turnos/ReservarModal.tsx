"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import Modal from "@/components/ui/Modal";
import PopupModal from "@/components/ui/PopupModal";
import { sendConfirmAppointment } from "../../utils/whatsapp";
import ReserveButton from "../buttons/ReserveButton";
import { CalendarEvent } from "@/lib/types/CalendarEvent";
import ClientAutocompleteFields from "./ClientAutocompleteFields";
import { useReservarLogic } from "@/lib/hooks/useReservarLogic";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface Props {
  onClose: () => void;
  selectedDate: Date;
  selectedBarber: string;
  selectedBarberId: number;
  events: CalendarEvent[];
  onAppointmentCreated?: () => void;
}

export default function ReservarModal({ onClose, selectedDate, selectedBarber, selectedBarberId, events, onAppointmentCreated }: Readonly<Props>) {
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
    isDisabled,
    popup,
    handleReservar,
  } = useReservarLogic(selectedDate, selectedBarber, selectedBarberId, events, onAppointmentCreated);

  const { businessSettings } = useBusinessContext();

  const handleWhatsapp = () => {
    sendConfirmAppointment(appointmentId, selectedDate, selectedDate.toTimeString().slice(0, 5), name, businessSettings?.phone);
    onClose();
  };

  return (
    <>
      <Modal onClose={onClose} size="lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--foreground)]">Reserva tu turno</h2>
        <form onSubmit={handleReservar} className="space-y-6 px-2 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-xl p-5 flex flex-col gap-3 shadow-inner md:sticky md:top-0">
                <h3 className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider border-b border-[var(--foreground)]/5 pb-2">
                  Resumen de Reserva
                </h3>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-[var(--foreground)]/40 uppercase tracking-wider font-semibold">Barbero</span>
                  <span className="font-bold text-lg text-[var(--foreground)]">{selectedBarber}</span>
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  <span className="text-[10px] text-[var(--foreground)]/40 uppercase tracking-wider font-semibold">Día y horario</span>
                  <span className="font-semibold text-[var(--foreground)]">{`${format(selectedDate, "EEEE d 'de' MMMM", { locale: es })} - ${selectedDate.toTimeString().slice(0, 5)}hs`}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {!isGuest ? (
                <ClientAutocompleteFields
                  name={name}
                  phone={phone}
                  onNameChange={setName}
                  onPhoneChange={setPhone}
                  onClientResolved={() => {}}
                />
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                      Nombre
                    </label>
                    <input 
                      id="reservar-guest-name" 
                      type="text" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      required 
                      placeholder="Nombre y Apellido" 
                      className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                      Celular
                    </label>
                    <PhoneInput
                      id="reservar-guest-phone"
                      defaultCountry="AR"
                      value={phone}
                      onChange={(value) => setPhone(value || "")}
                      required={isGuest}
                      placeholder="1123456789"
                      className="w-full text-sm"
                      numberInputProps={{
                        className: "w-full border-none focus:outline-none p-0 bg-transparent text-[var(--foreground)] text-sm",
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid rgba(249, 250, 251, 0.1)',
                        padding: '0.625rem',
                        borderRadius: '0.5rem',
                        backgroundColor: 'rgba(249, 250, 251, 0.05)',
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                  Servicio
                </label>
                <select 
                  id="reservar-service" 
                  required 
                  className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm h-[42px]" 
                  value={selectedServiceId} 
                  onChange={e => setSelectedServiceId(Number(e.target.value))} 
                >
                  <option value={-1} disabled style={{ color: "grey" }}>
                    Selecciona un servicio
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

          <div className="flex justify-center pt-4">
            <ReserveButton id="btn-reservar-submit" type="submit" loading={loading} disabled={isDisabled} />
          </div>
        </form>
      </Modal>

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
