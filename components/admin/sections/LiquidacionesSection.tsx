"use client";

import React, { useState } from "react";
import { Barber } from "@/lib/types/Barbers";
import PayoutsHistoryTable from "@/components/finanzas/PayoutsHistoryTable";
import LiquidationPanel from "@/components/finanzas/LiquidationPanel";
import { Receipt, Plus } from "lucide-react";

interface Props {
  barbers: Barber[];
}

type ViewMode = "list" | "new-liquidation";

export default function LiquidacionesSection({ barbers }: Readonly<Props>) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [refreshKey, setRefreshKey] = useState<number>(0);

  if (viewMode === "new-liquidation") {
    return (
      <LiquidationPanel
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
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Receipt className="w-4 h-4" />
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Liquidaciones
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Liquidaciones registradas por profesional. Podés anular una si te equivocaste.
          </p>
        </div>

        {/* Botón de acción para nueva liquidación */}
        <div>
          <button
            type="button"
            onClick={() => setViewMode("new-liquidation")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl !bg-[var(--accent)] hover:opacity-90 !text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-md shadow-[var(--accent)]/15 hover:scale-105 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Nueva liquidación</span>
          </button>
        </div>
      </div>

      {/* Tabla de liquidaciones */}
      <PayoutsHistoryTable barbers={barbers} refreshKey={refreshKey} />
    </div>
  );
}
