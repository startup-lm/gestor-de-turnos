"use client";

import { useState, useEffect } from "react";
import { ConfigFormSkeleton } from "@/components/loading/Skeleton";
import SaveButton from "@/components/buttons/SaveButton";
import { toast } from "@/lib/store/useToastStore";
import { getBusinessHours, upsertBusinessHours } from "@/lib/repository/businessHours";
import { getBusinessSettings, updateBusinessSettings } from "@/lib/repository/businessSettings";
import { GlobalHours } from "@/lib/types/BusinessHours";
import { Shuffle, Scale, Crown, Briefcase } from "lucide-react";
import { useBusinessContext } from "@/lib/context/BusinessContext";

const DAY_LABELS = [
  { id: 1, name: "Lunes" },
  { id: 2, name: "Martes" },
  { id: 3, name: "Miércoles" },
  { id: 4, name: "Jueves" },
  { id: 5, name: "Viernes" },
  { id: 6, name: "Sábado" },
  { id: 0, name: "Domingo" },
];

type CriteriaOption = "random" | "balanced" | "prioritize_admin" | "prioritize_barber";

type SlotStepMinutes = 15 | 30 | 45 | 60;

export default function ConfigHorariosSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { isEnabled } = useBusinessContext();
  const canCustomizeCriteria = isEnabled("booking_rules");
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("20:00");
  const [lunchEnabled, setLunchEnabled] = useState(false);
  const [lunchStart, setLunchStart] = useState("13:00");
  const [lunchEnd, setLunchEnd] = useState("14:00");
  const [closedDays, setClosedDays] = useState<number[]>([]);
  const [slotStep, setSlotStep] = useState<SlotStepMinutes>(30);
  const [criteria, setCriteria] = useState<CriteriaOption>("random");

  const [initialData, setInitialData] = useState<{
    openTime: string;
    closeTime: string;
    lunchEnabled: boolean;
    lunchStart: string;
    lunchEnd: string;
    closedDays: number[];
    slotStep: SlotStepMinutes;
    criteria: CriteriaOption;
  }>({
    openTime: "09:00",
    closeTime: "20:00",
    lunchEnabled: false,
    lunchStart: "13:00",
    lunchEnd: "14:00",
    closedDays: [],
    slotStep: 30,
    criteria: "random",
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [h, s] = await Promise.all([getBusinessHours(), getBusinessSettings()]);
        let oTime = "09:00";
        let cTime = "20:00";
        let cDays: number[] = [];
        let hasLunch = false;
        let lStart = "13:00";
        let lEnd = "14:00";
        let sStep: SlotStepMinutes = 30;
        let crit: CriteriaOption = "random";

        if (h) {
          oTime = h.open_time || "09:00";
          cTime = h.close_time || "20:00";
          cDays = h.closed_days || [];
          hasLunch = Boolean(h.lunch_start && h.lunch_end);
          if (h.lunch_start) lStart = h.lunch_start;
          if (h.lunch_end) lEnd = h.lunch_end;

          setOpenTime(oTime);
          setCloseTime(cTime);
          setClosedDays(cDays);
          setLunchEnabled(hasLunch);
          setLunchStart(lStart);
          setLunchEnd(lEnd);
        }
        if (s) {
          sStep = (s.slot_step_minutes as SlotStepMinutes) || 30;
          if (s.assignment_criteria) {
            crit = s.assignment_criteria as CriteriaOption;
          }
          setSlotStep(sStep);
          setCriteria(crit);
        }

        setInitialData({
          openTime: oTime,
          closeTime: cTime,
          lunchEnabled: hasLunch,
          lunchStart: lStart,
          lunchEnd: lEnd,
          closedDays: cDays,
          slotStep: sStep,
          criteria: crit,
        });
      } catch (err) {
        console.error("Error al cargar horarios:", err);
        toast.error("Error al cargar configuración de horarios");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleDay = (dayId: number) => {
    if (closedDays.includes(dayId)) {
      setClosedDays(closedDays.filter((d) => d !== dayId));
    } else {
      setClosedDays([...closedDays, dayId]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const hoursPayload: GlobalHours = {
        open_time: openTime,
        close_time: closeTime,
        lunch_start: lunchEnabled ? lunchStart : null,
        lunch_end: lunchEnabled ? lunchEnd : null,
        closed_days: closedDays,
      };

      const [hoursOk, settingsOk] = await Promise.all([
        upsertBusinessHours(hoursPayload),
        updateBusinessSettings({
          slot_step_minutes: slotStep,
          ...(canCustomizeCriteria && { assignment_criteria: criteria }),
        }),
      ]);

      if (hoursOk && settingsOk) {
        setInitialData({
          openTime,
          closeTime,
          lunchEnabled,
          lunchStart,
          lunchEnd,
          closedDays: [...closedDays],
          slotStep,
          criteria,
        });
        toast.success("Horarios y reglas guardados con éxito");
      } else {
        toast.error("Error al guardar algunos ajustes");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión al guardar");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    openTime !== initialData.openTime ||
    closeTime !== initialData.closeTime ||
    lunchEnabled !== initialData.lunchEnabled ||
    (lunchEnabled && (lunchStart !== initialData.lunchStart || lunchEnd !== initialData.lunchEnd)) ||
    slotStep !== initialData.slotStep ||
    criteria !== initialData.criteria ||
    closedDays.length !== initialData.closedDays.length ||
    closedDays.some((d) => !initialData.closedDays.includes(d));

  if (loading) {
    return <ConfigFormSkeleton />;
  }

  const criteriaOptions = [
    {
      id: "random" as const,
      title: "Aleatorio",
      desc: "Distribuye turnos sin preferencia fija",
      icon: Shuffle,
    },
    {
      id: "balanced" as const,
      title: "Equitativo",
      desc: "Balancea turnos equitativamente entre el equipo",
      icon: Scale,
    },
    {
      id: "prioritize_admin" as const,
      title: "Priorizar dueño o admin",
      desc: "Llena primero la agenda del administrador",
      icon: Crown,
    },
    {
      id: "prioritize_barber" as const,
      title: "Priorizar empleados",
      desc: "Llena primero la agenda de los barberos",
      icon: Briefcase,
    },
  ];

  return (
    <form onSubmit={handleSave} className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Horarios y atención
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configurá los días de apertura, franja horaria, intervalo de turnos y criterio de asignación
          </p>
        </div>
        <SaveButton
          type="submit"
          loading={saving}
          disabled={!hasChanges || saving}
          className="w-full sm:w-auto"
        />
      </div>

      {/* Días de Atención */}
      <div className="bg-[var(--foreground)]/5 p-5 rounded-2xl border border-[var(--foreground)]/10 space-y-3">
        <h3 className="text-sm font-bold tracking-wider text-[var(--accent)]">
          Días laborales
        </h3>
        <p className="text-xs text-slate-400">
          Marcá los días que el local está abierto (los días desmarcados se considerarán cerrados):
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {DAY_LABELS.map((d) => {
            const isOpen = !closedDays.includes(d.id);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => toggleDay(d.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isOpen
                    ? "!bg-[var(--accent)] !text-slate-950 shadow-md shadow-[var(--accent)]/15 scale-100"
                    : "!bg-[var(--foreground)]/5 !text-slate-400 !border !border-[var(--foreground)]/15 hover:!border-[var(--foreground)]/30 hover:!text-slate-200"
                }`}
              >
                {d.name} {isOpen ? "✓" : "(Cerrado)"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Franja Horaria e Intervalos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--foreground)]/5 p-5 rounded-2xl border border-[var(--foreground)]/10 space-y-4">
          <h3 className="text-sm font-bold tracking-wider text-[var(--accent)]">
            Horario general
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="horario-apertura-input" className="block text-xs font-semibold text-slate-300 mb-1.5">Apertura</label>
              <input
                id="horario-apertura-input"
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
              />
            </div>
            <div>
              <label htmlFor="horario-cierre-input" className="block text-xs font-semibold text-slate-300 mb-1.5">Cierre</label>
              <input
                id="horario-cierre-input"
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="intervalo-turnos-select" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Duración de franja (slots de turno)
            </label>
            <select
              id="intervalo-turnos-select"
              value={slotStep}
              onChange={(e) => setSlotStep(Number(e.target.value) as SlotStepMinutes)}
              className="w-full p-2.5 rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
            >
              <option value={15}>Cada 15 minutos</option>
              <option value={30}>Cada 30 minutos</option>
              <option value={45}>Cada 45 minutos</option>
              <option value={60}>Cada 60 minutos</option>
            </select>
          </div>
        </div>

        {/* Pausa / Almuerzo */}
        <div className="bg-[var(--foreground)]/5 p-5 rounded-2xl border border-[var(--foreground)]/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-wider text-[var(--accent)]">
              Descanso o almuerzo
            </h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lunchEnabled}
                onChange={(e) => setLunchEnabled(e.target.checked)}
                className="w-4 h-4 accent-[var(--accent)] rounded cursor-pointer"
              />
              <span className="text-xs text-slate-300 font-medium">Habilitar pausa</span>
            </label>
          </div>

          {lunchEnabled ? (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
              <div>
                <label htmlFor="descanso-inicio-input" className="block text-xs font-semibold text-slate-300 mb-1.5">Inicio pausa</label>
                <input
                  id="descanso-inicio-input"
                  type="time"
                  value={lunchStart}
                  onChange={(e) => setLunchStart(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
                />
              </div>
              <div>
                <label htmlFor="descanso-fin-input" className="block text-xs font-semibold text-slate-300 mb-1.5">Fin pausa</label>
                <input
                  id="descanso-fin-input"
                  type="time"
                  value={lunchEnd}
                  onChange={(e) => setLunchEnd(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-3">
              No hay pausa configurada. Se ofrecerán turnos continuos desde la apertura hasta el cierre.
            </p>
          )}
        </div>
      </div>

      {/* Criterio de Asignación Automática (solo si el plan lo incluye) */}
      {canCustomizeCriteria && (
        <div className="bg-[var(--foreground)]/5 p-5 rounded-2xl border border-[var(--foreground)]/10 space-y-4">
          <div>
            <h3 className="text-sm font-bold tracking-wider text-[var(--accent)]">
              Criterio de asignación de turnos
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Define a qué barbero se asigna un turno cuando el cliente no elige uno específico:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
            {criteriaOptions.map((opt) => {
              const isSelected = criteria === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCriteria(opt.id)}
                  className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "!bg-[var(--accent)]/15 !border-[var(--accent)]/60 shadow-md shadow-[var(--accent)]/10"
                      : "!bg-[var(--foreground)]/5 !border-[var(--foreground)]/10 hover:!bg-[var(--foreground)]/10"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isSelected ? "!bg-[var(--accent)]/20 !text-[var(--accent)]" : "!bg-black/30 !text-slate-400"}`}>
                    <opt.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${isSelected ? "!text-[var(--accent)]" : "!text-white"}`}>
                      {opt.title}
                    </h4>
                    <p className={`text-xs mt-0.5 ${isSelected ? "text-slate-200" : "text-slate-400"}`}>{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </form>
  );
}
