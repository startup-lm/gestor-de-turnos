"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { CalendarX, Calendar, RefreshCw } from "lucide-react";
import { Appointment } from "@/lib/types/Appointment";
import AdminTurnosClient from "@/app/operaciones/turnos/AdminTurnosClient";
import BlockDateSplitPanel from "@/components/admin/BlockDateSplitPanel";
import Spinner from "@/components/loading/Spinner";

type PeriodPreset = "week" | "today" | "month" | "last_month" | "custom" | "all";

function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function TurnosSection() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "block">("list");

  // Period filter state - Default: "Esta semana"
  const [preset, setPreset] = useState<PeriodPreset>("week");

  // Calculate default week dates (Monday to Sunday)
  const defaultWeekDates = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: formatDateISO(monday),
      end: formatDateISO(sunday),
    };
  }, []);

  const [customStart, setCustomStart] = useState<string>(defaultWeekDates.start);
  const [customEnd, setCustomEnd] = useState<string>(defaultWeekDates.end);

  const fetchTurnos = useCallback(async (start?: string, end?: string) => {
    setLoading(true);
    try {
      let url = "/api/appointments";
      if (start && end) {
        url += `?start_date=${start}&end_date=${end}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAppointments(data);
        }
      }
    } catch (err) {
      console.error("Error al cargar turnos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Compute active date boundaries according to current preset
  useEffect(() => {
    const now = new Date();

    if (preset === "today") {
      const todayStr = formatDateISO(now);
      fetchTurnos(todayStr, todayStr);
    } else if (preset === "week") {
      fetchTurnos(defaultWeekDates.start, defaultWeekDates.end);
    } else if (preset === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      fetchTurnos(formatDateISO(start), formatDateISO(end));
    } else if (preset === "last_month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      fetchTurnos(formatDateISO(start), formatDateISO(end));
    } else if (preset === "custom") {
      if (customStart && customEnd) {
        fetchTurnos(customStart, customEnd);
      }
    } else if (preset === "all") {
      fetchTurnos();
    }
  }, [preset, defaultWeekDates, fetchTurnos, customStart, customEnd]);

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      fetchTurnos(customStart, customEnd);
    }
  };

  if (viewMode === "block") {
    return (
      <BlockDateSplitPanel
        onClose={() => setViewMode("list")}
        onBlockCreated={() => {
          setViewMode("list");
          if (preset === "week") {
            fetchTurnos(defaultWeekDates.start, defaultWeekDates.end);
          } else {
            fetchTurnos();
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Gestión de turnos
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Búsqueda, inspección y seguimiento de turnos
          </p>
        </div>
        <button
          type="button"
          onClick={() => setViewMode("block")}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl !bg-[var(--accent)] hover:!bg-[#E8CA8C] !text-slate-950 font-bold text-sm shadow-md shadow-[var(--accent)]/15 transition-all hover:scale-105 active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <CalendarX className="w-4 h-4 stroke-[2.5]" />
          <span>Bloquear horarios</span>
        </button>
      </div>

      {/* Barra de Filtro de Período */}
      <div className="bg-[var(--foreground)]/5 p-4 rounded-2xl border border-[var(--foreground)]/10 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Calendar className="w-4 h-4 text-[var(--accent)]" />
            <span>Filtrar por período:</span>
          </div>

          {/* Selector de Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPreset("week")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                preset === "week"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                  : "!text-slate-400 hover:!text-white hover:!bg-white/5"
              }`}
            >
              Esta semana
            </button>
            <button
              type="button"
              onClick={() => setPreset("today")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                preset === "today"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                  : "!text-slate-400 hover:!text-white hover:!bg-white/5"
              }`}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setPreset("month")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                preset === "month"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                  : "!text-slate-400 hover:!text-white hover:!bg-white/5"
              }`}
            >
              Este mes
            </button>
            <button
              type="button"
              onClick={() => setPreset("last_month")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                preset === "last_month"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                  : "!text-slate-400 hover:!text-white hover:!bg-white/5"
              }`}
            >
              Mes anterior
            </button>
            <button
              type="button"
              onClick={() => setPreset("custom")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                preset === "custom"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                  : "!text-slate-400 hover:!text-white hover:!bg-white/5"
              }`}
            >
              Personalizado
            </button>
            <button
              type="button"
              onClick={() => setPreset("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                preset === "all"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                  : "!text-slate-400 hover:!text-white hover:!bg-white/5"
              }`}
            >
              Todos
            </button>
          </div>
        </div>

        {/* Inputs de rango personalizado cuando está activo */}
        {preset === "custom" && (
          <form
            onSubmit={handleApplyCustom}
            className="pt-3 border-t border-[var(--foreground)]/10 flex flex-wrap items-center gap-3 animate-in fade-in duration-200"
          >
            <div className="flex items-center gap-2">
              <label htmlFor="turnos-custom-start" className="text-xs text-slate-400 font-medium">Desde:</label>
              <input
                id="turnos-custom-start"
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="p-1.5 rounded-lg border border-[var(--foreground)]/15 bg-[var(--background)] text-xs text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="turnos-custom-end" className="text-xs text-slate-400 font-medium">Hasta:</label>
              <input
                id="turnos-custom-end"
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="p-1.5 rounded-lg border border-[var(--foreground)]/15 bg-[var(--background)] text-xs text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg !bg-[var(--accent)] !text-slate-950 text-xs font-bold hover:!bg-[#E8CA8C] transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Aplicar filtro
            </button>
          </form>
        )}
      </div>

      <div className="w-full">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <AdminTurnosClient appointments={appointments} />
        )}
      </div>
    </div>
  );
}
