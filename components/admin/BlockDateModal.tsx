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
import { useBusinessContext } from "@/lib/context/BusinessContext";
import Spinner from "@/components/loading/Spinner";
import { usePopup } from "@/lib/hooks/usePopup";
import BlockButton from "../buttons/BlockButton";

export default function BlockDateModal({ onClose }: Readonly<{ onClose: () => void }>) {
  const { data: barbers = [], loading: loadingFetch } = useFetchOnce<Barber[]>("barbers", getBarbers);
  const { businessHours, businessSettings } = useBusinessContext();
  const [selectedBarberId, setSelectedBarberId] = useState(-1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [useRange, setUseRange] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const allAppointments = generateAllAppointments({
    openTime: businessHours.open_time,
    closeTime: businessHours.close_time,
    stepMinutes: businessSettings.slot_step_minutes,
    breakStart: businessHours.lunch_start,
    breakEnd: businessHours.lunch_end,
  });
  const normalizeTime = (value: string) => value.slice(0, 5);
  const closeTimeOptionRaw = businessHours.close_time ?? null;
  const closeTimeOption = closeTimeOptionRaw ? normalizeTime(closeTimeOptionRaw) : null;
  const endTimeOptions = closeTimeOption
    ? Array.from(new Set([...allAppointments, closeTimeOption].map(normalizeTime))).sort()
    : allAppointments;
  const hasDateRangeError = !!(useRange && selectedDate && selectedEndDate && selectedEndDate < selectedDate);
  const isDisabled =
    selectedBarberId < 0 ||
    !selectedDate ||
    (useRange && !selectedEndDate) ||
    !startTime ||
    !endTime ||
    hasDateRangeError;
  const [loading, setLoading] = useState(false);
  const popup = usePopup();
  const isFetching = loadingFetch;

  const handleBlockDate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isDisabled) {
      setLoading(false);
      return;
    }
    const normalizeDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const startDate = normalizeDate(selectedDate!);
    const endDate = normalizeDate(useRange && selectedEndDate ? selectedEndDate : selectedDate!);
    const createdBy = barbers!.find((barber) => barber.id === selectedBarberId)?.name;
    const closedDays = businessHours.closed_days ?? [];

    const datesToBlock: Date[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (!closedDays.includes(d.getDay())) {
        datesToBlock.push(new Date(d));
      }
    }

    const results = await Promise.all(
      datesToBlock.map((date) =>
        createAppointment({
          client: reason ?? "Bloqueado",
          barber_id: selectedBarberId,
          date,
          start_time: startTime,
          end_time: endTime,
          phone: "0000000000",
          service_id: 1,
          created_by: createdBy,
        })
      )
    );

    const allOk = results.every((r) => r.success);
    const message = allOk
      ? "Día(s) y horario bloqueados con éxito"
      : "Se bloquearon algunos días, pero hubo errores en otros";
    popup.open(message, allOk);
    setLoading(false);
  };

  if (isFetching) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-50">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <Modal onClose={onClose} size="lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--foreground)]">
          Bloquear día y horario
        </h2>
        <form onSubmit={handleBlockDate} className="px-2 text-left space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Barbero
              </label>
              <BarberSelector
                id="block-barber"
                barbers={barbers ?? []}
                selectedBarberId={selectedBarberId}
                onChange={setSelectedBarberId}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 h-[42px] mt-6">
              <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">Bloquear rango de días</span>
              <div
                id="block-use-range"
                role="button"
                onClick={() => setUseRange(!useRange)}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${useRange ? 'bg-green-500' : 'bg-neutral-600'}`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${useRange ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                {useRange ? "Desde" : "Fecha"}
              </label>
              <DatePickerField
                date={selectedDate}
                onChange={(d) => {
                  setSelectedDate(d);
                  if (d && selectedEndDate && selectedEndDate < d) {
                    setSelectedEndDate(d);
                  }
                }}
              />
            </div>

            {useRange ? (
              <div>
                <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                  Hasta
                </label>
                <DatePickerField
                  date={selectedEndDate}
                  onChange={setSelectedEndDate}
                />
                {hasDateRangeError && (
                  <p className="text-xs text-red-500 mt-1">
                    La fecha Hasta debe ser igual o posterior a la fecha de inicio.
                  </p>
                )}
              </div>
            ) : (
              <div className="hidden md:block"></div>
            )}

            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <TimeSelect
                id="block-start-time"
                label="Inicio"
                value={startTime}
                options={allAppointments}
                onChange={setStartTime}
              />
              <TimeSelect
                id="block-end-time"
                label="Fin"
                value={endTime}
                options={endTimeOptions.filter((t) => t > startTime)}
                onChange={setEndTime}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Motivo
              </label>
              <input 
                id="block-reason" 
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                required 
                className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm"
                placeholder="Ej. Vacaciones, Trámite personal, etc."
              />
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <div className="w-[200px]">
              <BlockButton id="btn-block-submit" type="submit" disabled={isDisabled} loading={loading} />
            </div>
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
