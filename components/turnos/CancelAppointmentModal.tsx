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
    <Modal onClose={onCancel} size="md">
      <div className="px-2 text-center">
        <h2 className="text-xl font-bold mb-4 text-[var(--foreground)]">
          ¿Estás seguro de que querés cancelar el turno?
        </h2>
        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 space-y-3 mb-6 text-left text-sm shadow-inner">
          <div className="flex justify-between items-center border-b border-[var(--foreground)]/5 pb-2">
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Cliente</span>
            <span className="font-bold text-[var(--foreground)]">{appointment.client}</span>
          </div>
          <div className="flex justify-between items-center border-b border-[var(--foreground)]/5 pb-2">
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Fecha y Horario</span>
            <span className="font-bold text-[var(--foreground)] text-right">
              {format(new Date(`${appointment.date}T${appointment.start_time}-03:00`), "EEEE d 'de' MMMM", { locale: es })} - {appointment.start_time} hs
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Celular</span>
            <span className="font-bold text-[var(--foreground)]">{appointment.phone}</span>
          </div>
        </div>
        <div className="flex justify-center mt-6">
          <CancelButton id="btn-cancel-appt-confirm" onClick={onConfirm} loading={loading} />
        </div>
      </div>
    </Modal>
  );
}
