"use client";

import { useState } from "react";
import useSWR from "swr";
import { ChevronLeft, ChevronRight, Info, Loader2 } from "lucide-react";
import { todayInArgentina, addDaysToDay } from "@/lib/dates/argentina";
import { getCashSummary } from "@/lib/repository/cash";
import { formatARS } from "@/lib/format/currency";

function formatDisplayDate(day: string): string {
  const [y, m, d] = day.split("-");
  return `${d}/${m}/${y}`;
}

function getDayLabel(day: string, today: string): string {
  if (day === today) return "Hoy";
  if (day === addDaysToDay(today, -1)) return "Ayer";
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("es-AR", {
    timeZone: "UTC",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });
}

export default function CajaDiariaSection() {
  const today = todayInArgentina();
  const [day, setDay] = useState(today);
  const isToday = day === today;

  const { data: res, error: swrError, isLoading } = useSWR(
    ["cash-day", day],
    () => getCashSummary({ startDate: day, endDate: day }),
    { revalidateOnFocus: true }
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Caja</h2>
          <p className="text-xs text-slate-400 mt-1">
            Lo que entró y salió en el día, por medio de pago
          </p>
        </div>
      </div>

      {/* Navegación de días */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setDay(addDaysToDay(day, -1))}
            aria-label="Día anterior"
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-white/5 text-slate-300 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center flex-1 min-w-0 px-2">
            <p className="text-sm font-bold text-[var(--foreground)] truncate">
              {getDayLabel(day, today)}
            </p>
            <p className="text-[11px] text-slate-400">
              {formatDisplayDate(day)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDay(addDaysToDay(day, 1))}
            aria-label="Día siguiente"
            disabled={isToday}
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-white/5 text-slate-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {!isToday && (
          <button
            type="button"
            onClick={() => setDay(today)}
            className="text-xs text-[var(--accent)] hover:underline font-semibold min-h-[44px] inline-flex items-center justify-center self-center sm:self-auto px-2 cursor-pointer"
          >
            Volver a hoy
          </button>
        )}
      </div>

      {/* Contenido */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
        </div>
      ) : swrError || !res?.success || !res.data ? (
        <p className="text-sm text-red-400 text-center py-16">
          {swrError?.message ?? res?.error ?? "No se pudo cargar la caja"}
        </p>
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--background)]">
            <table className="w-full text-left text-xs md:text-sm whitespace-nowrap">
              <thead className="bg-slate-900/80 text-slate-300 text-[11px] font-bold tracking-wider border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3.5">Medio</th>
                  <th className="px-4 py-3.5 text-right">Entró</th>
                  <th className="px-4 py-3.5 text-right">Salió</th>
                  <th className="px-4 py-3.5 text-right">Debería haber</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/60 text-[var(--foreground)]">
                {res.data.rows.map((row) => (
                  <tr key={row.method}>
                    <td className="px-4 py-3 font-semibold">{row.method}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{formatARS(row.income)}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{formatARS(row.outcome)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${row.net < 0 ? "text-red-400" : ""}`}>
                      {formatARS(row.net)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-white/5 border-t border-[var(--border)]">
                  <td className="px-4 py-3 font-bold">Total</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatARS(res.data.totals.income)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatARS(res.data.totals.outcome)}</td>
                  <td
                    className={`px-4 py-3 text-right font-bold ${
                      res.data.totals.net < 0 ? "text-red-400" : "text-[var(--accent)]"
                    }`}
                  >
                    {formatARS(res.data.totals.net)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
            <Info className="w-4 h-4 shrink-0 text-slate-400" />
            <span>Si no coincide, revisá que estén cobrados todos los turnos y ventas del día</span>
          </div>
        </div>
      )}
    </div>
  );
}
