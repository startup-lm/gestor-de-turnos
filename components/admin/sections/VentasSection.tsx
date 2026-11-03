"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import SalesTable from "@/components/sales/SalesTable";
import SaleSplitPanel from "@/components/sales/SaleSplitPanel";

export default function VentasSection() {
  const [viewMode, setViewMode] = useState<"list" | "new-sale">("list");
  const [refreshKey, setRefreshKey] = useState(0);

  if (viewMode === "new-sale") {
    return (
      <SaleSplitPanel
        onClose={() => setViewMode("list")}
        onSaleCreated={() => {
          setViewMode("list");
          setRefreshKey((k) => k + 1);
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Ventas
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Historial de ventas y registro de compras en el local
          </p>
        </div>
        <button
          type="button"
          onClick={() => setViewMode("new-sale")}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl !bg-[var(--accent)] hover:!bg-[var(--accent-hover)] !text-slate-950 font-bold text-sm shadow-md shadow-[var(--accent)]/15 transition-all hover:scale-105 active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nueva venta</span>
        </button>
      </div>

      <div className="w-full">
        <SalesTable key={refreshKey} />
      </div>
    </div>
  );
}
