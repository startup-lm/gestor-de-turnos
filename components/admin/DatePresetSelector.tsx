"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { DATE_PRESET_LABELS, DatePreset, FixedDatePreset, getPresetRange } from "@/lib/dates/presets";

const DateRangeCalendar = dynamic(() => import("@/components/dashboard/DateRangeCalendar"), {
  ssr: false,
  loading: () => <div className="w-full h-72 rounded-2xl bg-slate-900/40 animate-pulse border border-white/5" />,
});

interface Props {
  preset: DatePreset;
  startDate: Date;
  endDate: Date;
  /** Se llama con el preset y su rango ya calculado. */
  onChange: (next: { preset: DatePreset; startDate: Date; endDate: Date }) => void;
}

const FIXED_PRESETS = Object.keys(DATE_PRESET_LABELS) as FixedDatePreset[];

const buttonClass = (active: boolean) =>
  `min-h-[44px] sm:min-h-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
    active
      ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
      : "!text-slate-400 hover:!text-white hover:!bg-white/5"
  }`;

export function formatPeriod(startDate: Date, endDate: Date): string {
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };
  return `${startDate.toLocaleDateString("es-AR", opts)} — ${endDate.toLocaleDateString("es-AR", opts)}`;
}

/** Selector de período de Balance, Gastos y Liquidaciones. */
export default function DatePresetSelector({ preset, startDate, endDate, onChange }: Readonly<Props>) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {FIXED_PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setShowCustomPicker(false);
              const { start, end } = getPresetRange(p);
              onChange({ preset: p, startDate: start, endDate: end });
            }}
            className={buttonClass(preset === p)}
          >
            {DATE_PRESET_LABELS[p]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCustomPicker((v) => !v)}
          className={buttonClass(preset === "custom")}
          aria-expanded={showCustomPicker}
        >
          <Calendar className="w-3 h-3" />
          <span>Personalizado</span>
          {showCustomPicker ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      <div className="flex flex-wrap items-center text-xs text-slate-400 gap-2 bg-slate-950/60 px-3.5 py-2 rounded-xl border border-white/5">
        <Calendar className="w-4 h-4 text-[var(--accent)]" />
        <span>Período consultado:</span>
        <span className="font-semibold text-white">{formatPeriod(startDate, endDate)}</span>
      </div>

      {showCustomPicker && (
        <div className="dashboard-card p-4 max-w-sm border border-[var(--accent)]/30 animate-in fade-in slide-in-from-top-2 duration-200">
          <DateRangeCalendar
            startDate={startDate}
            endDate={endDate}
            onChange={(range) => onChange({ preset: "custom", startDate: range.startDate, endDate: range.endDate })}
          />
        </div>
      )}
    </div>
  );
}
