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
    bienvenidaName,
    isDisabled,
    popup,
    handleReservar,
  } = useReservarLogic(selectedDate, selectedBarber, selectedBarberId, events, onAppointmentCreated);

  const handleWhatsapp = () => {
    sendConfirmAppointment(appointmentId, selectedDate, selectedDate.toTimeString().slice(0, 5), name);
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
            <input type="text" value={selectedBarber} readOnly />

            <label className="block text-sm font-medium mb-1 mt-4">
              Día y horario
            </label>
            <input type="text" value={`${format(selectedDate, "EEEE d 'de' MMMM", { locale: es })} - ${selectedDate.toTimeString().slice(0, 5)}hs`} readOnly />

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
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Nombre y Apellido" />

                <label className="block text-sm font-medium mb-1 mt-4">
                  Celular
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  required={isGuest}
                  placeholder="1123456789"
                  maxLength={10}
                  inputMode="numeric"
                />
              </>
            )}

            <label className="block text-sm font-medium mb-1 mt-4">
              Servicio
            </label>
            <select required className="border p-2 rounded w-full bg-[var(--background)] text-[var(--foreground)]" value={selectedServiceId} onChange={e => setSelectedServiceId(Number(e.target.value))} >
              <option value={-1} disabled style={{ color: "grey" }}>
                Selecciona un servicio
              </option>
              {services.map(s => (
                <option key={s.id} value={s.id} style={{ color: "black" }}>
                  {s.name} ({s.duration} min)
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center mt-10">
            <ReserveButton type="submit" loading={loading} disabled={isDisabled} />
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
