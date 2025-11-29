"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { createAppointment } from "@/lib/repository/appointments";
import Modal from "@/components/ui/Modal";
import PopupModal from "@/components/ui/PopupModal";
import { usePopup } from "@/lib/hooks/usePopup";
import { sendConfirmAppointment } from "../../utils/whatsapp";
import ReserveButton from "../buttons/ReserveButton";
import { useAuth } from "@/lib/auth/AuthContext";
import { useFetchOnce } from "@/lib/hooks/useFetchOnce";
import { Service } from "@/lib/types/Services";
import { getServices } from "@/lib/repository/services";
import { CalendarEvent } from "@/lib/types/CalendarEvent";

export default function ReservarModal({ onClose, selectedDate, selectedBarber, selectedBarberId, events, }:
  Readonly<{ onClose: () => void; selectedDate: Date; selectedBarber: string; selectedBarberId: number; events: CalendarEvent[]; }>) {

  const { role } = useAuth();
  const { data } = useFetchOnce<Service[]>(getServices);
  const services: Service[] = data ?? [];
  const isGuest = role === "guest";
  const filtered = role === "admin" ? services : services.filter(s => s.id !== 5);
  const [selectedServiceId, setSelectedServiceId] = useState(-1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [appointmentId, setAppointmentId] = useState(0);
  const [showWhatsapp, setShowWhatsapp] = useState(false);
  const isDisabled = !name || (isGuest && !phone) || selectedServiceId < 0;
  const popup = usePopup();

  const handleReservar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const service = services.find(s => s.id === selectedServiceId);
    const duration = service!.duration;
    const endDate = new Date(selectedDate);
    endDate.setMinutes(endDate.getMinutes() + duration);
    if (isGuest) {
      const cierre = new Date(selectedDate);
      cierre.setHours(20, 0, 0, 0);
      if (endDate > cierre) {
        popup.open(`La duración del turno excede el horario de atención al cliente (20:00hs)`, false);
        setLoading(false);
        return;
      }
    }
    const conflict = events.some(ev => selectedDate < ev.end! && endDate > ev.start!);
    if (isGuest && conflict) {
      const msg = `Tu turno de ${selectedDate.toTimeString().slice(0, 5)} a ${endDate.toTimeString().slice(0, 5)} coincide con otro ya agendado. Por favor, elegí otro horario.`;
      popup.open(msg, false);
      setLoading(false);
      return;
    }

    const result = await createAppointment({
      client: name,
      barber_id: selectedBarberId,
      date: selectedDate,
      start_time: selectedDate.toTimeString().slice(0, 5),
      end_time: endDate.toTimeString().slice(0, 5),
      phone,
      service_id: selectedServiceId,
    });
    if (result.success && result.id) {
      setAppointmentId(result.id);
      setShowWhatsapp(true);
    }
    popup.open(result.success ? `Turno reservado con éxito. Tu número de turno es #${result.id}.` : "Error al reservar el turno", result.success);
    setLoading(false);
  };

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

            <label className="block text-sm font-medium mb-1 mt-4">
              Nombre
            </label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Nombre y Apellido" />

            <label className="block text-sm font-medium mb-1 mt-4">
              Celular
            </label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} required={isGuest} placeholder="11-2345-6789" 
              minLength={isGuest ? 10 : undefined} maxLength={isGuest ? 10 : undefined} />

            <label className="block text-sm font-medium mb-1 mt-4">
              Servicio
            </label>
            <select required className="border p-2 rounded w-full bg-[var(--background)] text-[var(--foreground)]" value={selectedServiceId} onChange={e => setSelectedServiceId(Number(e.target.value))} >
              <option value={-1} disabled style={{ color: "grey" }}>
                Selecciona un servicio
              </option>
              {filtered.map(s => (
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
