"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSales } from "@/lib/repository/sales";
import { SalesTableSkeleton } from "@/components/loading/Skeleton";
import { SaleWithRelations } from "@/lib/types/Sale";
import { Receipt, Calendar, RefreshCw } from "lucide-react";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type PeriodPreset = "week" | "today" | "month" | "last_month" | "custom" | "all";

function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function SalesTable() {
  const router = useRouter();
  const { isEnabled } = useBusinessContext();
  const ARCA_ENABLED = isEnabled("arca");

  const [sales, setSales] = useState<SaleWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Period filter state - Default: "Esta semana"
  const [preset, setPreset] = useState<PeriodPreset>("week");

  // Calculate default week dates (Monday to Sunday)
  const defaultWeekDates = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: formatDateISO(monday),
      end: formatDateISO(sunday),
    };
  }, []);

  const [customStart, setCustomStart] = useState<string>(defaultWeekDates.start);
  const [customEnd, setCustomEnd] = useState<string>(defaultWeekDates.end);

  const fetchSales = useCallback(async (start?: string, end?: string) => {
    setLoading(true);
    try {
      const data = await getSales(start, end);
      setSales(data);
    } catch (err) {
      console.error("Error al cargar ventas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Compute active date boundaries according to current preset
  useEffect(() => {
    const now = new Date();

    if (preset === "today") {
      const todayStr = formatDateISO(now);
      fetchSales(todayStr, todayStr);
    } else if (preset === "week") {
      fetchSales(defaultWeekDates.start, defaultWeekDates.end);
    } else if (preset === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      fetchSales(formatDateISO(start), formatDateISO(end));
    } else if (preset === "last_month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      fetchSales(formatDateISO(start), formatDateISO(end));
    } else if (preset === "custom") {
      if (customStart && customEnd) {
        fetchSales(customStart, customEnd);
      }
    } else if (preset === "all") {
      fetchSales();
    }
  }, [preset, defaultWeekDates, fetchSales, customStart, customEnd]);

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      fetchSales(customStart, customEnd);
    }
  };

  // Search filter
  const filteredSales = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return sales;

    return sales.filter((sale) => {
      const productMatch = sale.products?.name?.toLowerCase().includes(term);
      const barberMatch = sale.barbers?.name?.toLowerCase().includes(term);
      const detailsMatch = sale.details?.toLowerCase().includes(term);
      const priceMatch =
        sale.price.toString().includes(term) ||
        sale.total.toString().includes(term);
      return productMatch || barberMatch || detailsMatch || priceMatch;
    });
  }, [sales, searchTerm]);

  return (
    <div className="w-full space-y-4">
      {/* Barra de Filtro de Período (Idéntica a TurnosSection) */}
      <div className="bg-[var(--foreground)]/5 p-4 rounded-2xl border border-[var(--foreground)]/10 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Calendar className="w-4 h-4 text-[var(--accent)]" />
            <span>Filtrar por período:</span>
          </div>

          {/* Selector de Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPreset("week")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                preset === "week"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                  : "!text-slate-400 hover:!text-white hover:!bg-white/5"
              }`}
            >
              Esta semana
            </button>
            <button
              type="button"
              onClick={() => setPreset("today")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                preset === "today"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                  : "!text-slate-400 hover:!text-white hover:!bg-white/5"
              }`}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setPreset("month")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                preset === "month"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                  : "!text-slate-400 hover:!text-white hover:!bg-white/5"
              }`}
            >
              Este mes
            </button>
            <button
              type="button"
              onClick={() => setPreset("last_month")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                preset === "last_month"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                  : "!text-slate-400 hover:!text-white hover:!bg-white/5"
              }`}
            >
              Mes pasado
            </button>
            <button
              type="button"
              onClick={() => setPreset("custom")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                preset === "custom"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                  : "!text-slate-400 hover:!text-white hover:!bg-white/5"
              }`}
            >
              Personalizado
            </button>
            <button
              type="button"
              onClick={() => setPreset("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                preset === "all"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                  : "!text-slate-400 hover:!text-white hover:!bg-white/5"
              }`}
            >
              Todos
            </button>
          </div>
        </div>

        {/* Inputs de rango personalizado cuando está activo */}
        {preset === "custom" && (
          <form
            onSubmit={handleApplyCustom}
            className="pt-3 border-t border-[var(--foreground)]/10 flex flex-wrap items-center gap-3 animate-in fade-in duration-200"
          >
            <div className="flex items-center gap-2">
              <label htmlFor="ventas-custom-start" className="text-xs text-slate-400 font-medium">Desde:</label>
              <input
                id="ventas-custom-start"
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="p-1.5 rounded-lg border border-[var(--foreground)]/15 bg-[var(--background)] text-xs text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="ventas-custom-end" className="text-xs text-slate-400 font-medium">Hasta:</label>
              <input
                id="ventas-custom-end"
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="p-1.5 rounded-lg border border-[var(--foreground)]/15 bg-[var(--background)] text-xs text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg !bg-[var(--accent)] !text-slate-950 text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Aplicar filtro
            </button>
          </form>
        )}
      </div>

      {/* Barra de Búsqueda y Contador (Idéntica a AdminTurnosClient) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por producto, barbero o detalles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-md p-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none transition-all shadow-inner"
        />
        <div className="text-xs text-slate-400 font-semibold bg-[var(--foreground)]/5 px-3 py-1.5 rounded-lg border border-[var(--foreground)]/10">
          {filteredSales.length} {filteredSales.length === 1 ? "venta encontrada" : "ventas encontradas"}
        </div>
      </div>

      {/* Estado de carga con Skeleton */}
      {loading && <SalesTableSkeleton />}

      {/* Estado vacío */}
      {!loading && filteredSales.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-10 bg-[var(--background)] rounded-xl border border-[var(--border)]">
          {sales.length === 0
            ? "No hay ventas registradas en el período seleccionado."
            : "No se encontraron ventas con los criterios de búsqueda."}
        </p>
      )}

      {/* Tabla de Ventas */}
      {!loading && filteredSales.length > 0 && (
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
                <th className="px-4 py-3.5">Medio de pago</th>
                <th className="px-4 py-3.5">Detalles</th>
                {ARCA_ENABLED && <th className="px-4 py-3.5">Factura</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/60 text-[var(--foreground)]">
              {filteredSales.map((sale) => {
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

                    <td className="px-4 py-3 text-slate-300">
                      {sale.payment_method ?? "—"}
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
      )}
    </div>
  );
}
