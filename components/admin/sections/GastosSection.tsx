"use client";

import React, { useState, useMemo } from "react";
import { Barber } from "@/lib/types/Barbers";
import ExpensesHistoryTable from "@/components/finanzas/ExpensesHistoryTable";
import ExpensePanel from "@/components/finanzas/ExpensePanel";
import AdvancePanel from "@/components/finanzas/AdvancePanel";
import DatePresetSelector from "@/components/admin/DatePresetSelector";
import { DatePreset, getPresetRange } from "@/lib/dates/presets";
import {
  TrendingDown,
  HandCoins,
  Plus,
} from "lucide-react";

interface Props {
  barbers: Barber[];
}

type ViewMode = "list" | "new-expense" | "new-advance";

export default function GastosSection({ barbers }: Readonly<Props>) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const initialRange = useMemo(() => getPresetRange("month"), []);
  const [preset, setPreset] = useState<DatePreset>("month");
  const [startDate, setStartDate] = useState<Date>(initialRange.start);
  const [endDate, setEndDate] = useState<Date>(initialRange.end);
  const [refreshKey, setRefreshKey] = useState(0);

  if (viewMode === "new-expense") {
    return (
      <ExpensePanel
        onClose={() => setViewMode("list")}
        onSuccess={() => {
          setViewMode("list");
          setRefreshKey((k) => k + 1);
        }}
      />
    );
  }

  if (viewMode === "new-advance") {
    return (
      <AdvancePanel
        barbers={barbers}
        onClose={() => setViewMode("list")}
        onSuccess={() => {
          setViewMode("list");
          setRefreshKey((k) => k + 1);
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <TrendingDown className="w-4 h-4" />
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Gastos
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Registro y control de compras, insumos, servicios y adelantos a profesionales
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setViewMode("new-advance")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold transition-all cursor-pointer shadow-sm flex-1 sm:flex-none justify-center min-h-[44px] sm:min-h-0"
          >
            <HandCoins className="w-3.5 h-3.5" />
            <span>Dar adelanto</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("new-expense")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl !bg-red-500 hover:!bg-red-600 !text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-red-500/15 flex-1 sm:flex-none justify-center min-h-[44px] sm:min-h-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Nuevo gasto</span>
          </button>
        </div>
      </div>

      {/* Selector de Período */}
      <DatePresetSelector
        preset={preset}
        startDate={startDate}
        endDate={endDate}
        onChange={({ preset: nextPreset, startDate: nextStart, endDate: nextEnd }) => {
          setPreset(nextPreset);
          setStartDate(nextStart);
          setEndDate(nextEnd);
        }}
      />

      {/* Tabla de movimientos de egreso */}
      <ExpensesHistoryTable
        startDate={startDate}
        endDate={endDate}
        refreshKey={refreshKey}
      />
    </div>
  );
}
