"use client";

import { ConfigFormSkeleton } from "@/components/loading/Skeleton";
import SaveButton from "@/components/buttons/SaveButton";
import { getBusinessHours, upsertBusinessHours } from "@/lib/repository/businessHours";
import { GlobalHours } from "@/lib/types/BusinessHours";
import { Shuffle, Scale, Crown, Briefcase } from "lucide-react";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { useSettingsForm } from "@/lib/hooks/useSettingsForm";

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

type HorariosDraft = {
  openTime: string;
  closeTime: string;
  lunchEnabled: boolean;
  lunchStart: string;
  lunchEnd: string;
  closedDays: number[];
  slotStep: SlotStepMinutes;
  criteria: CriteriaOption;
};

export default function ConfigHorariosSection() {
  const { isEnabled } = useBusinessContext();
  const canCustomizeCriteria = isEnabled("booking_rules");

  const { draft, setDraft, loading, hasChanges, saving, save, reset } =
    useSettingsForm<HorariosDraft>({
      pick: (settings) => ({
        openTime: "09:00",
        closeTime: "20:00",
        lunchEnabled: false,
        lunchStart: "13:00",
        lunchEnd: "14:00",
        closedDays: [],
        slotStep: (settings.slot_step_minutes as SlotStepMinutes) || 30,
        criteria: (settings.assignment_criteria as CriteriaOption) || "random",
      }),
      loadExtra: async (baseDraft) => {
        const h = await getBusinessHours();
        if (!h) return baseDraft;
        return {
          ...baseDraft,
          openTime: h.open_time || "09:00",
          closeTime: h.close_time || "20:00",
          closedDays: Array.isArray(h.closed_days) ? h.closed_days : [],
          lunchEnabled: Boolean(h.lunch_start && h.lunch_end),
          lunchStart: h.lunch_start || "13:00",
          lunchEnd: h.lunch_end || "14:00",
        };
      },
      saveExtra: async (currentDraft) => {
        const hoursPayload: GlobalHours = {
          open_time: currentDraft.openTime,
          close_time: currentDraft.closeTime,
          lunch_start: currentDraft.lunchEnabled ? currentDraft.lunchStart : null,
          lunch_end: currentDraft.lunchEnabled ? currentDraft.lunchEnd : null,
          closed_days: currentDraft.closedDays,
        };
        const hoursOk = await upsertBusinessHours(hoursPayload);
        if (!hoursOk) {
          throw new Error("Error al guardar la configuración de horarios");
        }
      },
      toPayload: (currentDraft) => ({
        slot_step_minutes: currentDraft.slotStep,
        ...(canCustomizeCriteria && { assignment_criteria: currentDraft.criteria }),
      }),
    });

  const toggleDay = (dayId: number) => {
    if (!draft) return;
    const closed = draft.closedDays.includes(dayId)
      ? draft.closedDays.filter((d) => d !== dayId)
      : [...draft.closedDays, dayId];
    setDraft({ ...draft, closedDays: closed });
  };

  if (loading || !draft) {
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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="space-y-8 animate-in fade-in duration-300"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Horarios y atención
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configurá los días de apertura, franja horaria, intervalo de turnos y criterio de asignación
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              type="button"
              onClick={reset}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-[var(--foreground)]/20 text-xs text-slate-300 hover:bg-white/5 hover:text-white font-medium transition-all cursor-pointer min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Descartar
            </button>
          )}
          <SaveButton
            type="submit"
            loading={saving}
            disabled={!hasChanges || saving}
            className="w-full sm:w-auto min-h-[44px]"
          />
        </div>
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
            const isOpen = !draft.closedDays.includes(d.id);
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
              <label
                htmlFor="horario-apertura-input"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Apertura
              </label>
              <input
                id="horario-apertura-input"
                type="time"
                value={draft.openTime}
                onChange={(e) =>
                  setDraft({ ...draft, openTime: e.target.value })
                }
                required
                className="w-full p-2.5 rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="horario-cierre-input"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Cierre
              </label>
              <input
                id="horario-cierre-input"
                type="time"
                value={draft.closeTime}
                onChange={(e) =>
                  setDraft({ ...draft, closeTime: e.target.value })
                }
                required
                className="w-full p-2.5 rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="intervalo-turnos-select"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              Duración de franja (slots de turno)
            </label>
            <select
              id="intervalo-turnos-select"
              value={draft.slotStep}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  slotStep: Number(e.target.value) as SlotStepMinutes,
                })
              }
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
                checked={draft.lunchEnabled}
                onChange={(e) =>
                  setDraft({ ...draft, lunchEnabled: e.target.checked })
                }
                className="w-4 h-4 accent-[var(--accent)] rounded cursor-pointer"
              />
              <span className="text-xs text-slate-300 font-medium">Habilitar pausa</span>
            </label>
          </div>

          {draft.lunchEnabled ? (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
              <div>
                <label
                  htmlFor="descanso-inicio-input"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Inicio pausa
                </label>
                <input
                  id="descanso-inicio-input"
                  type="time"
                  value={draft.lunchStart}
                  onChange={(e) =>
                    setDraft({ ...draft, lunchStart: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="descanso-fin-input"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Fin pausa
                </label>
                <input
                  id="descanso-fin-input"
                  type="time"
                  value={draft.lunchEnd}
                  onChange={(e) =>
                    setDraft({ ...draft, lunchEnd: e.target.value })
                  }
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
              const isSelected = draft.criteria === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    setDraft({ ...draft, criteria: opt.id })
                  }
                  className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "!bg-[var(--accent)]/15 !border-[var(--accent)]/60 shadow-md shadow-[var(--accent)]/10"
                      : "!bg-[var(--foreground)]/5 !border-[var(--foreground)]/10 hover:!bg-[var(--foreground)]/10"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected
                        ? "!bg-[var(--accent)]/20 !text-[var(--accent)]"
                        : "!bg-black/30 !text-slate-400"
                    }`}
                  >
                    <opt.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4
                      className={`text-sm font-bold ${
                        isSelected ? "!text-[var(--accent)]" : "!text-white"
                      }`}
                    >
                      {opt.title}
                    </h4>
                    <p
                      className={`text-xs mt-0.5 ${
                        isSelected ? "text-slate-200" : "text-slate-400"
                      }`}
                    >
                      {opt.desc}
                    </p>
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
