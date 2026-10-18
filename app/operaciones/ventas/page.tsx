"use client";

import SalesTable from "@/components/sales/SalesTable";
import BackButton from "@/components/ui/BackButton";

export default function OperacionesVentasPage() {
  return (
    <div className="p-4 md:p-8 w-full max-w-[1720px] mx-auto space-y-6">
      <BackButton href="/operaciones" label="Operaciones" />
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">
          Ventas de productos
        </h1>
      </div>

      <SalesTable />
    </div>
  );
}

