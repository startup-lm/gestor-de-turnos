"use client";

import { useState } from "react";
import useSWR from "swr";
import { AlertTriangle, ArrowLeft, Loader2, Lock, Wallet } from "lucide-react";
import { ActionButton } from "@/components/buttons/ActionButton";
import { catalogInputClass, catalogLabelClass } from "@/components/admin/catalog/styles";
import { formatARS } from "@/lib/format/currency";
import { toast } from "@/lib/store/useToastStore";
import { useAuth } from "@/lib/auth/AuthContext";
import { CASH_METHOD } from "@/lib/finance/cashShift";
import type { CashShift, CashShiftExpectedRow } from "@/lib/types/cash";

interface CashState {
  shift: CashShift | null;
  expected: CashShiftExpectedRow[] | null;
  reminderDue: boolean;
  history: CashShift[] | null;
}

const CASH_KEY = "/api/cash/shifts";

async function fetchCash(url: string): Promise<CashState> {
  const res = await fetch(url);
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "No se pudo cargar la caja");
  return res.json();
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "Cuadra", "Faltan $X" o "Sobran $X" según lo contado contra lo esperado */
function DifferenceLabel({ difference }: Readonly<{ difference: number }>) {
  const rounded = Math.round(difference);
  if (rounded === 0) return <span className="text-emerald-400 font-semibold">Cuadra</span>;
  if (rounded < 0) return <span className="text-red-400 font-semibold">Faltan {formatARS(-rounded)}</span>;
  return <span className="text-amber-400 font-semibold">Sobran {formatARS(rounded)}</span>;
}

export default function CajaSection() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const { data, error, isLoading, mutate } = useSWR<CashState>(CASH_KEY, fetchCash, { revalidateOnFocus: true });
  const [viewMode, setViewMode] = useState<"summary" | "close">("summary");

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
      </div>
    );
  }
  if (error || !data) {
    return <p className="text-sm text-red-400 text-center py-16">{error?.message ?? "No se pudo cargar la caja"}</p>;
  }

  if (viewMode === "close" && data.shift && data.expected) {
    return (
      <CloseShiftView
        shift={data.shift}
        expected={data.expected}
        onBack={() => setViewMode("summary")}
        onClosed={() => {
          setViewMode("summary");
          void mutate();
        }}
      />
    );
  }

  const { shift, expected, reminderDue, history } = data;
  const totals = (expected ?? []).reduce(
    (acc, r) => ({ income: acc.income + r.income, outcome: acc.outcome + r.outcome, expected: acc.expected + r.expected }),
    { income: 0, outcome: 0, expected: 0 }
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Caja</h2>
          <p className="text-xs text-slate-400 mt-1">
            Lo que entró desde el último cierre. Al final del día, contá la plata y cerrá la caja
          </p>
        </div>
        {shift && (
          <ActionButton
            name="Cerrar caja"
            Icon={Lock}
            onClick={() => setViewMode("close")}
            className="min-h-[44px] self-start sm:self-auto"
          />
        )}
      </div>

      {shift && reminderDue && (
        <div className="flex items-start gap-2.5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-sm text-amber-200">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400" />
          <span>La caja no se cierra desde el {formatDateTime(shift.opened_at)}. Contá la plata y cerrala.</span>
        </div>
      )}

      {!shift ? (
        <div className="flex flex-col items-center gap-2 py-12 rounded-xl border border-[var(--border)] bg-[var(--background)] text-center px-4">
          <Wallet className="w-6 h-6 text-slate-500" />
          <p className="text-sm text-slate-300 font-medium">No hubo cobros desde el último cierre</p>
          <p className="text-xs text-slate-500">El próximo cobro, venta o gasto empieza una caja nueva</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">Desde el {formatDateTime(shift.opened_at)}</p>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] shadow-md bg-[var(--background)]">
            <table className="w-full text-left text-xs md:text-sm whitespace-nowrap">
              <thead className="bg-slate-900/80 text-slate-300 text-[11px] font-bold tracking-wider border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3.5">Medio de pago</th>
                  <th className="px-4 py-3.5 text-right">Cobros</th>
                  <th className="px-4 py-3.5 text-right">Egresos</th>
                  <th className="px-4 py-3.5 text-right">Debería haber</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/60 text-[var(--foreground)]">
                {(expected ?? []).map((row) => (
                  <tr key={row.method}>
                    <td className="px-4 py-3 font-semibold">{row.method}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{formatARS(row.income)}</td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      {row.outcome > 0 ? `−${formatARS(row.outcome)}` : formatARS(0)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">{formatARS(row.expected)}</td>
                  </tr>
                ))}
                <tr className="bg-white/5">
                  <td className="px-4 py-3 font-bold">Total</td>
                  <td className="px-4 py-3 text-right">{formatARS(totals.income)}</td>
                  <td className="px-4 py-3 text-right">
                    {totals.outcome > 0 ? `−${formatARS(totals.outcome)}` : formatARS(0)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[var(--accent)]">{formatARS(totals.expected)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isAdmin && history && history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[var(--foreground)]">Últimos cierres</h3>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--background)]">
            <table className="w-full text-left text-xs md:text-sm whitespace-nowrap">
              <thead className="bg-slate-900/80 text-slate-300 text-[11px] font-bold tracking-wider border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3.5">Cierre</th>
                  <th className="px-4 py-3.5">Cerró</th>
                  <th className="px-4 py-3.5 text-right">Efectivo esperado</th>
                  <th className="px-4 py-3.5 text-right">Contado</th>
                  <th className="px-4 py-3.5 text-right">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/60 text-[var(--foreground)]">
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="px-4 py-3">{h.closed_at ? formatDateTime(h.closed_at) : "—"}</td>
                    <td className="px-4 py-3 text-slate-300">{h.closed_by ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{formatARS(h.expected_cash)}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{formatARS(h.actual_cash)}</td>
                    <td className="px-4 py-3 text-right">
                      <DifferenceLabel difference={Number(h.cash_difference ?? 0)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function CloseShiftView({
  shift,
  expected,
  onBack,
  onClosed,
}: Readonly<{
  shift: CashShift;
  expected: CashShiftExpectedRow[];
  onBack: () => void;
  onClosed: () => void;
}>) {
  const [counted, setCounted] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const cashCounted = counted[CASH_METHOD] ?? "";

  const handleClose = async () => {
    if (saving) return;
    if (cashCounted.trim() === "") {
      toast.error("Ingresá el efectivo que contaste en la caja");
      return;
    }
    const payload: Record<string, number> = {};
    for (const [method, value] of Object.entries(counted)) {
      if (value.trim() !== "") payload[method] = Number(value);
    }
    setSaving(true);
    const res = await fetch(`/api/cash/shifts/${shift.id}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ counted: payload, notes }),
    });
    const body = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) {
      toast.error(body?.error ?? "No se pudo cerrar la caja");
      return;
    }
    toast.success("Caja cerrada con éxito");
    onClosed();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full max-w-2xl">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[var(--accent)] hover:text-white transition-colors cursor-pointer group mb-1 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Volver a caja</span>
        </button>
        <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">Cerrar caja</h2>
        <p className="text-xs text-slate-400 mt-1">
          Cobros desde el {formatDateTime(shift.opened_at)}. Cargá lo que contaste: el efectivo es obligatorio,
          el resto es opcional (por ejemplo, lo que muestra la app de Mercado Pago)
        </p>
      </div>

      <div className="space-y-4">
        {expected.map((row) => {
          const value = counted[row.method] ?? "";
          const isCash = row.method === CASH_METHOD;
          const inputId = `count-${row.method.replace(/\s+/g, "-").toLowerCase()}`;
          return (
            <div
              key={row.method}
              className="p-4 rounded-xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 space-y-2"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <label htmlFor={inputId} className={`${catalogLabelClass} !mb-0`}>
                  {row.method} {isCash && <span className="text-red-500">*</span>}
                </label>
                <span className="text-xs text-slate-400">
                  Debería haber <span className="font-bold text-[var(--foreground)]">{formatARS(row.expected)}</span>
                </span>
              </div>
              <input
                id={inputId}
                type="number"
                inputMode="decimal"
                min="0"
                step="100"
                value={value}
                onChange={(e) => setCounted((prev) => ({ ...prev, [row.method]: e.target.value }))}
                placeholder={isCash ? "Efectivo contado" : "Opcional"}
                required={isCash}
                className={`${catalogInputClass} !py-3 !px-4 min-h-[44px]`}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                {isCash ? (
                  <span className="text-slate-500">Sin contar el vuelto que dejás en el cajón</span>
                ) : (
                  <span />
                )}
                {value.trim() !== "" && <DifferenceLabel difference={Number(value) - row.expected} />}
              </div>
            </div>
          );
        })}

        <div>
          <label htmlFor="close-notes" className={catalogLabelClass}>
            Nota
          </label>
          <textarea
            id="close-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Opcional. Ej.: faltan $500 de un vuelto mal dado"
            className={`${catalogInputClass} !py-3 !px-4`}
          />
        </div>
      </div>

      <ActionButton
        name="Confirmar cierre"
        Icon={Lock}
        loading={saving}
        disabled={saving}
        onClick={() => void handleClose()}
        className="w-full sm:w-auto min-h-[44px]"
      />
      <p className="text-xs text-slate-500">
        Después de cerrar, los cobros y gastos de esta caja ya no se pueden editar ni borrar
      </p>
    </div>
  );
}
