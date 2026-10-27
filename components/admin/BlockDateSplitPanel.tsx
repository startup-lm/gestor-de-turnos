"use client";

import { useState } from "react";
import { useFetchOnce } from "@/lib/hooks/useFetchOnce";
import { getBarbers } from "@/lib/repository/barbers";
import { Barber } from "@/lib/types/Barbers";
import BarberSelector from "@/components/turnos/BarberSelector";
import DatePickerField from "./DatePickerField";
import TimeSelect from "./TimeSelect";
import { generateAllAppointments } from "@/utils/appointments";
import { createAppointment } from "@/lib/repository/appointments";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { DetailFormSkeleton } from "@/components/loading/Skeleton";
import { toast } from "@/lib/store/useToastStore";
import { CalendarX, Lock, Calendar, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

interface Props {
  onClose: () => void;
  onBlockCreated?: () => void;
}

export default function BlockDateSplitPanel({
  onClose,
  onBlockCreated,
}: Readonly<Props>) {
  const { data: barbers = [], loading: loadingBarbers } = useFetchOnce<Barber[]>("barbers", getBarbers);
  const { businessHours, businessSettings } = useBusinessContext();

  const [selectedBarberId, setSelectedBarberId] = useState(-1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [useRange, setUseRange] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

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
    !reason.trim() ||
    hasDateRangeError ||
    loading;

  const handleBlockDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDisabled) return;
    setLoading(true);

    const normalizeDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const startDate = normalizeDate(selectedDate!);
    const endDate = normalizeDate(useRange && selectedEndDate ? selectedEndDate : selectedDate!);
    const createdBy = (barbers ?? []).find((barber) => barber.id === selectedBarberId)?.name;
    const closedDays = businessHours.closed_days ?? [];

    const datesToBlock: Date[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (!closedDays.includes(d.getDay())) {
        datesToBlock.push(new Date(d));
      }
    }

    if (datesToBlock.length === 0) {
      toast.info("No hay días laborables seleccionados dentro del rango.");
      setLoading(false);
      return;
    }

    try {
      const promises = datesToBlock.map((dateObj) => {
        return createAppointment({
          date: dateObj,
          start_time: startTime,
          end_time: endTime,
          barber_id: selectedBarberId,
          created_by: createdBy,
          phone: "0000000000",
          service_id: 1,
          client: reason || "BLOQUEADO",
        });
      });

      const results = await Promise.all(promises);
      const allSuccess = results.every((res) => Boolean(res));

      if (allSuccess) {
        toast.success(
          datesToBlock.length === 1
            ? "Horario bloqueado con éxito"
            : `Se bloquearon ${datesToBlock.length} días laborales con éxito`
        );
        onBlockCreated?.();
        onClose();
      } else {
        toast.error("Ocurrió un error al bloquear algunos de los horarios");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error inesperado al intentar bloquear el horario");
    } finally {
      setLoading(false);
    }
  };

  if (loadingBarbers) {
    return <DetailFormSkeleton />;
  }

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* Cabecera con botón Volver y Botón de Acción a la derecha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)] hover:text-white transition-colors cursor-pointer group mb-1"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Volver a turnos</span>
          </button>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            Bloquear horarios
          </h2>
          <p className="text-xs text-slate-400">
            Restringí la disponibilidad de la agenda para turnos o jornadas específicas
          </p>
        </div>

        <button
          id="btn-block-panel-submit"
          type="submit"
          form="block-date-form"
          disabled={isDisabled}
          className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all shadow-md active:scale-95 min-h-[40px] ${
            !isDisabled
              ? "!bg-red-500 hover:!bg-red-600 !text-white shadow-red-500/20 cursor-pointer"
              : "!bg-white/5 !text-slate-500 border border-white/10 cursor-not-allowed opacity-50"
          }`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-inherit" />
          ) : (
            <>
              <CalendarX className="w-4 h-4" />
              <span>Bloquear horario</span>
            </>
          )}
        </button>
      </div>

      {/* Formulario Inline en Pantalla Completa */}
      <form id="block-date-form" onSubmit={handleBlockDate} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Barbero y Fechas */}
          <div className="lg:col-span-6 bg-gradient-to-b from-[var(--foreground)]/5 to-[var(--foreground)]/2 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-5">
            <div className="flex items-center gap-2 text-[var(--accent)] text-sm font-bold uppercase tracking-wider border-b border-white/10 pb-3">
              <Calendar className="w-4 h-4" />
              <span>Barbero y período</span>
            </div>

            {/* Selector de Barbero */}
            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Barbero *
              </label>
              <BarberSelector
                id="block-panel-barber"
                barbers={barbers ?? []}
                selectedBarberId={selectedBarberId}
                onChange={setSelectedBarberId}
                className="w-full"
              />
            </div>

            {/* Switch Rango de Días */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-200">
                  Bloquear rango de días
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={useRange}
                onClick={() => setUseRange((v) => !v)}
                className={`w-10 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                  useRange ? "bg-[var(--accent)]" : "bg-slate-700"
                }`}
              >
                <div
                  className={`bg-slate-950 w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                    useRange ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Selectores de Fechas */}
            <div className={useRange ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : ""}>
              <div>
                <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                  {useRange ? "Fecha desde *" : "Fecha *"}
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

              {useRange && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                    Fecha hasta *
                  </label>
                  <DatePickerField
                    date={selectedEndDate}
                    onChange={setSelectedEndDate}
                  />
                </div>
              )}
            </div>

            {hasDateRangeError && (
              <p className="text-xs text-red-400 flex items-center gap-1.5 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                La fecha hasta debe ser igual o posterior a desde.
              </p>
            )}
          </div>

          {/* Columna Derecha: Horarios y Motivo */}
          <div className="lg:col-span-6 bg-gradient-to-b from-[var(--foreground)]/5 to-[var(--foreground)]/2 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-5">
            <div className="flex items-center gap-2 text-[var(--accent)] text-sm font-bold uppercase tracking-wider border-b border-white/10 pb-3">
              <Lock className="w-4 h-4" />
              <span>Franja horaria y motivo</span>
            </div>

            {/* Selectores de Horas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TimeSelect
                id="block-panel-start-time"
                label="Hora inicio *"
                value={startTime}
                options={allAppointments}
                onChange={setStartTime}
              />
              <TimeSelect
                id="block-panel-end-time"
                label="Hora fin *"
                value={endTime}
                options={endTimeOptions.filter((t) => t > startTime)}
                onChange={setEndTime}
              />
            </div>

            {/* Motivo */}
            <div>
              <label htmlFor="block-panel-reason" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Motivo del bloqueo *
              </label>
              <input
                id="block-panel-reason"
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Vacaciones, Feriado, Asunto personal..."
                className="w-full !bg-[var(--foreground)]/5 !text-[var(--foreground)] !border !border-[var(--foreground)]/15 focus:!border-[var(--accent)] rounded-xl p-3 text-sm transition-all outline-none"
              />
            </div>

            {/* Resumen Informativo */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-red-400 font-bold">
                <Lock className="w-4 h-4" />
                <span>Acción de bloqueo</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Los clientes no podrán solicitar turnos dentro de este período para el barbero seleccionado. El bloqueo aparecerá reflejado inmediatamente en la agenda.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
