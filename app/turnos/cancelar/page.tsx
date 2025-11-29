"use client";

import { useState } from "react";
import { deleteAppointment, getAppointmentById } from "@/lib/repository/appointments";
import dynamic from "next/dynamic";
import CancelButton from "@/components/buttons/CancelButton";
import { usePopup } from "@/lib/hooks/usePopup";
import { Appointment } from "@/lib/types/Appointment";
import CancelAppointmentModal from "@/components/turnos/CancelAppointmentModal";
import { sendCancelAppointment } from "@/utils/whatsapp";

const PopupModal = dynamic(() => import("@/components/ui/PopupModal"), { ssr: false, loading: () => null });

export default function CancelarTurnoPage() {
  const [appointmentId, setAppointmentId] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const isDisabled = !appointmentId || !phone;
  const [showWhatsapp, setShowWhatsapp] = useState(false);
  const popup = usePopup();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const numericId = Number(appointmentId.trim());
    if (!numericId) return;
    const appt = await getAppointmentById(numericId);
    setLoading(false);
    if (!appt) popup.open("No existe ese número de turno", false);
    else if (appt?.paid || appt?.phone === "0000000000") popup.open("No es posible cancelar este turno", false);
    else if (appt?.phone !== phone) popup.open("El número de teléfono no pertenece al turno", false);
    else {
      setAppointment(appt);
      setShowConfirm(true);
    }
    setAppointmentId("");
    setPhone("");
  };

  const handleConfirmDelete = async () => {
    if (!appointment) return;
    setLoading(true);
    const deleted = await deleteAppointment(appointment.id);
    popup.open(deleted ? "Turno cancelado con éxito" : "Error al cancelar el Turno", deleted);
    setShowWhatsapp(deleted);
    setLoading(false);
  }

  const handleWhatsapp = () => {
    sendCancelAppointment(appointment!.date, appointment!.start_time, appointment!.client);
  };

  return (
    <div className="p-5 flex flex-col items-center text-center">
      <h1 className="text-3xl font-bold mb-10">¿Querés cancelar tu turno?</h1>
      <div className="bg-[var(--bg-carousel)] px-15 py-5 md:px-20 md:py-10 rounded-xl shadow-md w-full max-w-md">
        <form onSubmit={handleDelete} className="px-4 md:px-6">
          <div className="text-left rounded-2lg shadow-lg">
            <label htmlFor="appointment-id" className="block text-sm font-medium mb-2" >
              Ingresa tu número de turno
            </label>
            <input id="appointment-id" type="number" inputMode="numeric" value={appointmentId} className="border p-2 w-full mb-4 rounded" placeholder="123"
              onChange={(e) => {
                const onlyNumbers = e.target.value.replace(/\D/g, "");
                setAppointmentId(onlyNumbers);
              }}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData("text");
                if (!/^\d+$/.test(pasted)) e.preventDefault();
              }} />
            <label className="block text-sm font-medium mb-2">
              Ingresa tu número de celular
            </label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} required placeholder="11-2345-6789" />
          </div>

          <div className="flex justify-center mt-10">
            <CancelButton type="submit" disabled={isDisabled} loading={loading} />
          </div>
        </form>

        {showConfirm && appointment && (
          <CancelAppointmentModal appointment={appointment} onCancel={() => setShowConfirm(false)} onConfirm={handleConfirmDelete} loading={loading} />
        )}

        {popup.show && (
          <PopupModal message={popup.message} success={popup.success}
            showWhatsappButton={showWhatsapp}
            handleWhatsappButton={handleWhatsapp}
            onClose={() => {
              popup.close();
              setShowConfirm(false);
            }} />
        )}
      </div>
    </div>
  );
}
