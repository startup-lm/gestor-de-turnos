"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarX, Calendar, X } from "lucide-react";
import { isPastUnpaid } from "@/lib/appointments/pastUnpaid";
import { Appointment } from "@/lib/types/Appointment";
import AppointmentsTable from "@/components/admin/AppointmentsTable";
import BlockDateSplitPanel from "@/components/admin/BlockDateSplitPanel";
import { AppointmentsTableSkeleton } from "@/components/loading/Skeleton";

type PeriodPreset = "week" | "today" | "month" | "last_month" | "custom" | "all";

function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export default function TurnosSection() {
  // El aviso de Resumen llega con ?pendientes=1&desde=…&hasta=…[&barbero=…]
  const searchParams = useSearchParams();
  const linkStart = searchParams.get("desde") ?? "";
  const linkEnd = searchParams.get("hasta") ?? "";
  const fromPendingLink = searchParams.get("pendientes") === "1" && ISO_DAY.test(linkStart) && ISO_DAY.test(linkEnd);
  const linkBarberId = Number(searchParams.get("barbero")) || 0;
  const [onlyPastUnpaid, setOnlyPastUnpaid] = useState(fromPendingLink);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "block">("list");

  const requestIdRef = useRef(0);

  // Period filter state - Default: "Esta semana"
  const [preset, setPreset] = useState<PeriodPreset>(fromPendingLink ? "custom" : "week");

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

  const [customStart, setCustomStart] = useState<string>(fromPendingLink ? linkStart : defaultWeekDates.start);
  const [customEnd, setCustomEnd] = useState<string>(fromPendingLink ? linkEnd : defaultWeekDates.end);

  const visibleAppointments = useMemo(
    () =>
      onlyPastUnpaid
        ? appointments.filter(
            (a) => (linkBarberId === 0 || a.barber_id === linkBarberId) && a.phone !== "0000000000" && isPastUnpaid(a)
          )
        : appointments,
    [appointments, onlyPastUnpaid, linkBarberId]
  );

  const getActiveRange = useCallback((): { start?: string; end?: string } => {
    const now = new Date();
    if (preset === "today") {
      const todayStr = formatDateISO(now);
      return { start: todayStr, end: todayStr };
    }
    if (preset === "week") {
      return { start: defaultWeekDates.start, end: defaultWeekDates.end };
    }
    if (preset === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: formatDateISO(start), end: formatDateISO(end) };
    }
    if (preset === "last_month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: formatDateISO(start), end: formatDateISO(end) };
    }
    if (preset === "custom") {
      if (customStart && customEnd) {
        return { start: customStart, end: customEnd };
      }
      return {};
    }
    // "all"
    return {};
  }, [preset, defaultWeekDates, customStart, customEnd]);

  const fetchTurnos = useCallback(async (start?: string, end?: string) => {
    const currentId = ++requestIdRef.current;
    setLoading(true);
    setFetchError(false);
    try {
      let url = "/api/appointments";
      if (start && end) {
        url += `?start_date=${start}&end_date=${end}`;
      }
      const res = await fetch(url);
      if (currentId !== requestIdRef.current) return;
      if (res.ok) {
        const data = await res.json();
        if (currentId !== requestIdRef.current) return;
        if (Array.isArray(data)) {
          setAppointments(data);
          setFetchError(false);
        } else {
          setFetchError(true);
        }
      } else {
        setFetchError(true);
      }
    } catch (err) {
      if (currentId !== requestIdRef.current) return;
      console.error("Error al cargar turnos:", err);
      setFetchError(true);
    } finally {
      if (currentId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Compute active date boundaries according to current preset
  useEffect(() => {
    const range = getActiveRange();
    if (preset === "custom" && (!range.start || !range.end)) {
      return;
    }
    fetchTurnos(range.start, range.end);
  }, [getActiveRange, fetchTurnos, preset]);

  if (viewMode === "block") {
    return (
      <BlockDateSplitPanel
        onClose={() => setViewMode("list")}
        onBlockCreated={() => {
          setViewMode("list");
          const range = getActiveRange();
          fetchTurnos(range.start, range.end);
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
            Turnos
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Búsqueda, inspección y seguimiento de turnos
          </p>
        </div>
        <button
          type="button"
          onClick={() => setViewMode("block")}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl !bg-[var(--accent)] hover:!bg-[var(--accent-hover)] !text-slate-950 font-bold text-sm shadow-md shadow-[var(--accent)]/15 transition-all hover:scale-105 active:scale-95 cursor-pointer self-start sm:self-auto"
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
              Mes pasado
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

        {onlyPastUnpaid && (
          <div className="pt-3 border-t border-[var(--foreground)]/10">
            <button
              type="button"
              onClick={() => setOnlyPastUnpaid(false)}
              aria-label="Quitar filtro de turnos pasados sin cobrar"
              className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs font-semibold hover:bg-amber-500/20 transition-colors cursor-pointer"
            >
              <span>Pasados sin cobrar</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Inputs de rango personalizado cuando está activo */}
        {preset === "custom" && (
          <div className="pt-3 border-t border-[var(--foreground)]/10 flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
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
          </div>
        )}
      </div>

      <div className="w-full">
        {loading ? (
          <AppointmentsTableSkeleton />
        ) : fetchError ? (
          <div className="p-8 rounded-xl border border-[var(--border)] bg-[var(--background)] text-center text-sm text-red-400">
            No se pudieron cargar los turnos. Probá de nuevo.
          </div>
        ) : (
          <AppointmentsTable appointments={visibleAppointments} />
        )}
      </div>
    </div>
  );
}
