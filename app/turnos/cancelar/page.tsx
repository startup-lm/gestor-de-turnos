"use client";

import { useState } from "react";
import { deleteAppointment, getAppointmentById } from "@/lib/repository/appointments";
import dynamic from "next/dynamic";
import CancelButton from "@/components/buttons/CancelButton";
import { usePopup } from "@/lib/hooks/usePopup";
import { Appointment } from "@/lib/types/Appointment";
import CancelAppointmentModal from "@/components/turnos/CancelAppointmentModal";
import { sendCancelAppointment } from "@/utils/whatsapp";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { Hash, Phone } from "lucide-react";

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
  const { businessSettings } = useBusinessContext();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const numericId = Number(appointmentId.trim());
    if (!numericId) return;
    const appt = await getAppointmentById(numericId);
    setLoading(false);
    if (!appt) popup.open("No existe ese número de turno", false);
    else if (appt?.paid || appt?.phone === "0000000000" || appt?.type === "block") popup.open("No es posible cancelar este turno", false);
    else if (appt?.phone !== phone && appt?.phone !== `+549${phone}`) popup.open("El número de teléfono no pertenece al turno", false);
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
    const deleted = await deleteAppointment(appointment.id, appointment.client);
    popup.open(deleted ? "Turno cancelado con éxito" : "Error al cancelar el Turno", deleted);
    setShowWhatsapp(deleted);
    setLoading(false);
  }

  const handleWhatsapp = () => {
    sendCancelAppointment(appointment!.date, appointment!.start_time, appointment!.client, businessSettings?.phone);
  };

  return (
    <div className="p-5 flex flex-col items-center text-center">
      <h1 className="text-3xl font-bold mb-5">Querés cancelar tu turno?</h1>

      {/* Container Principal en Glassmorphic */}
      <div className="bg-[var(--foreground)]/5 backdrop-blur-md border border-[var(--foreground)]/10 p-8 md:p-10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] w-full max-w-lg hover:border-[var(--accent)]/30 transition-all duration-300">
        {/* Formulario */}
        <form onSubmit={handleDelete} className="space-y-6 text-left">
          {/* Campo Número de Turno */}
          <div>
            <label htmlFor="appointment-id" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2 ml-1">
              Número de Turno
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-[var(--foreground)]/40 pointer-events-none z-10 flex items-center justify-center">
                <Hash size={18} />
              </span>
              <input
                id="appointment-id"
                type="number"
                inputMode="numeric"
                value={appointmentId}
                placeholder="Ej. 123"
                className="w-full !bg-[var(--foreground)]/5 !text-[var(--foreground)] !border !border-[var(--foreground)]/10 rounded-xl py-3 !pl-12 pr-4 text-sm focus:outline-none focus:!border-red-500/50 focus:!ring-1 focus:!ring-red-500/50 transition-all duration-200 shadow-inner h-[48px]"
                onChange={(e) => {
                  const onlyNumbers = e.target.value.replace(/\D/g, "");
                  setAppointmentId(onlyNumbers);
                }}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text");
                  if (!/^\d+$/.test(pasted)) e.preventDefault();
                }}
                required
              />
            </div>
          </div>

          {/* Campo Número de Celular */}
          <div>
            <label htmlFor="cancel-phone" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2 ml-1">
              Número de Celular
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-[var(--foreground)]/40 pointer-events-none z-10 flex items-center justify-center">
                <Phone size={18} />
              </span>
              <input
                id="cancel-phone"
                type="tel"
                value={phone}
                placeholder="Ej. 1123456789"
                className="w-full !bg-[var(--foreground)]/5 !text-[var(--foreground)] !border !border-[var(--foreground)]/10 rounded-xl py-3 !pl-12 pr-4 text-sm focus:outline-none focus:!border-red-500/50 focus:!ring-1 focus:!ring-red-500/50 transition-all duration-200 shadow-inner h-[48px]"
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>
          </div>

          {/* Botón de Envío */}
          <div className="flex justify-center pt-4">
            <div className="w-[200px]">
              <CancelButton id="btn-cancel-search" type="submit" disabled={isDisabled} loading={loading} />
            </div>
          </div>
        </form>

        {showConfirm && appointment && (
          <CancelAppointmentModal appointment={appointment} onCancel={() => setShowConfirm(false)} onConfirm={handleConfirmDelete} loading={loading} />
        )}

        {popup.show && (
          <PopupModal
            message={popup.message}
            success={popup.success}
            showWhatsappButton={showWhatsapp}
            handleWhatsappButton={handleWhatsapp}
            onClose={() => {
              popup.close();
              setShowConfirm(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
