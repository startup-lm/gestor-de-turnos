"use client";

import React from "react";
import { Barber } from "@/lib/types/Barbers";
import PayoutsHistoryTable from "@/components/finanzas/PayoutsHistoryTable";
import { Receipt } from "lucide-react";

interface Props {
  barbers: Barber[];
}

export default function LiquidacionesSection({ barbers }: Readonly<Props>) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full">
      {/* Cabecera */}
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Receipt className="w-4 h-4" />
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            Historial de liquidaciones
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          Registro histórico de comisiones abonadas a profesionales, recibos digitales emitidos y copia para WhatsApp
        </p>
      </div>

      {/* Tabla de liquidaciones */}
      <PayoutsHistoryTable barbers={barbers} />
    </div>
  );
}
