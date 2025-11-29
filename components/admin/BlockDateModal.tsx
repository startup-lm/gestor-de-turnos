"use client";

import { useState } from "react";
import { useFetchOnce } from "@/lib/hooks/useFetchOnce";
import { getBarbers } from "@/lib/repository/barbers";
import { Barber } from "@/lib/types/Barbers";
import BarberSelector from "@/components/turnos/BarberSelector";
import DatePickerField from "./DatePickerField";
import TimeSelect from "./TimeSelect";
import { generateAllAppointments } from "../../utils/appointments";
import { createAppointment } from "@/lib/repository/appointments";
import Modal from "@/components/ui/Modal";
import PopupModal from "@/components/ui/PopupModal";
import Spinner from "@/components/loading/Spinner";
import { usePopup } from "@/lib/hooks/usePopup";
import BlockButton from "../buttons/BlockButton";

export default function BlockDateModal({ onClose }: Readonly<{ onClose: () => void }>) {
  const { data: barbers = [], loading: loadingFetch } = useFetchOnce<Barber[]>(getBarbers);
  const [selectedBarberId, setSelectedBarberId] = useState(-1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const allAppointments = generateAllAppointments();
  const isDisabled = selectedBarberId < 0 || !selectedDate || !startTime || !endTime;
  const [loading, setLoading] = useState(false);
  const popup = usePopup();

  const handleBlockDate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isDisabled) return;
    //await deleteAppointmentsByDate({ barber_id: selectedBarberId, date: selectedDate, start_time: startTime, end_time: endTime, });
    const result = await createAppointment({ client: reason ?? "Bloqueado", barber_id: selectedBarberId, date: selectedDate, start_time: startTime, end_time: endTime, phone: "0000000000", service_id: 1 });
    const message = result.success ? "Día y horario bloqueados con éxito" : "Error al bloquear día y horario";
    popup.open(message, result.success);
    setLoading(false);
  };

  if (loadingFetch) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-50">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <Modal onClose={onClose}>
        <h2 className="text-xl font-bold mb-4 text-center">
          Bloquear día y horario
        </h2>
        <form onSubmit={handleBlockDate} className="px-4">
          <div className="text-left rounded-2lg mt-5 shadow-lg">
            <label className="block text-sm font-medium mb-1">
              Barbero
            </label>
            <BarberSelector
              barbers={barbers ?? []}
              selectedBarberId={selectedBarberId}
              onChange={setSelectedBarberId}
              className="w-full"
            />

            <label className="block text-sm font-medium mb-1 mt-4">
              Fecha
            </label>
            <DatePickerField
              date={selectedDate}
              onChange={setSelectedDate}
            />

            <div className="flex space-x-6 my-4">
              <TimeSelect
                label="Inicio"
                value={startTime}
                options={allAppointments}
                onChange={setStartTime}
                className="flex-1"
              />
              <TimeSelect
                label="Fin"
                value={endTime}
                options={allAppointments.filter((t) => t > startTime)}
                onChange={setEndTime}
                className="flex-1"
              />
            </div>

            <label className="block text-sm font-medium mb-1 mt-4">
              Motivo
            </label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>

          <div className="flex justify-center mt-10">
            <BlockButton type="submit" disabled={isDisabled} loading={loading} />
          </div>
        </form>
      </Modal>

      {popup.show && (
        <PopupModal
          message={popup.message}
          success={popup.success}
          onClose={() => {
            popup.close();
            onClose();
          }}
        />
      )}
    </>
  );
}
