"use client";

import React, { useState, useMemo } from "react";
import { Barber } from "@/lib/types/Barbers";
import DateRangeCalendar from "./DateRangeCalendar";
import { Calendar, User, ChevronDown, ChevronUp, Users, Check } from "lucide-react";

export type DatePreset = "today" | "week" | "month" | "last_month" | "custom";

interface DashboardToolbarProps {
  barbers: Barber[];
  selectedBarberId: number;
  onBarberChange: (id: number) => void;
  startDate: Date;
  endDate: Date;
  onDateChange: (range: { startDate: Date; endDate: Date }) => void;
  showAll?: boolean;
}

export default function DashboardToolbar({
  barbers,
  selectedBarberId,
  onBarberChange,
  startDate,
  endDate,
  onDateChange,
  showAll = true,
}: Readonly<DashboardToolbarProps>) {
  const [preset, setPreset] = useState<DatePreset>("month");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBarberMenu, setShowBarberMenu] = useState(false);

  const handleSelectPreset = (p: DatePreset) => {
    setPreset(p);
    const now = new Date();

    if (p === "today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      onDateChange({ startDate: start, endDate: end });
      setShowDatePicker(false);
    } else if (p === "week") {
      const currentDay = now.getDay();
      const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59);
      onDateChange({ startDate: monday, endDate: sunday });
      setShowDatePicker(false);
    } else if (p === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      onDateChange({ startDate: start, endDate: end });
      setShowDatePicker(false);
    } else if (p === "last_month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      onDateChange({ startDate: start, endDate: end });
      setShowDatePicker(false);
    } else if (p === "custom") {
      setShowDatePicker(true);
    }
  };

  const handleCustomRangeChange = (range: { startDate: Date; endDate: Date }) => {
    onDateChange(range);
    setPreset("custom");
  };

  const selectedBarberName = useMemo(() => {
    if (selectedBarberId === 0) return "Todos los profesionales";
    return barbers.find((b) => b.id === selectedBarberId)?.name ?? "Seleccionar barbero";
  }, [barbers, selectedBarberId]);

  const formattedRange = useMemo(() => {
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
    return `${startDate.toLocaleDateString("es-AR", opts)} — ${endDate.toLocaleDateString("es-AR", opts)}`;
  }, [startDate, endDate]);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Barra de Filtros Principal */}
      <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/60 p-2.5 sm:p-3 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg">
        {/* Selector de Barbero */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowBarberMenu(!showBarberMenu)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-all cursor-pointer w-full sm:w-auto justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[10px] font-bold text-[var(--accent)]">
                {selectedBarberId === 0 ? <Users className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>
              <span className="truncate max-w-[170px]">{selectedBarberName}</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showBarberMenu ? "rotate-180" : ""}`} />
          </button>

          {/* Menú Dropdown de Barberos */}
          {showBarberMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowBarberMenu(false)}
              />
              <div className="absolute left-0 top-full mt-2 w-64 bg-slate-950/95 border border-white/10 rounded-xl shadow-2xl p-1.5 z-40 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                {showAll && (
                  <button
                    type="button"
                    onClick={() => {
                      onBarberChange(0);
                      setShowBarberMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      selectedBarberId === 0
                        ? "!bg-[var(--accent)]/15 !text-[var(--accent)] font-bold"
                        : "text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[var(--accent)]" />
                      <span>Todos los profesionales</span>
                    </div>
                    {selectedBarberId === 0 && <Check className="w-4 h-4 text-[var(--accent)]" />}
                  </button>
                )}

                <div className="my-1 border-t border-white/5" />

                <div className="max-h-56 overflow-y-auto space-y-0.5">
                  {barbers.map((barber) => {
                    const isSelected = selectedBarberId === barber.id;
                    return (
                      <button
                        key={barber.id}
                        type="button"
                        onClick={() => {
                          onBarberChange(barber.id ?? 0);
                          setShowBarberMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? "!bg-[var(--accent)]/15 !text-[var(--accent)] font-bold"
                            : "text-slate-300 hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-300">
                            {barber.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="truncate">{barber.name}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[var(--accent)]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Presets de Fecha (Hoy, Semana, Mes, Mes pasado, Personalizado) */}
        <div className="flex items-center flex-wrap gap-1.5">
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-950/50 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => handleSelectPreset("today")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                preset === "today"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                  : "!text-slate-400 hover:!text-white hover:!bg-white/5"
              }`}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset("week")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                preset === "week"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                  : "!text-slate-400 hover:!text-white hover:!bg-white/5"
              }`}
            >
              Esta semana
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset("month")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                preset === "month"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                  : "!text-slate-400 hover:!text-white hover:!bg-white/5"
              }`}
            >
              Este mes
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset("last_month")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer hidden sm:inline-block ${
                preset === "last_month"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                  : "!text-slate-400 hover:!text-white hover:!bg-white/5"
              }`}
            >
              Mes pasado
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset("custom")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                preset === "custom"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                  : "!text-slate-400 hover:!text-white hover:!bg-white/5"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Personalizado</span>
              {showDatePicker ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Rango de Fechas Activo Informativo */}
      <div className="flex items-center text-xs text-slate-400 gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900/40 border border-white/5">
        <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
        <span>Período visualizado:</span>
        <span className="font-semibold text-white">{formattedRange}</span>
      </div>

      {/* Popover de Fecha Personalizada */}
      {showDatePicker && (
        <div className="dashboard-card p-4 max-w-sm border border-[var(--accent)]/30 animate-in fade-in slide-in-from-top-2 duration-200 self-end">
          <DateRangeCalendar
            startDate={startDate}
            endDate={endDate}
            onChange={handleCustomRangeChange}
          />
        </div>
      )}
    </div>
  );
}
