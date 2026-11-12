"use client";

import React from "react";
import { Calendar, AlertTriangle } from "lucide-react";
import type { ArcaPeriod } from "./constants";

interface InvoicePeriodSelectorProps {
  periodPreset: ArcaPeriod;
  setPeriodPreset: (p: ArcaPeriod) => void;
  customStart: string;
  setCustomStart: (s: string) => void;
  customEnd: string;
  setCustomEnd: (e: string) => void;
  daysCount: number;
  isPeriodValid: boolean;
}

export function InvoicePeriodSelector({
  periodPreset,
  setPeriodPreset,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  daysCount,
  isPeriodValid,
}: InvoicePeriodSelectorProps) {
  return (
    <div className="bg-[var(--foreground)]/5 p-4 rounded-2xl border border-[var(--foreground)]/10 space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Calendar className="w-4 h-4 text-[var(--accent)]" />
          <span>Período a inspeccionar:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(["daily", "weekly", "biweekly", "monthly", "custom"] as ArcaPeriod[]).map((p) => {
            const labels: Record<ArcaPeriod, string> = {
              daily: "Diario",
              weekly: "Semanal",
              biweekly: "Quincenal",
              monthly: "Mensual",
              custom: "Personalizado",
            };
            const isActive = periodPreset === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPeriodPreset(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                    : "!text-slate-400 hover:!text-white hover:!bg-white/5"
                }`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>
      </div>

      {periodPreset === "custom" && (
        <div className="pt-3 border-t border-[var(--foreground)]/10 flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <label htmlFor="arca-list-start" className="text-xs text-slate-400 font-medium">Desde:</label>
            <input
              id="arca-list-start"
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="p-1.5 rounded-lg border border-[var(--foreground)]/15 bg-[var(--background)] text-xs text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="arca-list-end" className="text-xs text-slate-400 font-medium">Hasta:</label>
            <input
              id="arca-list-end"
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="p-1.5 rounded-lg border border-[var(--foreground)]/15 bg-[var(--background)] text-xs text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
            />
          </div>

          <span className="text-xs text-slate-400">
            Duración: <strong className={daysCount > 31 ? "text-rose-400" : "text-emerald-400"}>{daysCount} días</strong>
          </span>
        </div>
      )}

      {!isPeriodValid && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>
            Por normativa de ARCA, el período no puede superar 31 días corridos. Por favor reducí el rango de fechas.
          </span>
        </div>
      )}
    </div>
  );
}
