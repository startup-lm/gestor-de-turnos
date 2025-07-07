"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { deleteAppointment } from "@/lib/repository/appointments";
import { Appointment } from "@/lib/types/Appointment";
import Modal from "@/components/ui/Modal";
import PopupModal from "@/components/ui/PopupModal";
import { usePopup } from "@/lib/hooks/usePopup";
import dynamic from "next/dynamic";
import ConfirmModal from "../ui/ConfirmModal";
import DeleteButton from "../buttons/DeleteButton";
import ChargeButton from "../buttons/ChargeButton";

const ServicePaidModal = dynamic(() => import("./ServicePaidModal"), { ssr: false, loading: () => null });

export default function AppointmentDetailsModal({ onClose, appointment, selectedBarber, }: Readonly<{ onClose: () => void; appointment: Appointment; selectedBarber: string; }>) {
  const [showService, setShowService] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const isDisabled = appointment.paid || appointment.client === "No disponible";
  const [loading, setLoading] = useState(false);
  const popup = usePopup();
  const date = new Date(`${appointment.date}T12:00:00-03:00`);

  const handleDelete = async () => {
    setLoading(true);
    const success = await deleteAppointment(appointment.id);
    popup.open(success ? "Turno eliminado con éxito" : "Error al eliminar el turno", success);
    setConfirmModal(false);
    setLoading(false);
  };

  return (
    <>
      <Modal onClose={onClose}>
        <h2 className="text-xl font-bold mb-4 text-center">Detalles del turno</h2>
        <div className="px-6">
          <div className="space-y-4 my-5 text-left rounded-2lg">
            <label className="block text-sm font-medium mb-1">
              Barbero
            </label>
            <input type="text" value={selectedBarber} readOnly />

            <label className="block text-sm font-medium mb-1">
              Día y horario
            </label>
            <input type="text" value={`${format(date, "EEEE d 'de' MMMM", { locale: es })} - ${appointment.start_time.slice(0, 5)}hs`} readOnly />

            <label className="block text-sm font-medium mb-1">
              Cliente
            </label>
            <input type="text" value={appointment.client} readOnly />

            <label className="block text-sm font-medium mb-1">
              Celular
            </label>
            <input type="text" value={appointment.phone} readOnly />

            <label className="block text-sm font-medium mb-1">
              Servicio
            </label>
            <input type="text" value={appointment.services?.name} readOnly />
          </div>

          <div className="flex justify-center gap-5 mt-10">
            <DeleteButton disabled={isDisabled} loading={loading} onClick={() => setConfirmModal(true)} />
            <ChargeButton onClick={() => setShowService(true)} disabled={isDisabled} loading={loading} isPaid={appointment.paid} />
          </div>
        </div>
      </Modal>

      {popup.show && (
        <PopupModal
          message={popup.message}
          success={popup.success}
          onClose={() => {
            popup.close();
            if (popup.success) onClose();
          }}
        />
      )}

      {showService && (
        <ServicePaidModal
          onClose={() => {
            setShowService(false);
            onClose();
          }}
          appointment={appointment}
          setIsPaid={() => { }}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          title={"¿Estás seguro que querés eliminar el turno?"}
          onConfirm={handleDelete}
          onCancel={() => setConfirmModal(false)}
          loading={loading}
          button="delete"
        />
      )}
    </>
  );
}
