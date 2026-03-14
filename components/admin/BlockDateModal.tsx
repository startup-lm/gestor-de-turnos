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
import { getCalendarConfig } from "@/lib/repository/calendar";
import Modal from "@/components/ui/Modal";
import PopupModal from "@/components/ui/PopupModal";
import Spinner from "@/components/loading/Spinner";
import { usePopup } from "@/lib/hooks/usePopup";
import BlockButton from "../buttons/BlockButton";

export default function BlockDateModal({ onClose }: Readonly<{ onClose: () => void }>) {
  const { data: barbers = [], loading: loadingFetch } = useFetchOnce<Barber[]>(getBarbers);
  const { data: calendarConfig, loading: loadingCalendar } = useFetchOnce(getCalendarConfig);
  const [selectedBarberId, setSelectedBarberId] = useState(-1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [useRange, setUseRange] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const allAppointments = generateAllAppointments({
    openTime: calendarConfig?.businessHours.open_time,
    closeTime: calendarConfig?.businessHours.close_time,
    stepMinutes: calendarConfig?.businessSettings.slot_step_minutes,
    breakStart: calendarConfig?.businessHours.lunch_start,
    breakEnd: calendarConfig?.businessHours.lunch_end,
  });
  const normalizeTime = (value: string) => value.slice(0, 5);
  const closeTimeOptionRaw = calendarConfig?.businessHours.close_time ?? null;
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
  const isFetching = loadingFetch || loadingCalendar;

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

    const datesToBlock: Date[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      datesToBlock.push(new Date(d));
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

            <label className="block text-sm font-medium mb-1 mt-4">
              <input
                type="checkbox"
                checked={useRange}
                onChange={(e) => setUseRange(e.target.checked)}
              />{" "}
              Bloquear rango de días
            </label>

            {useRange && (
              <>
                <label className="block text-sm font-medium mb-1 mt-4">
                  Hasta
                </label>
                <DatePickerField
                  date={selectedEndDate}
                  onChange={setSelectedEndDate}
                />
                {hasDateRangeError && (
                  <p className="text-sm mt-1">
                    La fecha Hasta debe ser igual o posterior a la fecha de inicio.
                  </p>
                )}
              </>
            )}

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
                options={endTimeOptions.filter((t) => t > startTime)}
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
