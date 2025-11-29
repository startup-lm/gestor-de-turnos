import Modal from "@/components/ui/Modal";
import CancelButton from "../buttons/CancelButton";
import { Appointment } from "@/lib/types/Appointment";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ConfirmModalProps {
  appointment: Appointment;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export default function CancelAppointmentModal({ appointment, onConfirm, onCancel, loading, }: Readonly<ConfirmModalProps>) {
  return (
    <Modal onClose={onCancel}>
      <div className="px-4">
        <h2 className="text-xl font-semibold mb-4">
          Estas seguro que queres cancelar el turno?
        </h2>
        <div className="space-y-2 mb-4 text-left">
          <p>
            <strong>Cliente:</strong> {appointment.client}
          </p>
          <p>
            <strong>Horario:</strong> {format(new Date(`${appointment.date}T${appointment.start_time}-03:00`), "EEEE d 'de' MMMM", { locale: es })} - {appointment.start_time} hs
          </p>
          <p>
            <strong>Celular:</strong> {appointment.phone}
          </p>
        </div>
        <div className="flex justify-center mt-10">
          <CancelButton onClick={onConfirm} loading={loading} />
        </div>
      </div>
    </Modal>
  );
}
