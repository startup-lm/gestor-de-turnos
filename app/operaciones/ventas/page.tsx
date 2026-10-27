"use client";

import { useState } from "react";
import SalesTable from "@/components/sales/SalesTable";
import SaleSplitPanel from "@/components/sales/SaleSplitPanel";
import BackButton from "@/components/ui/BackButton";
import { Plus } from "lucide-react";

export default function OperacionesVentasPage() {
  const [viewMode, setViewMode] = useState<"list" | "new-sale">("list");
  const [refreshKey, setRefreshKey] = useState(0);

  if (viewMode === "new-sale") {
    return (
      <div className="p-4 md:p-8 w-full max-w-[1720px] mx-auto space-y-6">
        <SaleSplitPanel
          onClose={() => setViewMode("list")}
          onSaleCreated={() => {
            setViewMode("list");
            setRefreshKey((k) => k + 1);
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 w-full max-w-[1720px] mx-auto space-y-6">
      <div className="w-full">
        <BackButton href="/operaciones" label="Operaciones" />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">
            Ventas de productos
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registro y control de compras en el salón
          </p>
        </div>

        <button
          type="button"
          onClick={() => setViewMode("new-sale")}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl !bg-[var(--accent)] hover:!bg-[#E8CA8C] !text-slate-950 font-bold text-sm shadow-md shadow-[var(--accent)]/15 transition-all hover:scale-105 active:scale-95 cursor-pointer self-start sm:self-auto"
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
