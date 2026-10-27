"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSalesPage } from "@/lib/repository/sales";
import Spinner from "@/components/loading/Spinner";
import { SaleWithRelations } from "@/lib/types/Sale";
import { Receipt } from "lucide-react";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const PAGE_SIZE = 10;

export default function SalesTable() {
  const router = useRouter();
  const { isEnabled } = useBusinessContext();
  const ARCA_ENABLED = isEnabled("arca");

  const [sales, setSales] = useState<SaleWithRelations[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadPage = async (pageToLoad: number) => {
    setLoading(true);
    const result = await getSalesPage(pageToLoad, PAGE_SIZE);
    setSales(result.data);
    setTotal(result.total);
    setLoading(false);
  };

  useEffect(() => {
    void loadPage(page);
  }, [page]);

  const handlePrev = () => {
    setPage((p) => Math.max(1, p - 1));
  };

  const handleNext = () => {
    setPage((p) => Math.min(totalPages, p + 1));
  };

  return (
    <div className="w-full space-y-4">
      {loading && (
        <div className="flex justify-center mb-3">
          <Spinner />
        </div>
      )}

      {!loading && sales.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-10 bg-[var(--background)] rounded-xl border border-[var(--border)]">
          No hay ventas registradas.
        </p>
      )}

      {sales.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] shadow-md bg-[var(--background)]">
            <table className="w-full text-left text-xs md:text-sm whitespace-nowrap">
              <thead className="bg-slate-900/80 text-slate-300 text-[11px] font-bold tracking-wider border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3.5">Fecha</th>
                  <th className="px-4 py-3.5">Barbero</th>
                  <th className="px-4 py-3.5">Producto</th>
                  <th className="px-4 py-3.5">Precio</th>
                  <th className="px-4 py-3.5">Cant.</th>
                  <th className="px-4 py-3.5">Total</th>
                  <th className="px-4 py-3.5">Detalles</th>
                  {ARCA_ENABLED && <th className="px-4 py-3.5">Factura</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/60 text-[var(--foreground)]">
                {sales.map((sale) => {
                  const dateLabel = sale.created_at
                    ? format(new Date(sale.created_at), "EEE d MMM yyyy", { locale: es })
                    : "-";

                  const barberName = sale.barbers?.name ?? "-";
                  const productName = sale.products?.name ?? "-";

                  return (
                    <tr
                      key={sale.id}
                      onClick={() => sale.id != null && router.push(`/venta/${sale.id}`)}
                      className="hover:bg-white/10 active:scale-[0.99] transition-all cursor-pointer align-middle"
                    >
                      <td className="px-4 py-3 capitalize font-medium text-slate-200">
                        {dateLabel}
                      </td>

                      <td className="px-4 py-3 text-slate-300 font-medium">
                        {barberName}
                      </td>

                      <td className="px-4 py-3 font-semibold text-[var(--foreground)]">
                        {productName}
                      </td>

                      <td className="px-4 py-3 text-slate-300">
                        ${sale.price.toLocaleString("es-AR")}
                      </td>

                      <td className="px-4 py-3 text-slate-300">
                        {sale.quantity}
                      </td>

                      <td className="px-4 py-3 font-bold text-[var(--accent)]">
                        ${sale.total.toLocaleString("es-AR")}
                      </td>

                      <td className="px-4 py-3 text-slate-400">
                        {sale.details || "—"}
                      </td>

                      {ARCA_ENABLED && (
                        <td className="px-4 py-3">
                          {sale.arca_invoice_id ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-medium whitespace-nowrap">
                              <Receipt className="w-3 h-3" />
                              Emitida
                            </span>
                          ) : (
                            <span className="text-[var(--foreground)]/30 text-xs">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 text-xs md:text-sm">
            <span className="text-gray-400">
              Página {page} de {totalPages} — Total: {total} ventas
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg !bg-white/5 hover:!bg-white/10 !text-slate-200 hover:!text-white !border !border-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-xs cursor-pointer"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg !bg-white/5 hover:!bg-white/10 !text-slate-200 hover:!text-white !border !border-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-xs cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
