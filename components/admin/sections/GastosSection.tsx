"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Barber } from "@/lib/types/Barbers";
import ExpensesHistoryTable from "@/components/finanzas/ExpensesHistoryTable";
import ExpenseModal from "@/components/finanzas/ExpenseModal";
import AdvanceModal from "@/components/finanzas/AdvanceModal";
import {
  TrendingDown,
  HandCoins,
  Plus,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const DateRangeCalendar = dynamic(
  () => import("@/components/dashboard/DateRangeCalendar"),
  { ssr: false, loading: () => <div className="w-full h-72 rounded-2xl bg-slate-900/40 animate-pulse border border-white/5" /> }
);

interface Props {
  barbers: Barber[];
}

type DatePreset = "today" | "week" | "month" | "last_month" | "custom";

export default function GastosSection({ barbers }: Readonly<Props>) {
  const [preset, setPreset] = useState<DatePreset>("month");
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);

  const initialDates = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { start: startOfMonth, end: endOfMonth };
  }, []);

  const [startDate, setStartDate] = useState<Date>(initialDates.start);
  const [endDate, setEndDate] = useState<Date>(initialDates.end);

  const handleSelectPreset = (p: DatePreset) => {
    setPreset(p);
    const now = new Date();

    if (p === "today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      setStartDate(start);
      setEndDate(end);
      setShowCustomPicker(false);
    } else if (p === "week") {
      const currentDay = now.getDay();
      const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59);
      setStartDate(monday);
      setEndDate(sunday);
      setShowCustomPicker(false);
    } else if (p === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      setStartDate(start);
      setEndDate(end);
      setShowCustomPicker(false);
    } else if (p === "last_month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      setStartDate(start);
      setEndDate(end);
      setShowCustomPicker(false);
    } else if (p === "custom") {
      setShowCustomPicker(true);
    }
  };

  const handleDateChange = (range: { startDate: Date; endDate: Date }) => {
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setPreset("custom");
  };

  const formattedRange = useMemo(() => {
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
    return `${startDate.toLocaleDateString("es-AR", opts)} — ${endDate.toLocaleDateString("es-AR", opts)}`;
  }, [startDate, endDate]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full">
      {/* Cabecera */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <TrendingDown className="w-4 h-4" />
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Gastos y egresos del local
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Registro y control de compras, insumos, servicios y adelantos a profesionales
          </p>
        </div>

        {/* Acciones Rápidas y Selector de Fechas */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsAdvanceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold transition-all cursor-pointer shadow-sm flex-1 sm:flex-none justify-center"
            >
              <HandCoins className="w-3.5 h-3.5" />
              <span>Dar adelanto</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl !bg-red-500 hover:!bg-red-600 !text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-red-500/15 flex-1 sm:flex-none justify-center"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Nuevo gasto</span>
            </button>
          </div>

          {/* Selector de Presets */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-900/60 border border-white/10 text-xs">
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
              {showCustomPicker ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Rango informativo */}
      <div className="flex items-center text-xs text-slate-400 gap-2 bg-slate-900/40 px-3.5 py-2.5 rounded-xl border border-white/5">
        <Calendar className="w-4 h-4 text-[var(--accent)]" />
        <span>Período consultado:</span>
        <span className="font-semibold text-white">{formattedRange}</span>
      </div>

      {showCustomPicker && (
        <div className="dashboard-card p-4 max-w-sm border border-[var(--accent)]/30 animate-in fade-in slide-in-from-top-2 duration-200">
          <DateRangeCalendar
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateChange}
          />
        </div>
      )}

      {/* Tabla de movimientos de egreso */}
      <ExpensesHistoryTable
        startDate={startDate}
        endDate={endDate}
        refreshKey={refreshKey}
        onOpenNewExpense={() => setIsExpenseModalOpen(true)}
        onOpenNewAdvance={() => setIsAdvanceModalOpen(true)}
      />

      {/* Modales */}
      {isExpenseModalOpen && (
        <ExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {isAdvanceModalOpen && (
        <AdvanceModal
          isOpen={isAdvanceModalOpen}
          onClose={() => setIsAdvanceModalOpen(false)}
          onSuccess={() => setRefreshKey((k) => k + 1)}
          barbers={barbers}
        />
      )}
    </div>
  );
}
