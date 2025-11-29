"use client";

import SalesTable from "@/components/sales/SalesTable";

export default function AdminVentasPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-center">
        Ventas de productos
      </h1>

      <SalesTable />
    </div>
  );
}
