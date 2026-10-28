"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Barber } from "@/lib/types/Barbers";
import { CashMovement, CommissionPayout } from "@/lib/types/cash";
import { createCommissionPayout, getCashMovements } from "@/lib/repository/cash";
import { toast } from "@/lib/store/useToastStore";
import {
  X,
  CheckCircle2,
  Copy,
  Check,
  Scissors,
  ShoppingBag,
  ArrowRightLeft,
  Banknote,
  Receipt,
  FileCheck,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  barber: Barber;
  startDate: Date;
  endDate: Date;
  cutsCount: number;
  cutsRevenue: number;
  cutsCommission: number;
  salesCount: number;
  salesRevenue: number;
  salesCommission: number;
}

const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function LiquidationModal({
  isOpen,
  onClose,
  onSuccess,
  barber,
  startDate,
  endDate,
  cutsCount,
  cutsRevenue,
  cutsCommission,
  salesCount,
  salesRevenue,
  salesCommission,
}: Readonly<Props>) {
  const [paymentMethod, setPaymentMethod] = useState<string>("Efectivo");
  const [referenceCode, setReferenceCode] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [advances, setAdvances] = useState<CashMovement[]>([]);
  const [loadingAdvances, setLoadingAdvances] = useState<boolean>(false);
  const [selectedAdvanceIds, setSelectedAdvanceIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedPayout, setCompletedPayout] = useState<CommissionPayout | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState<boolean>(false);

  const formattedPeriod = useMemo(() => {
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
    return `${startDate.toLocaleDateString("es-AR", opts)} — ${endDate.toLocaleDateString("es-AR", opts)}`;
  }, [startDate, endDate]);

  // Cargar adelantos otorgados en el período
  useEffect(() => {
    if (!isOpen || !barber.id) return;
    setCompletedPayout(null);

    let isMounted = true;
    (async () => {
      setLoadingAdvances(true);
      try {
        const data = await getCashMovements({
          barberId: barber.id,
          type: "advance",
          startDate: formatLocalDate(startDate),
          endDate: formatLocalDate(endDate),
        });
        if (isMounted) {
          setAdvances(data);
          // Por defecto seleccionamos todos los adelantos para deducir
          setSelectedAdvanceIds(data.map((a) => a.id));
        }
      } catch (err) {
        console.error("Error al cargar adelantos:", err);
      } finally {
        if (isMounted) setLoadingAdvances(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, barber.id, startDate, endDate]);

  const toggleAdvance = (id: number) => {
    setSelectedAdvanceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const totalAdvancesDeducted = useMemo(() => {
    return advances
      .filter((a) => selectedAdvanceIds.includes(a.id))
      .reduce((sum, curr) => sum + Number(curr.amount), 0);
  }, [advances, selectedAdvanceIds]);

  const subtotalCommissions = Math.round(cutsCommission + salesCommission);
  const finalTotalToPay = Math.max(0, subtotalCommissions - totalAdvancesDeducted);

  const handleConfirmPayout = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const barberId = barber.id ?? 0;
      const res = await createCommissionPayout({
        barber_id: barberId,
        period_start: formatLocalDate(startDate),
        period_end: formatLocalDate(endDate),
        cuts_count: cutsCount,
        cuts_commission_amount: cutsCommission,
        sales_count: salesCount,
        sales_commission_amount: salesCommission,
        advances_deducted: totalAdvancesDeducted,
        total_paid: finalTotalToPay,
        payment_method: paymentMethod,
        payment_date: formatLocalDate(new Date()),
        reference_code: referenceCode.trim() || undefined,
        receipt_notes: notes.trim() || undefined,
        paid_by: "admin",
      });

      if (!res.success) {
        toast.error(res.error || "No se pudo registrar la liquidación");
        return;
      }

      toast.success(`Liquidación registrada con éxito (Comprobante #${res.id})`);

      setCompletedPayout({
        id: res.id || 0,
        barber_id: barberId,
        period_start: formatLocalDate(startDate),
        period_end: formatLocalDate(endDate),
        cuts_count: cutsCount,
        cuts_commission_amount: cutsCommission,
        sales_count: salesCount,
        sales_commission_amount: salesCommission,
        advances_deducted: totalAdvancesDeducted,
        total_paid: finalTotalToPay,
        payment_method: paymentMethod,
        payment_date: formatLocalDate(new Date()),
        reference_code: referenceCode.trim() || null,
        receipt_notes: notes.trim() || null,
        paid_by: "admin",
        barbers: { name: barber.name, role: barber.role },
      });

      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Error inesperado al registrar el pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppReceiptText = () => {
    if (!completedPayout) return "";
    return `💈 *RECIBO DE LIQUIDACIÓN #${completedPayout.id}*\n` +
      `👤 *Profesional:* ${barber.name}\n` +
      `📅 *Período liquidado:* ${formattedPeriod}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `✂️ *Cortes (${cutsCount} turnos):* $${Math.round(cutsCommission).toLocaleString("es-AR")}\n` +
      `🛍️ *Ventas (${salesCount} prod.):* $${Math.round(salesCommission).toLocaleString("es-AR")}\n` +
      (totalAdvancesDeducted > 0
        ? `💸 *Adelantos descontados:* -$${totalAdvancesDeducted.toLocaleString("es-AR")}\n`
        : "") +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ *TOTAL ABONADO: $${finalTotalToPay.toLocaleString("es-AR")}*\n` +
      `💳 *Medio de pago:* ${paymentMethod}` +
      (referenceCode ? ` (Ref: ${referenceCode})` : "") +
      `\n📅 *Fecha de pago:* ${new Date().toLocaleDateString("es-AR")}\n\n` +
      `_Comprobante emitido automáticamente por el sistema de gestión._`;
  };

  const handleCopyWhatsApp = () => {
    const text = getWhatsAppReceiptText();
    if (typeof window !== "undefined" && navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2500);
      toast.success("Recibo copiado al portapapeles para WhatsApp");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#0B132B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {completedPayout ? "Recibo oficial de liquidación" : "Liquidar y pagar comisiones"}
              </h3>
              <p className="text-xs text-slate-400">
                {barber.name} • {formattedPeriod}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="p-6 overflow-y-auto space-y-6">
          {completedPayout ? (
            /* Vista del Recibo Digital emitido */
            <div className="space-y-6 animate-in zoom-in-95 duration-200">
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
                  <FileCheck className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-extrabold text-white">¡Liquidación registrada!</h4>
                <p className="text-xs text-slate-300">
                  El pago fue asentado correctamente y registrado en el historial oficial del sistema.
                </p>
                <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold mt-2">
                  COMPROBANTE #{completedPayout.id}
                </div>
              </div>

              {/* Ficha Resumen */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Profesional:</span>
                  <span className="font-bold text-white">{barber.name}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Período:</span>
                  <span className="font-medium text-white">{formattedPeriod}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Cortes ({cutsCount} turnos):</span>
                  <span className="font-semibold text-white">
                    ${Math.round(cutsCommission).toLocaleString("es-AR")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Ventas ({salesCount} prod.):</span>
                  <span className="font-semibold text-white">
                    ${Math.round(salesCommission).toLocaleString("es-AR")}
                  </span>
                </div>
                {totalAdvancesDeducted > 0 && (
                  <div className="flex justify-between items-center text-amber-400">
                    <span>Adelantos descontados:</span>
                    <span className="font-bold">
                      -${totalAdvancesDeducted.toLocaleString("es-AR")}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm">
                  <span className="font-bold text-white">Total abonado:</span>
                  <span className="font-extrabold text-[var(--accent)] text-lg">
                    ${finalTotalToPay.toLocaleString("es-AR")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400 pt-1">
                  <span>Medio de pago:</span>
                  <span className="font-medium text-slate-200">
                    {paymentMethod} {referenceCode ? `(Ref: ${referenceCode})` : ""}
                  </span>
                </div>
              </div>

              {/* Botón WhatsApp */}
              <button
                type="button"
                onClick={handleCopyWhatsApp}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                  copiedReceipt
                    ? "!bg-emerald-500 !text-slate-950 shadow-emerald-500/20"
                    : "!bg-[#25D366] hover:!bg-[#20ba59] !text-slate-950 shadow-[#25D366]/20 hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                {copiedReceipt ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>¡Recibo copiado para WhatsApp!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar recibo para WhatsApp</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-xs font-semibold transition-all"
              >
                Cerrar
              </button>
            </div>
          ) : (
            /* Vista del Formulario de Liquidación */
            <>
              {/* Desglose de ingresos */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-400 tracking-wider block">
                  1. CONCEPTOS GENERADOS EN EL PERÍODO
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20 flex-shrink-0">
                      <Scissors className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block truncate">
                        Cortes ({cutsCount} • ${cutsRevenue.toLocaleString("es-AR")})
                      </span>
                      <span className="text-sm font-bold text-white block">
                        ${Math.round(cutsCommission).toLocaleString("es-AR")}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 flex-shrink-0">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block truncate">
                        Ventas ({salesCount} • ${salesRevenue.toLocaleString("es-AR")})
                      </span>
                      <span className="text-sm font-bold text-white block">
                        ${Math.round(salesCommission).toLocaleString("es-AR")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Adelantos Previos Detectados */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 tracking-wider">
                    2. ADELANTOS PREVIOS EN EL PERÍODO
                  </span>
                  {advances.length > 0 && (
                    <span className="text-[10px] text-amber-400 font-semibold">
                      {advances.length} adelanto(s) encontrado(s)
                    </span>
                  )}
                </div>

                {loadingAdvances ? (
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 text-center text-xs text-slate-400 animate-pulse">
                    Consultando adelantos previos...
                  </div>
                ) : advances.length === 0 ? (
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-400">
                    No se registraron adelantos previos a descontar en estas fechas.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {advances.map((adv) => {
                      const isSelected = selectedAdvanceIds.includes(adv.id);
                      return (
                        <div
                          key={adv.id}
                          onClick={() => toggleAdvance(adv.id)}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? "bg-amber-500/10 border-amber-500/30 text-white"
                              : "bg-slate-900/40 border-white/5 text-slate-400 opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="accent-amber-400 rounded cursor-pointer"
                            />
                            <div>
                              <span className="text-xs font-semibold block">{adv.description}</span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(adv.created_at).toLocaleDateString("es-AR")} • {adv.payment_method}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-amber-400">
                            -${Number(adv.amount).toLocaleString("es-AR")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Total final a liquidar */}
              <div className="p-4 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider block">
                    TOTAL NETO A ABONAR
                  </span>
                  <p className="text-[11px] text-slate-300">
                    Comisiones (${subtotalCommissions.toLocaleString("es-AR")})
                    {totalAdvancesDeducted > 0 && ` - Adelantos ($${totalAdvancesDeducted.toLocaleString("es-AR")})`}
                  </p>
                </div>
                <span className="text-2xl font-black text-[var(--accent)]">
                  ${finalTotalToPay.toLocaleString("es-AR")}
                </span>
              </div>

              {/* Forma de pago */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-400 tracking-wider block">
                  3. FORMA DE PAGO
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("Efectivo")}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === "Efectivo"
                        ? "!bg-amber-500/15 !border-amber-500/40 !text-amber-300 shadow-sm"
                        : "!bg-slate-900/60 !border-white/5 !text-slate-400 hover:!text-white"
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Efectivo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("Transferencia")}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === "Transferencia"
                        ? "!bg-purple-500/15 !border-purple-500/40 !text-purple-300 shadow-sm"
                        : "!bg-slate-900/60 !border-white/5 !text-slate-400 hover:!text-white"
                    }`}
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>Transferencia</span>
                  </button>
                </div>

                {paymentMethod === "Efectivo" ? (
                  <p className="text-[11px] text-slate-400 bg-amber-500/5 p-2.5 rounded-lg border border-amber-500/15">
                    💡 <strong className="text-amber-300">Importante:</strong> Al pagar en efectivo, el monto de ${finalTotalToPay.toLocaleString("es-AR")} se registrará como salida de dinero en la caja diaria.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    <label htmlFor="ref-code-input" className="block text-xs font-medium text-slate-300">
                      Nº de comprobante o referencia bancaria (opcional)
                    </label>
                    <input
                      id="ref-code-input"
                      type="text"
                      value={referenceCode}
                      onChange={(e) => setReferenceCode(e.target.value)}
                      placeholder="Ej: Op #839201 o CBU destino"
                      className="w-full p-2.5 rounded-xl border border-white/10 bg-slate-900/80 text-xs text-white focus:border-[var(--accent)] outline-none"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="notes-input" className="block text-xs font-medium text-slate-300">
                    Notas adicionales (opcional)
                  </label>
                  <input
                    id="notes-input"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: Pago semanal cerrado"
                    className="w-full p-2.5 rounded-xl border border-white/10 bg-slate-900/80 text-xs text-white focus:border-[var(--accent)] outline-none"
                  />
                </div>
              </div>

              {/* Botón de acción */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayout}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl !bg-[var(--accent)] hover:!bg-[#E8CA8C] !text-slate-950 font-bold text-xs shadow-md shadow-[var(--accent)]/15 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? "Registrando..." : "Confirmar pago"}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
