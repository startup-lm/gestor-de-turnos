"use client";

import { useState } from "react";
import SalesTable from "@/components/sales/SalesTable";
import RegisterSaleModal from "@/components/sales/RegisterSaleModal";
import BackButton from "@/components/ui/BackButton";

export default function AdminVentasPage() {
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <BackButton href="/admin" label="Panel Admin" />
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">
          Ventas de productos
        </h1>
        <button
          onClick={() => setIsSaleModalOpen(true)}
          className="bg-[var(--primary)] text-[var(--background)] px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          + Nueva Venta
        </button>
      </div>

      <SalesTable />

      {isSaleModalOpen && (
        <RegisterSaleModal onClose={() => setIsSaleModalOpen(false)} />
      )}
    </div>
  );
}
