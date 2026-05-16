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
      <Modal onClose={onClose}>
        <h2 className="text-xl font-bold mb-4 text-center">Reserva tu turno</h2>
        <form onSubmit={handleReservar} className="space-y-4 px-4">
          <div className="my-5 text-left rounded-2lg">
            <label className="block text-sm font-medium mb-1 mt-4" >
              Barbero
            </label>
            <input id="reservar-barber" type="text" value={selectedBarber} readOnly />

            <label className="block text-sm font-medium mb-1 mt-4">
              Día y horario
            </label>
            <input id="reservar-datetime" type="text" value={`${format(selectedDate, "EEEE d 'de' MMMM", { locale: es })} - ${selectedDate.toTimeString().slice(0, 5)}hs`} readOnly />

            {!isGuest ? (
              <ClientAutocompleteFields
                name={name}
                phone={phone}
                onNameChange={setName}
                onPhoneChange={setPhone}
                onClientResolved={() => {}}
              />
            ) : (
              <>
                <label className="block text-sm font-medium mb-1 mt-4">
                  Nombre
                </label>
                <input id="reservar-guest-name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Nombre y Apellido" />

                <label className="block text-sm font-medium mb-1 mt-4">
                  Celular
                </label>
                <PhoneInput
                  id="reservar-guest-phone"
                  defaultCountry="AR"
                  value={phone}
                  onChange={(value) => setPhone(value || "")}
                  required={isGuest}
                  placeholder="1123456789"
                  className="w-full"
                  numberInputProps={{
                    className: "w-full border-none focus:outline-none p-0 bg-transparent text-[var(--foreground)]",
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid var(--border)',
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    backgroundColor: 'var(--background)'
                  }}
                />
              </>
            )}

            <label className="block text-sm font-medium mb-1 mt-4">
              Servicio
            </label>
            <select id="reservar-service" required className="border p-2 rounded w-full bg-[var(--background)] text-[var(--foreground)]" value={selectedServiceId} onChange={e => setSelectedServiceId(Number(e.target.value))} >
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

          <div className="flex justify-center mt-10">
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
