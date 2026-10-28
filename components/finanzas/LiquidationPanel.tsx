"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Barber } from "@/lib/types/Barbers";
import { CashMovement, CommissionPayout } from "@/lib/types/cash";
import { createCommissionPayout, getCashMovements } from "@/lib/repository/cash";
import { useBarberCutsData } from "@/lib/hooks/useBarberCutsdata";
import { useTotalRevenueForAllSales } from "@/lib/hooks/useTotalSalesRevenue";
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
  ArrowRightLeft,
  Banknote,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const DateRangeCalendar = dynamic(
  () => import("@/components/dashboard/DateRangeCalendar"),
  { ssr: false, loading: () => <div className="w-full h-72 rounded-2xl bg-slate-900/40 animate-pulse border border-white/5" /> }
);

interface Props {
  barbers: Barber[];
  initialBarberId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

type DatePreset = "today" | "week" | "month" | "last_month" | "custom";

const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function LiquidationPanel({
  barbers,
  initialBarberId,
  onClose,
  onSuccess,
}: Readonly<Props>) {
  const [selectedBarberId, setSelectedBarberId] = useState<number>(
    initialBarberId || barbers[0]?.id || 0
  );

  // Selector de presets de fecha
  const [preset, setPreset] = useState<DatePreset>("month");
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const initialDates = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { start: startOfMonth, end: endOfMonth };
  }, []);

  const [startDate, setStartDate] = useState<Date>(initialDates.start);
  const [endDate, setEndDate] = useState<Date>(initialDates.end);

  const handleSelectPreset = (p: DatePreset) => {
    setPreset(p);
    const now = new Date();

    if (p === "today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      setStartDate(start);
      setEndDate(end);
      setShowCustomPicker(false);
    } else if (p === "week") {
      const currentDay = now.getDay();
      const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59);
      setStartDate(monday);
      setEndDate(sunday);
      setShowCustomPicker(false);
    } else if (p === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      setStartDate(start);
      setEndDate(end);
      setShowCustomPicker(false);
    } else if (p === "last_month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      setStartDate(start);
      setEndDate(end);
      setShowCustomPicker(false);
    } else if (p === "custom") {
      setShowCustomPicker(true);
    }
  };

  const handleDateChange = (range: { startDate: Date; endDate: Date }) => {
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setPreset("custom");
  };

  const formattedPeriod = useMemo(() => {
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
    return `${startDate.toLocaleDateString("es-AR", opts)} — ${endDate.toLocaleDateString("es-AR", opts)}`;
  }, [startDate, endDate]);

  const currentBarber = useMemo(() => {
    return barbers.find((b) => b.id === selectedBarberId) || barbers[0];
  }, [barbers, selectedBarberId]);

  // Hook data para cortes y ventas
  const { barberTotals } = useBarberCutsData(startDate, endDate, barbers);
  const { salesByBarber } = useTotalRevenueForAllSales(startDate, endDate, barbers);

  const bTotals = useMemo(() => {
    return barberTotals.find((t) => t.barberId === currentBarber?.id);
  }, [barberTotals, currentBarber?.id]);

  const bSales = useMemo(() => {
    return salesByBarber?.find((s) => s.barberId === currentBarber?.id);
  }, [salesByBarber, currentBarber?.id]);

  const cutsCount = bTotals?.totalAppt ?? 0;
  const cutsRevenue = bTotals?.totalRevenue ?? 0;
  const commRateCortes = currentBarber?.commission ?? 0;
  const cutsCommission = Math.round(cutsRevenue * commRateCortes);

  const salesCount = bSales?.totalSales ?? 0;
  const salesRevenue = bSales?.totalSalesRevenue ?? 0;
  const commRateVentas = currentBarber?.sale_commission ?? 0;
  const salesCommission = Math.round(salesRevenue * commRateVentas);

  const subtotalCommissions = cutsCommission + salesCommission;

  // Adelantos en el período
  const [advances, setAdvances] = useState<CashMovement[]>([]);
  const [loadingAdvances, setLoadingAdvances] = useState(false);
  const [selectedAdvanceIds, setSelectedAdvanceIds] = useState<number[]>([]);

  useEffect(() => {
    if (!currentBarber?.id) return;
    let isMounted = true;
    (async () => {
      setLoadingAdvances(true);
      try {
        const data = await getCashMovements({
          barberId: currentBarber.id,
          type: "advance",
          startDate: formatLocalDate(startDate),
          endDate: formatLocalDate(endDate),
        });
        if (isMounted) {
          setAdvances(data);
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
  }, [currentBarber?.id, startDate, endDate]);

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

  const finalTotalToPay = Math.max(0, subtotalCommissions - totalAdvancesDeducted);

  // Formulario de pago
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [referenceCode, setReferenceCode] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedPayout, setCompletedPayout] = useState<CommissionPayout | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  const handleConfirmPayout = async () => {
    if (isSubmitting || !currentBarber?.id) return;
    setIsSubmitting(true);

    try {
      const res = await createCommissionPayout({
        barber_id: currentBarber.id,
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
        barber_id: currentBarber.id,
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
        barbers: { name: currentBarber.name, role: currentBarber.role },
      });
    } catch (err) {
      console.error(err);
      toast.error("Error inesperado al registrar el pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppReceiptText = () => {
    if (!completedPayout || !currentBarber) return "";
    return (
      `💈 *RECIBO DE LIQUIDACIÓN #${completedPayout.id}*\n` +
      `👤 *Profesional:* ${currentBarber.name}\n` +
      `📅 *Período liquidado:* ${formattedPeriod}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `✂️ *Cortes (${cutsCount} turnos):* $${cutsCommission.toLocaleString("es-AR")}\n` +
      `🛍️ *Ventas (${salesCount} prod.):* $${salesCommission.toLocaleString("es-AR")}\n` +
      (totalAdvancesDeducted > 0
        ? `💸 *Adelantos descontados:* -$${totalAdvancesDeducted.toLocaleString("es-AR")}\n`
        : "") +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ *TOTAL ABONADO: $${finalTotalToPay.toLocaleString("es-AR")}*\n` +
      `💳 *Medio de pago:* ${paymentMethod}` +
      (referenceCode ? ` (Ref: ${referenceCode})` : "") +
      `\n📅 *Fecha de pago:* ${new Date().toLocaleDateString("es-AR")}\n\n` +
      `_Comprobante emitido automáticamente por el sistema de gestión._`
    );
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200 w-full max-w-3xl mx-auto">
      {/* Cabecera con botón de retorno */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={completedPayout ? onSuccess : onClose}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Receipt className="w-5 h-5 text-violet-400" />
              <span>{completedPayout ? "Recibo oficial de liquidación" : "Nueva liquidación de comisiones"}</span>
            </h3>
            <p className="text-xs text-slate-400">
              {completedPayout
                ? "Comprobante digital registrado en el historial oficial del sistema"
                : "Cálculo de cortes, ventas de productos y deducción de adelantos"}
            </p>
          </div>
        </div>
      </div>

      {completedPayout ? (
        /* VISTA DEL RECIBO DIGITAL EMITIDO */
        <div className="dashboard-card p-6 border border-white/10 bg-slate-900/60 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
              <FileCheck className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-extrabold text-white">¡Liquidación registrada con éxito!</h4>
            <p className="text-xs text-slate-300">
              El pago fue asentado correctamente y registrado en el historial oficial del sistema.
            </p>
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold mt-2">
              COMPROBANTE #{completedPayout.id}
            </div>
          </div>

          {/* Ficha Resumen */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-white/10 space-y-3 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span>Profesional:</span>
              <span className="font-bold text-white">{currentBarber?.name}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Período liquidado:</span>
              <span className="font-semibold text-white">{formattedPeriod}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Medio de pago:</span>
              <span className="font-semibold text-white">{paymentMethod}</span>
            </div>
            {referenceCode && (
              <div className="flex justify-between items-center text-slate-300">
                <span>Nº comprobante / Referencia:</span>
                <span className="font-mono text-amber-300">{referenceCode}</span>
              </div>
            )}
            <div className="h-px bg-white/10 my-2" />
            <div className="flex justify-between items-center text-slate-300">
              <span>Comisiones por cortes ({cutsCount} turnos):</span>
              <span className="font-semibold text-white">${cutsCommission.toLocaleString("es-AR")}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Comisiones por productos ({salesCount} ventas):</span>
              <span className="font-semibold text-white">${salesCommission.toLocaleString("es-AR")}</span>
            </div>
            {totalAdvancesDeducted > 0 && (
              <div className="flex justify-between items-center text-red-400">
                <span>Adelantos descontados:</span>
                <span className="font-bold">-${totalAdvancesDeducted.toLocaleString("es-AR")}</span>
              </div>
            )}
            <div className="h-px bg-white/10 my-2" />
            <div className="flex justify-between items-center text-sm font-bold text-white">
              <span>Total abonado:</span>
              <span className="text-emerald-400 text-lg">${finalTotalToPay.toLocaleString("es-AR")}</span>
            </div>
          </div>

          {/* Botones de acción del recibo */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className={`w-full sm:flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                copiedReceipt
                  ? "!bg-emerald-500 !text-slate-950 shadow-emerald-500/20"
                  : "!bg-emerald-500/15 border border-emerald-500/30 !text-emerald-300 hover:!bg-emerald-500/25"
              }`}
            >
              {copiedReceipt ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>¡Copiado para WhatsApp!</span>
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
              onClick={onSuccess}
              className="w-full sm:w-auto px-6 py-3 rounded-xl !bg-[var(--accent)] hover:!bg-[#E8CA8C] !text-slate-950 font-bold text-xs shadow-md shadow-[var(--accent)]/15 transition-all cursor-pointer"
            >
              Volver al historial
            </button>
          </div>
        </div>
      ) : (
        /* VISTA DE FORMULARIO DE LIQUIDACIÓN */
        <div className="space-y-6">
          {/* Fila 1: Selección de profesional y selector de fechas */}
          <div className="dashboard-card p-5 border border-white/10 bg-slate-900/60 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Profesional */}
              <div className="space-y-1.5">
                <label htmlFor="payout-barber-select" className="block text-xs font-semibold text-slate-300">
                  Profesional a liquidar
                </label>
                <select
                  id="payout-barber-select"
                  value={selectedBarberId}
                  onChange={(e) => setSelectedBarberId(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-white/10 bg-slate-950 text-sm text-white focus:border-[var(--accent)] outline-none"
                >
                  {barbers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Fechas Rápido */}
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-slate-300">
                  Período a liquidar
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectPreset("today")}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      preset === "today"
                        ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                        : "!text-slate-400 hover:!text-white hover:!bg-white/5"
                    }`}
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset("week")}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      preset === "week"
                        ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                        : "!text-slate-400 hover:!text-white hover:!bg-white/5"
                    }`}
                  >
                    Esta semana
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset("month")}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      preset === "month"
                        ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                        : "!text-slate-400 hover:!text-white hover:!bg-white/5"
                    }`}
                  >
                    Este mes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset("last_month")}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      preset === "last_month"
                        ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                        : "!text-slate-400 hover:!text-white hover:!bg-white/5"
                    }`}
                  >
                    Mes pasado
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset("custom")}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                      preset === "custom"
                        ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                        : "!text-slate-400 hover:!text-white hover:!bg-white/5"
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    <span>Personalizado</span>
                    {showCustomPicker ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Rango de fechas activo */}
            <div className="flex items-center text-xs text-slate-400 gap-2 bg-slate-950/60 px-3.5 py-2 rounded-xl border border-white/5">
              <Calendar className="w-4 h-4 text-[var(--accent)]" />
              <span>Período seleccionado:</span>
              <span className="font-semibold text-white">{formattedPeriod}</span>
            </div>

            {showCustomPicker && (
              <div className="dashboard-card p-4 max-w-sm border border-[var(--accent)]/30 animate-in fade-in slide-in-from-top-2 duration-200">
                <DateRangeCalendar
                  startDate={startDate}
                  endDate={endDate}
                  onChange={handleDateChange}
                />
              </div>
            )}
          </div>

          {/* Desglose de Comisiones a Favor */}
          <div className="dashboard-card p-5 border border-white/10 bg-slate-900/60 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Comisiones generadas en el período</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Cortes */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Scissors className="w-3.5 h-3.5 text-[var(--accent)]" />
                    Cortes ({cutsCount} turnos)
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {(commRateCortes * 100).toFixed(0)}% com.
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-xs text-slate-500">
                    Facturado: ${cutsRevenue.toLocaleString("es-AR")}
                  </span>
                  <span className="text-base font-bold text-white">
                    ${cutsCommission.toLocaleString("es-AR")}
                  </span>
                </div>
              </div>

              {/* Ventas */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
                    Ventas ({salesCount} prod.)
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {(commRateVentas * 100).toFixed(0)}% com.
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-xs text-slate-500">
                    Facturado: ${salesRevenue.toLocaleString("es-AR")}
                  </span>
                  <span className="text-base font-bold text-white">
                    ${salesCommission.toLocaleString("es-AR")}
                  </span>
                </div>
              </div>
            </div>

            {/* Subtotal comisiones */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
              <span className="font-semibold text-slate-300">Subtotal comisiones ganadas:</span>
              <span className="text-sm font-bold text-white">${subtotalCommissions.toLocaleString("es-AR")}</span>
            </div>
          </div>

          {/* Deducción de Adelantos */}
          <div className="dashboard-card p-5 border border-white/10 bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <HandCoins className="w-4 h-4 text-amber-400" />
                <span>Adelantos recibidos a deducir</span>
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                {advances.length} {advances.length === 1 ? "adelanto" : "adelantos"}
              </span>
            </div>

            {loadingAdvances ? (
              <p className="text-xs text-slate-500 animate-pulse py-2">Consultando adelantos...</p>
            ) : advances.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 text-xs text-slate-400 text-center">
                No se registraron adelantos para {currentBarber?.name} en este período.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {advances.map((adv) => {
                  const isChecked = selectedAdvanceIds.includes(adv.id);
                  return (
                    <label
                      key={adv.id}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                          : "bg-slate-950/50 border-white/5 text-slate-400 hover:bg-slate-950"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAdvance(adv.id)}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-white/20 cursor-pointer"
                        />
                        <div>
                          <span className="font-semibold text-white block">
                            {adv.description || "Adelanto de comisión"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(adv.created_at).toLocaleDateString("es-AR")} • {adv.payment_method}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-sm text-red-400">
                        -${Number(adv.amount).toLocaleString("es-AR")}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {totalAdvancesDeducted > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                <span className="font-semibold">Total adelantos a descontar:</span>
                <span className="text-sm font-bold">-${totalAdvancesDeducted.toLocaleString("es-AR")}</span>
              </div>
            )}
          </div>

          {/* Total Neto a Abonar */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
                Total neto a pagar al profesional
              </span>
              <p className="text-xs text-slate-300">
                (Comisiones cortes + comisiones ventas) - Adelantos seleccionados
              </p>
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              ${finalTotalToPay.toLocaleString("es-AR")}
            </div>
          </div>

          {/* Datos del pago a asentar */}
          <div className="dashboard-card p-5 border border-white/10 bg-slate-900/60 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Asentar forma de pago
            </h4>

            {/* Medio de entrega */}
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-300">
                Medio de pago
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("Efectivo")}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === "Efectivo"
                      ? "!bg-emerald-500/15 !border-emerald-500/40 !text-emerald-300"
                      : "!bg-slate-950 !border-white/5 !text-slate-400 hover:!text-white"
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Efectivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("Transferencia")}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === "Transferencia"
                      ? "!bg-purple-500/15 !border-purple-500/40 !text-purple-300"
                      : "!bg-slate-950 !border-white/5 !text-slate-400 hover:!text-white"
                  }`}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Transferencia</span>
                </button>
              </div>
            </div>

            {/* Referencia opcional si es transferencia */}
            {paymentMethod === "Transferencia" && (
              <div className="space-y-1.5">
                <label htmlFor="payout-ref-input" className="block text-xs font-semibold text-slate-300">
                  Nº comprobante o referencia (opcional)
                </label>
                <input
                  id="payout-ref-input"
                  type="text"
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                  placeholder="Ej: Op #81923"
                  className="w-full p-2.5 rounded-xl border border-white/10 bg-slate-950 text-xs text-white focus:border-[var(--accent)] outline-none"
                />
              </div>
            )}

            {/* Notas opcionales */}
            <div className="space-y-1.5">
              <label htmlFor="payout-notes-input" className="block text-xs font-semibold text-slate-300">
                Observaciones en recibo (opcional)
              </label>
              <input
                id="payout-notes-input"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Liquidación quincenal regular"
                className="w-full p-2.5 rounded-xl border border-white/10 bg-slate-950 text-xs text-white focus:border-[var(--accent)] outline-none"
              />
            </div>

            {/* Acciones de confirmación */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPayout}
                disabled={isSubmitting || finalTotalToPay < 0}
                className="px-6 py-2.5 rounded-xl !bg-emerald-500 hover:!bg-emerald-600 !text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isSubmitting ? "Registrando liquidación..." : "Confirmar liquidación y pago"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
