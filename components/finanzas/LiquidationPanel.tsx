"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Barber } from "@/lib/types/Barbers";
import { CommissionPayout } from "@/lib/types/cash";
import { createCommissionPayout, getPayoutPreview, PayoutPreview } from "@/lib/repository/cash";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { DEFAULT_PAYMENT_METHODS } from "@/lib/flags";
import { computePayout } from "@/lib/finance/payout";
import { buildPayoutWhatsAppText } from "@/lib/finance/payoutText";
import { formatLocalDate } from "@/lib/dates/argentina";
import { DatePreset, getPresetRange } from "@/lib/dates/presets";
import DatePresetSelector from "@/components/admin/DatePresetSelector";
import { toast } from "@/lib/store/useToastStore";
import {
  ArrowLeft,
  Receipt,
  FileCheck,
  CheckCircle2,
  Copy,
  Check,
  Scissors,
  ShoppingBag,
  HandCoins,
  Banknote,
  Wallet,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface Props {
  barbers: Barber[];
  initialBarberId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

const ars = (n: number) => `$${Math.round(Number(n)).toLocaleString("es-AR")}`;

const formatDay = (day: string) => {
  const [y, m, d] = day.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

export default function LiquidationPanel({
  barbers,
  initialBarberId,
  onClose,
  onSuccess,
}: Readonly<Props>) {
  const { businessSettings } = useBusinessContext();
  const paymentMethods = businessSettings?.payment_methods?.length
    ? businessSettings.payment_methods
    : DEFAULT_PAYMENT_METHODS;

  const [selectedBarberId, setSelectedBarberId] = useState<number>(
    initialBarberId || barbers[0]?.id || 0
  );

  const initialRange = useMemo(() => getPresetRange("month"), []);
  const [preset, setPreset] = useState<DatePreset>("month");
  const [startDate, setStartDate] = useState<Date>(initialRange.start);
  const [endDate, setEndDate] = useState<Date>(initialRange.end);

  // Vista previa calculada en el servidor (turnos cobrados, ventas y adelantos sin descontar)
  const [preview, setPreview] = useState<PayoutPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [selectedAdvanceIds, setSelectedAdvanceIds] = useState<number[]>([]);
  const requestId = useRef(0);

  useEffect(() => {
    if (!selectedBarberId) return;
    const current = ++requestId.current;
    setLoadingPreview(true);
    setPreviewError(null);
    getPayoutPreview({
      barberId: selectedBarberId,
      startDate: formatLocalDate(startDate),
      endDate: formatLocalDate(endDate),
    }).then((res) => {
      // Si el usuario cambió de profesional o de período, se descarta la respuesta vieja
      if (current !== requestId.current) return;
      setLoadingPreview(false);
      if (!res.success || !res.data) {
        setPreview(null);
        setPreviewError(res.error || "No se pudo calcular la liquidación. Probá de nuevo.");
        return;
      }
      setPreview(res.data);
      setSelectedAdvanceIds(res.data.advances.map((a) => a.id));
    });
  }, [selectedBarberId, startDate, endDate]);

  const toggleAdvance = (id: number) => {
    setSelectedAdvanceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const result = useMemo(() => {
    const advancesTotal = (preview?.advances ?? [])
      .filter((a) => selectedAdvanceIds.includes(a.id))
      .reduce((sum, a) => sum + Number(a.amount), 0);
    return computePayout({
      cutsCount: preview?.cuts.count ?? 0,
      cutsRevenue: preview?.cuts.revenue ?? 0,
      commissionRate: preview?.barber.commission ?? 0,
      salesCount: preview?.sales.count ?? 0,
      salesRevenue: preview?.sales.revenue ?? 0,
      saleCommissionRate: preview?.barber.sale_commission ?? 0,
      advancesTotal,
    });
  }, [preview, selectedAdvanceIds]);

  // Formulario de pago
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]);
  const [referenceCode, setReferenceCode] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedPayout, setCompletedPayout] = useState<CommissionPayout | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  const overlapping = preview?.overlappingPayout ?? null;
  const canConfirm = !!preview && !overlapping && !loadingPreview && !isSubmitting && !!paymentMethod;
  const barberName = preview?.barber.name ?? barbers.find((b) => b.id === selectedBarberId)?.name ?? "";

  const handleConfirmPayout = async () => {
    if (!canConfirm) return;
    setIsSubmitting(true);
    try {
      const res = await createCommissionPayout({
        barber_id: selectedBarberId,
        period_start: formatLocalDate(startDate),
        period_end: formatLocalDate(endDate),
        advance_ids: selectedAdvanceIds,
        payment_method: paymentMethod,
        reference_code: referenceCode.trim() || undefined,
        receipt_notes: notes.trim() || undefined,
      });

      if (!res.success || !res.payout) {
        toast.error(res.error || "No se pudo registrar la liquidación");
        return;
      }

      toast.success(`Liquidación #${res.payout.id} registrada`);
      // El recibo muestra los montos que guardó el servidor
      setCompletedPayout(res.payout);
    } catch (err) {
      console.error(err);
      toast.error("Error inesperado al registrar el pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyWhatsApp = () => {
    if (!completedPayout) return;
    const text = buildPayoutWhatsAppText(completedPayout, barberName);
    if (typeof window !== "undefined" && navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2500);
      toast.success("Recibo copiado para WhatsApp");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 w-full max-w-3xl mx-auto">
      {/* Cabecera con botón de retorno */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={completedPayout ? onSuccess : onClose}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer min-h-[44px] sm:min-h-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Receipt className="w-5 h-5 text-violet-400" />
              <span>{completedPayout ? `Liquidación #${completedPayout.id}` : "Nueva liquidación"}</span>
            </h3>
            <p className="text-xs text-slate-400">
              {completedPayout
                ? "Quedó registrada en el historial de liquidaciones"
                : "Comisiones de turnos cobrados y ventas, menos los adelantos"}
            </p>
          </div>
        </div>
      </div>

      {completedPayout ? (
        /* RECIBO DE LA LIQUIDACIÓN REGISTRADA */
        <div className="dashboard-card p-6 border border-white/10 bg-slate-900/60 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
              <FileCheck className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-extrabold text-white">Liquidación registrada</h4>
            <p className="text-xs text-slate-300">
              Si te equivocaste, podés anularla desde el historial.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-white/10 space-y-3 text-xs">
            <div className="flex justify-between items-center gap-3 text-slate-300">
              <span>Profesional:</span>
              <span className="font-bold text-white">{barberName}</span>
            </div>
            <div className="flex justify-between items-center gap-3 text-slate-300">
              <span>Período liquidado:</span>
              <span className="font-semibold text-white text-right">
                {formatDay(completedPayout.period_start)} al {formatDay(completedPayout.period_end)}
              </span>
            </div>
            <div className="flex justify-between items-center gap-3 text-slate-300">
              <span>Medio de pago:</span>
              <span className="font-semibold text-white">{completedPayout.payment_method}</span>
            </div>
            {completedPayout.reference_code && (
              <div className="flex justify-between items-center gap-3 text-slate-300">
                <span>Referencia:</span>
                <span className="font-mono text-amber-300 break-all">{completedPayout.reference_code}</span>
              </div>
            )}
            <div className="h-px bg-white/10 my-2" />
            <div className="flex justify-between items-center gap-3 text-slate-300">
              <span>Comisión por cortes ({completedPayout.cuts_count} turnos):</span>
              <span className="font-semibold text-white">{ars(completedPayout.cuts_commission_amount)}</span>
            </div>
            <div className="flex justify-between items-center gap-3 text-slate-300">
              <span>Comisión por ventas ({completedPayout.sales_count}):</span>
              <span className="font-semibold text-white">{ars(completedPayout.sales_commission_amount)}</span>
            </div>
            {Number(completedPayout.advances_deducted) > 0 && (
              <div className="flex justify-between items-center gap-3 text-red-400">
                <span>Adelantos descontados:</span>
                <span className="font-bold">-{ars(completedPayout.advances_deducted)}</span>
              </div>
            )}
            <div className="h-px bg-white/10 my-2" />
            <div className="flex justify-between items-center gap-3 text-sm font-bold text-white">
              <span>Total pagado:</span>
              <span className="text-emerald-400 text-lg">{ars(completedPayout.total_paid)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className={`w-full sm:flex-1 min-h-[44px] py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                copiedReceipt
                  ? "!bg-emerald-500 !text-slate-950 shadow-emerald-500/20"
                  : "!bg-emerald-500/15 border border-emerald-500/30 !text-emerald-300 hover:!bg-emerald-500/25"
              }`}
            >
              {copiedReceipt ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
              <span>Copiar recibo para WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onSuccess}
              className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl !bg-[var(--accent)] hover:opacity-90 !text-slate-950 font-bold text-xs shadow-md shadow-[var(--accent)]/15 transition-all cursor-pointer"
            >
              Volver al historial
            </button>
          </div>
        </div>
      ) : (
        /* FORMULARIO DE LIQUIDACIÓN */
        <div className="space-y-6">
          <div className="dashboard-card p-5 border border-white/10 bg-slate-900/60 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="payout-barber-select" className="block text-xs font-semibold text-slate-300">
                Profesional a liquidar
              </label>
              <select
                id="payout-barber-select"
                value={selectedBarberId}
                onChange={(e) => setSelectedBarberId(Number(e.target.value))}
                className="w-full min-h-[44px] p-2.5 rounded-xl border border-white/10 bg-slate-950 text-sm text-white focus:border-[var(--accent)] outline-none"
              >
                {barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.active === false ? " (inactivo)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-300">Período a liquidar</span>
              <DatePresetSelector
                preset={preset}
                startDate={startDate}
                endDate={endDate}
                onChange={(next) => {
                  setPreset(next.preset);
                  setStartDate(next.startDate);
                  setEndDate(next.endDate);
                }}
              />
            </div>
          </div>

          {overlapping && (
            <div className="flex items-start gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Ya liquidaste a este profesional del {formatDay(overlapping.period_start)} al{" "}
                {formatDay(overlapping.period_end)} (#{overlapping.id}). Elegí otro período o anulá esa liquidación.
              </span>
            </div>
          )}

          {previewError ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
              {previewError}
            </div>
          ) : (
            <>
              {/* Comisiones del período */}
              <div className={`dashboard-card p-5 border border-white/10 bg-slate-900/60 space-y-4 ${loadingPreview ? "opacity-60 animate-pulse" : ""}`}>
                <h4 className="text-xs font-bold text-slate-300 tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Comisiones generadas en el período</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Scissors className="w-3.5 h-3.5 text-[var(--accent)]" />
                        Cortes cobrados ({result.cutsCount})
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {Math.round((preview?.barber.commission ?? 0) * 100)}% com.
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between pt-1 gap-2">
                      <span className="text-xs text-slate-500">Facturado: {ars(preview?.cuts.revenue ?? 0)}</span>
                      <span className="text-base font-bold text-white">{ars(result.cutsCommission)}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 font-medium">
                        <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
                        Ventas ({result.salesCount})
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {Math.round((preview?.barber.sale_commission ?? 0) * 100)}% com.
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between pt-1 gap-2">
                      <span className="text-xs text-slate-500">Facturado: {ars(preview?.sales.revenue ?? 0)}</span>
                      <span className="text-base font-bold text-white">{ars(result.salesCommission)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                  <span className="font-semibold text-slate-300">Subtotal de comisiones:</span>
                  <span className="text-sm font-bold text-white">{ars(result.subtotal)}</span>
                </div>
              </div>

              {/* Adelantos a descontar */}
              <div className="dashboard-card p-5 border border-white/10 bg-slate-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 tracking-wider flex items-center gap-2">
                    <HandCoins className="w-4 h-4 text-amber-400" />
                    <span>Adelantos a descontar</span>
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">
                    {preview?.advances.length ?? 0} {preview?.advances.length === 1 ? "adelanto" : "adelantos"}
                  </span>
                </div>

                {!preview || preview.advances.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 text-xs text-slate-400 text-center">
                    {barberName ? `${barberName} no tiene adelantos pendientes de descontar.` : "Sin adelantos pendientes."}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {preview.advances.map((adv) => {
                      const isChecked = selectedAdvanceIds.includes(adv.id);
                      return (
                        <label
                          key={adv.id}
                          className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors min-h-[44px] ${
                            isChecked
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                              : "bg-slate-950/50 border-white/5 text-slate-400 hover:bg-slate-950"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleAdvance(adv.id)}
                              className="w-4 h-4 rounded text-amber-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-white/20 cursor-pointer"
                            />
                            <div className="min-w-0">
                              <span className="font-semibold text-white block truncate">
                                {adv.description || "Adelanto de comisión"}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(adv.created_at).toLocaleDateString("es-AR")} • {adv.payment_method}
                              </span>
                            </div>
                          </div>
                          <span className="font-bold text-sm text-red-400 shrink-0">-{ars(adv.amount)}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {result.advancesExcess > 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Los adelantos superan las comisiones: quedan {ars(result.advancesExcess)} a favor del local.</span>
                  </div>
                )}
              </div>

              {/* Total neto */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-center sm:text-left">
                  <span className="text-xs font-bold text-emerald-300 tracking-wider block">
                    Total a pagar al profesional
                  </span>
                  <p className="text-xs text-slate-300">Comisiones menos adelantos tildados</p>
                </div>
                <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">{ars(result.totalToPay)}</div>
              </div>

              {/* Datos del pago */}
              <div className="dashboard-card p-5 border border-white/10 bg-slate-900/60 space-y-4">
                <div className="space-y-1.5">
                  <span className="block text-xs font-semibold text-slate-300">Medio de pago</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {paymentMethods.map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`min-h-[44px] p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                          paymentMethod === method
                            ? "!bg-emerald-500/15 !border-emerald-500/40 !text-emerald-300"
                            : "!bg-slate-950 !border-white/5 !text-slate-400 hover:!text-white"
                        }`}
                      >
                        {method === "Efectivo" ? <Banknote className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                        <span className="truncate">{method}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod !== "Efectivo" && (
                  <div className="space-y-1.5">
                    <label htmlFor="payout-ref-input" className="block text-xs font-semibold text-slate-300">
                      Nº de operación o referencia (opcional)
                    </label>
                    <input
                      id="payout-ref-input"
                      type="text"
                      value={referenceCode}
                      onChange={(e) => setReferenceCode(e.target.value)}
                      placeholder="Ej: Op #81923"
                      className="w-full min-h-[44px] p-2.5 rounded-xl border border-white/10 bg-slate-950 text-xs text-white focus:border-[var(--accent)] outline-none"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="payout-notes-input" className="block text-xs font-semibold text-slate-300">
                    Observaciones (opcional)
                  </label>
                  <input
                    id="payout-notes-input"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: Liquidación quincenal"
                    className="w-full min-h-[44px] p-2.5 rounded-xl border border-white/10 bg-slate-950 text-xs text-white focus:border-[var(--accent)] outline-none"
                  />
                </div>

                <div className="pt-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPayout}
                    disabled={!canConfirm}
                    className="min-h-[44px] px-6 py-2.5 rounded-xl !bg-emerald-500 hover:!bg-emerald-600 !text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
                    <span>Confirmar liquidación</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
