"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import SalesTable from "@/components/sales/SalesTable";
import RegisterSaleModal from "@/components/sales/RegisterSaleModal";

export default function VentasSection() {
  const [showSaleModal, setShowSaleModal] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Ventas de Productos
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Historial de ventas y registro de compras en el local
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowSaleModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold !bg-[var(--accent)] hover:!bg-[#E8CA8C] !text-slate-950 transition-all cursor-pointer shadow-md shadow-[var(--accent)]/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nueva Venta
        </button>
      </div>

      <SalesTable />

      {showSaleModal && <RegisterSaleModal onClose={() => setShowSaleModal(false)} />}
    </div>
  );
}
