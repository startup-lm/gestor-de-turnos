"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import logo from "@/public/images/logo.png";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Appointment } from "@/lib/types/Appointment";
import BarberSelector from "./BarberSelector";
import { Barber } from "@/lib/types/Barbers";
import DatePickerField from "../admin/DatePickerField";
import TimeSelect from "../admin/TimeSelect";
import { generateAllAppointments } from "@/utils/appointments";
import { DetailFormSkeleton } from "../loading/Skeleton";
import ClientAutocompleteFields from "./ClientAutocompleteFields";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { useAppointmentDetailsLogic } from "@/lib/hooks/useAppointmentDetailsLogic";
import { updateAppointment } from "@/lib/repository/appointments";
import { emitArcaInvoice, getArcaStatus } from "@/lib/repository/arca";
import { useFetchOnce } from "@/lib/hooks/useFetchOnce";
import { ArcaStatus, ArcaDocType } from "@/lib/types/Arca";
import ArcaDocFields from "@/components/arca/ArcaDocFields";
import { CONSUMIDOR_FINAL } from "@/lib/arca/receiverConditions";
import { toast } from "@/lib/store/useToastStore";
import InlineConfirm from "@/components/ui/InlineConfirm";
import {
  Receipt,
  X,
  CheckCircle,
  Clock,
  Scissors,
  Calendar,
  User,
  DollarSign,
  Trash2,
  Save,
  AlertCircle,
  ArrowLeft,
  Banknote,
  Wallet,
  ArrowRightLeft,
  CreditCard,
  Coins,
  FileText,
  Loader2,
  Copy,
  Check,
  CheckCircle2,
  MessageCircle,
  RotateCcw,
} from "lucide-react";

function getPaymentMethodIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("efectivo")) return Banknote;
  if (lower.includes("mercado") || lower.includes("mp")) return Wallet;
  if (lower.includes("transfer")) return ArrowRightLeft;
  if (lower.includes("crédito") || lower.includes("credito")) return Coins;
  if (lower.includes("débito") || lower.includes("debito") || lower.includes("tarjeta")) return CreditCard;
  return DollarSign;
}

interface Props {
  onClose: () => void;
  appointment: Appointment;
  barbers: Barber[];
  onAppointmentChanged?: () => void;
  isMobileModal?: boolean;
}

export default function AppointmentDetailsSplitPanel({
  onClose,
  appointment,
  barbers,
  onAppointmentChanged,
}: Readonly<Props>) {
  const { businessHours, businessSettings, isEnabled } = useBusinessContext();
  const ARCA_ENABLED = isEnabled("arca");

  // Métodos de pago configurados en admin
  const availablePaymentMethods = useMemo(() => {
    if (businessSettings?.payment_methods && businessSettings.payment_methods.length > 0) {
      return businessSettings.payment_methods;
    }
    return ["Efectivo", "Mercado Pago"];
  }, [businessSettings?.payment_methods]);

  // Estados para conmutar a la vista de cobro integrada en el panel (sin modal)
  const [isCheckoutView, setIsCheckoutView] = useState(false);
  const [paidInfo, setPaidInfo] = useState<{ price: number; payment_method: string } | null>(null);
  const [isPaidLocally, setIsPaidLocally] = useState<boolean>(appointment.paid);
  // Estado local en vez de mutar la prop: React no se entera si se cambia el objeto appointment
  const [invoiceId, setInvoiceId] = useState<number | null>(appointment.arca_invoice_id ?? null);
  const [confirmRevertPayment, setConfirmRevertPayment] = useState(false);
  const [reversingPayment, setReversingPayment] = useState(false);
  const [copiedCae, setCopiedCae] = useState(false);
  const [checkoutPrice, setCheckoutPrice] = useState<number>(appointment.price || 0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("Efectivo");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    setIsPaidLocally(appointment.paid);
  }, [appointment.id, appointment.paid]);

  const handleCopyCae = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCae(true);
    toast.success("CAE copiado");
    setTimeout(() => setCopiedCae(false), 2000);
  };

  // Guard para evitar click-through involuntario entre la vista de detalle y la de cobro
  const checkoutOpenedAtRef = useRef<number>(0);

  // Estados de ARCA
  const { data: arcaStatus } = useFetchOnce<ArcaStatus>("arcaStatus", getArcaStatus);
  const arcaAvailable = ARCA_ENABLED && !!arcaStatus?.ready;
  const [emitInvoice, setEmitInvoice] = useState(false);
  const [docType, setDocType] = useState<ArcaDocType>(99);
  const [docNumber, setDocNumber] = useState("");
  const [receiverCondition, setReceiverCondition] = useState(CONSUMIDOR_FINAL);

  // Estados locales para la Opción A: alternar entre vista lectura y selector interactivo
  const [isEditingService, setIsEditingService] = useState(false);
  const [isEditingBarber, setIsEditingBarber] = useState(false);
  const [isEditingDateTime, setIsEditingDateTime] = useState(false);

  const allAppointments = generateAllAppointments({
    openTime: businessHours.open_time,
    closeTime: businessHours.close_time,
    stepMinutes: businessSettings.slot_step_minutes,
    breakStart: businessHours.lunch_start,
    breakEnd: businessHours.lunch_end,
  });

  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    loadingFetch,
    services,
    loading,
    loadingUpdate,
    selectedBarberId,
    setSelectedBarberId,
    date,
    setDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    client,
    setClient,
    phone,
    setPhone,
    selectedServiceId,
    setSelectedServiceId,
    price,
    setPrice,
    isBlockedRange,
    hasChanges,
    handleDelete,
    handleUpdate,
  } = useAppointmentDetailsLogic(appointment, barbers);

  const isPaid = isPaidLocally || !!paidInfo;
  const isDeleteDisabled = !isBlockedRange && (isPaid || !!invoiceId);
  const isLocked = !isBlockedRange && !!invoiceId;
  const invoice = appointment.arca_invoices;
  const hasInvoice = !isBlockedRange && !!invoiceId && !!invoice;

  const cleanPhoneDigits = (phone || "").replace(/\D/g, "");
  const showWhatsapp = cleanPhoneDigits.length > 0 && cleanPhoneDigits !== "0000000000";
  const whatsappUrl = showWhatsapp ? `https://wa.me/${cleanPhoneDigits}` : null;

  const handleRevertPayment = async () => {
    if (reversingPayment) return;
    setReversingPayment(true);
    try {
      const res = await updateAppointment(appointment.id, { paid: false });
      if (res.success) {
        setPaidInfo(null);
        setIsPaidLocally(false);
        setConfirmRevertPayment(false);
        toast.success("Cobro revertido");
        onAppointmentChanged?.();
      } else {
        toast.error(res.error || "Error al revertir el cobro");
      }
    } catch (err) {
      console.error("Error al revertir cobro:", err);
      toast.error("Error inesperado al revertir cobro");
    } finally {
      setReversingPayment(false);
    }
  };

  if (loadingFetch) {
    return (
      <div className="bg-[var(--bg-carousel)] border border-[var(--foreground)]/10 rounded-3xl p-6 shadow-2xl">
        <DetailFormSkeleton />
      </div>
    );
  }

  // Servicio seleccionado actualmente
  const currentService = services.find((s) => s.id === selectedServiceId) || null;
  const duration = currentService?.duration || 30;

  // Barbero seleccionado actualmente
  const currentBarber = barbers?.find((b) => b.id === selectedBarberId) || null;
  const barberImage = currentBarber?.image;
  const isValidBarberImage = Boolean(
    barberImage && barberImage !== "null" && barberImage !== ""
  );
  const isValidServiceImage = Boolean(
    currentService?.image &&
      currentService.image !== "null" &&
      currentService.image !== ""
  );

  // Formato de fecha
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
  const formattedDate = date
    ? `${capitalize(format(date, "EEEE", { locale: es }))} ${format(date, "d")} de ${capitalize(format(date, "MMMM", { locale: es }))}`
    : appointment.date;

  // Cálculo del horario de fin basado en la duración
  let calculatedEndTime = endTime;
  if (startTime && duration) {
    const [h, m] = startTime.split(":").map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      const totalMinutes = h * 60 + m + duration;
      const endH = String(Math.floor(totalMinutes / 60) % 24).padStart(2, "0");
      const endM = String(totalMinutes % 60).padStart(2, "0");
      calculatedEndTime = `${endH}:${endM}`;
    }
  }

  // Iniciar flujo de cobro integrado
  const handleOpenCheckout = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    checkoutOpenedAtRef.current = Date.now();
    setCheckoutPrice(currentService?.price || price || 0);
    setSelectedPaymentMethod(availablePaymentMethods[0] || "Efectivo");
    setIsCheckoutView(true);
  };

  // Confirmar cobro en el backend
  const handleExecutePayment = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Prevenir click-through o envíos involuntarios inmediatos al conmutar de vista
    if (Date.now() - checkoutOpenedAtRef.current < 500) {
      return;
    }
    if (checkoutLoading) return;
    setCheckoutLoading(true);

    const res = await updateAppointment(appointment.id, {
      paid: true,
      price: checkoutPrice,
      payment_method: selectedPaymentMethod,
    });

    if (!res.success) {
      toast.error(res.error || "Error al marcar como pagado");
      setCheckoutLoading(false);
      return;
    }

    // Actualizar estado local
    setPaidInfo({ price: checkoutPrice, payment_method: selectedPaymentMethod });
    setIsPaidLocally(true);
    setPrice(checkoutPrice);

    // Emitir comprobante ARCA si el toggle está activado
    if (emitInvoice && arcaAvailable) {
      const result = await emitArcaInvoice({
        total: checkoutPrice,
        customerName: client || undefined,
        docType,
        docNumber: docNumber.trim() || undefined,
        receiverIvaCondition: receiverCondition,
        sourceType: "appointment",
        sourceId: appointment.id,
      });

      if (result.success) {
        setInvoiceId(result.invoiceId ?? null);
        toast.success(`Turno cobrado · CAE: ${result.cae}`);
      } else {
        toast.success(`Turno cobrado · Sin comprobante: ${result.error ?? "error desconocido"}`);
      }
    } else {
      toast.success("Turno marcado como cobrado con éxito");
    }

    setCheckoutLoading(false);
    setIsCheckoutView(false);
    onAppointmentChanged?.();
    onClose();
  };

  // ==========================================
  // VISTA 1: FLUJO DE COBRO INTEGRADO EN EL PANEL
  // ==========================================
  if (isCheckoutView) {
    return (
      <div className="w-full bg-[var(--bg-carousel)] border border-[var(--foreground)]/10 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col h-fit max-h-full text-left overflow-y-auto gap-4">
        {/* BLOQUE SUPERIOR DE COBRO */}
        <div className="space-y-4">
          {/* Header de cobro con botón volver */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--foreground)]/10">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsCheckoutView(false)}
                className="p-1.5 rounded-full bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)]/70 hover:text-[var(--foreground)] transition-colors"
                aria-label="Volver al detalle del turno"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] block">
                  Registrar cobro
                </span>
                <h2 className="text-xl md:text-2xl font-black text-[var(--foreground)] tracking-tight">
                  Turno #{appointment.id}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel"
              className="p-1.5 rounded-full bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mini resumen del turno */}
          <div className="bg-[var(--background)]/60 border border-[var(--foreground)]/10 rounded-2xl p-4 flex items-center justify-between shadow-inner">
            <div className="min-w-0">
              <span className="text-sm font-bold text-[var(--foreground)] block truncate">
                {currentService?.name || "Servicio"}
              </span>
              <span className="text-xs text-[var(--foreground)]/60 block truncate mt-0.5">
                {client || "Cliente"} · {currentBarber?.name || "Barbero"}
              </span>
            </div>
            <span className="text-xs font-bold text-[var(--accent)] shrink-0 bg-[var(--accent)]/10 px-2.5 py-1 rounded-lg border border-[var(--accent)]/20">
              {formattedDate}
            </span>
          </div>
        </div>

        {/* BLOQUE INFERIOR DE COBRO (FORMULARIO Y ACCIÓN) */}
        <form id="form-panel-checkout" onSubmit={handleExecutePayment} className="space-y-4">
          <div className="bg-[var(--background)]/60 border border-[var(--foreground)]/10 rounded-2xl p-5 space-y-4 shadow-inner">
            {/* Monto a cobrar con padding forzado para no pisar el símbolo $ */}
            <div>
              <label
                htmlFor="paid-price"
                className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Monto a cobrar ($)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--accent)] pointer-events-none">
                  $
                </span>
                <input
                  id="paid-price"
                  type="number"
                  min={0}
                  required
                  value={checkoutPrice}
                  onChange={(e) => setCheckoutPrice(Number(e.target.value))}
                  className="!bg-[var(--background)] !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl !py-3 !pr-4 !pl-9 w-full block text-sm font-bold shadow-inner"
                />
              </div>
            </div>

            {/* Métodos de pago configurados en admin */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                Método de pago
              </label>

              {/* Botones visuales de medios de pago */}
              <div className="grid grid-cols-2 gap-2.5">
                {availablePaymentMethods.map((method) => {
                  const isSelected = selectedPaymentMethod === method;
                  const Icon = getPaymentMethodIcon(method);
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(method)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all text-xs font-semibold cursor-pointer ${
                        isSelected
                          ? "!bg-[var(--accent)]/15 !border-[var(--accent)] text-[var(--foreground)] shadow-sm shadow-[var(--accent)]/10"
                          : "!bg-[var(--background)] !border-[var(--foreground)]/10 text-[var(--foreground)]/70 hover:text-[var(--foreground)] hover:!border-[var(--foreground)]/20"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          isSelected
                            ? "bg-[var(--accent)] text-slate-950"
                            : "bg-[var(--foreground)]/5 text-[var(--foreground)]/60"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="truncate">{method}</span>
                    </button>
                  );
                })}
              </div>

              {/* Select oculto para accesibilidad / tests */}
              <select
                id="paid-payment-method"
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="sr-only"
                aria-label="Método de pago"
              >
                {availablePaymentMethods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle ARCA (si está habilitado y configurado) */}
            {arcaAvailable && (
              <div className="border border-[var(--foreground)]/10 rounded-xl overflow-hidden bg-[var(--background)]/60">
                <button
                  type="button"
                  onClick={() => setEmitInvoice((v) => !v)}
                  className={`!w-full !flex !items-center !justify-between !p-3 !text-xs !transition-all !border-0 !rounded-none !cursor-pointer ${
                    emitInvoice
                      ? "!bg-emerald-950/40 !border-b !border-emerald-500/25 text-emerald-300"
                      : "text-[var(--foreground)]/80 hover:bg-[var(--foreground)]/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className={`w-4 h-4 ${emitInvoice ? "text-emerald-400" : "text-slate-400"}`} />
                    <span className="font-semibold">Emitir comprobante ARCA</span>
                  </div>
                  <div
                    className={`relative w-8 h-4 rounded-full transition-colors flex items-center p-0.5 ${
                      emitInvoice ? "!bg-emerald-500" : "!bg-slate-700"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-white shadow transition-transform ${
                        emitInvoice ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </div>
                </button>

                {emitInvoice && (
                  <div className="p-3 space-y-2.5 bg-emerald-950/20 border-t border-emerald-500/20">
                    <ArcaDocFields
                      idPrefix="appointment"
                      docType={docType}
                      onDocTypeChange={setDocType}
                      docNumber={docNumber}
                      onDocNumberChange={setDocNumber}
                      receiverCondition={receiverCondition}
                      onReceiverConditionChange={setReceiverCondition}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botón de confirmación de cobro al fondo */}
          <div className="pt-1">
            <button
              type="button"
              id="btn-paid-submit"
              onClick={handleExecutePayment}
              disabled={checkoutLoading}
              className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all active:scale-95 text-sm cursor-pointer"
            >
              {checkoutLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <DollarSign className="w-5 h-5 stroke-[2.5]" />
                  <span>Confirmar cobro</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ==========================================
  // VISTA 2: DETALLE DEL TURNO (ESTRUCTURA IDÉNTICA A RESERVA)
  // ==========================================
  return (
    <div className="w-full bg-[var(--bg-carousel)] border border-[var(--foreground)]/10 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col justify-between h-full text-left overflow-y-auto gap-4">
      {/* HIJO 1 (SUPERIOR): Header + Resumen del turno + Tip */}
      <div className="space-y-4">
        {/* Header con botón cerrar */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--foreground)]/10">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] block">
              Detalle del turno
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h3 className="text-xl md:text-2xl font-black text-[var(--foreground)] tracking-tight">
                Turno #{appointment.id}
              </h3>
              {isBlockedRange ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  <Clock className="w-3 h-3" />
                  Bloqueo
                </span>
              ) : isPaid ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle className="w-3 h-3" />
                  Cobrado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  <Clock className="w-3 h-3" />
                  Pendiente
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel de detalle"
            className="p-1.5 rounded-full bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Metadatos (Actualización y ARCA) */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {appointment.updated_at ? (
            <span className="text-[11px] text-[var(--foreground)]/50">
              Modificado: {format(new Date(appointment.updated_at), "dd/MM/yyyy HH:mm")}
            </span>
          ) : (
            <span className="text-[11px] text-[var(--foreground)]/50">
              Turno registrado
            </span>
          )}

          {ARCA_ENABLED && invoiceId && (
            <div className="flex items-center gap-1 text-[11px] text-green-300 font-medium px-2.5 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full">
              <Receipt className="w-3 h-3 text-green-400 shrink-0" />
              <span>Comprobante emitido</span>
            </div>
          )}
        </div>

        {/* Resumen del turno (Estilo idéntico a la reserva) */}
        <div className="bg-[var(--background)]/60 border border-[var(--foreground)]/10 rounded-2xl p-4 md:p-5 space-y-4 shadow-inner">
          {/* Tarjeta de Servicio */}
          {!isBlockedRange && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {currentService ? (
                  <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-[var(--accent)]/30 bg-[var(--background)] shadow-md">
                    <Image
                      src={isValidServiceImage && currentService.image ? currentService.image : logo}
                      alt={currentService.name}
                      fill
                      sizes="48px"
                      className="object-cover bg-[var(--background)]"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-md">
                    <Scissors className="w-5 h-5" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <span className="block text-[11px] font-bold text-[var(--foreground)]/50 tracking-wider">
                    Servicio
                  </span>

                  {isEditingService ? (
                    <div className="space-y-1.5 mt-1">
                      <select
                        id="appt-service"
                        required
                        className="!bg-[var(--background)] !text-[var(--foreground)] !border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)] transition-all rounded-xl p-2 w-full block text-sm shadow-inner cursor-pointer"
                        value={selectedServiceId}
                        onChange={(e) => {
                          setSelectedServiceId(Number(e.target.value));
                          setIsEditingService(false);
                        }}
                        autoFocus
                      >
                        <option value={-1} disabled style={{ color: "grey" }}>
                          Selecciona un servicio
                        </option>
                        {services.map((s) => (
                          <option key={s.id} value={s.id} style={{ color: "black" }}>
                            {s.name} (${s.price?.toLocaleString("es-AR")} · {s.duration} min)
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setIsEditingService(false)}
                        className="text-[11px] font-semibold text-[var(--accent)] hover:underline inline-block"
                      >
                        Cerrar selección
                      </button>
                    </div>
                  ) : (
                    <>
                      {currentService ? (
                        <>
                          <span className="font-extrabold text-base text-[var(--foreground)] truncate block leading-tight">
                            {currentService.name}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-black text-[var(--accent)]">
                              ${currentService.price?.toLocaleString("es-AR")}
                            </span>
                            <span className="text-[11px] text-[var(--foreground)]/60 font-semibold bg-[var(--foreground)]/5 px-2 py-0.5 rounded-md border border-[var(--foreground)]/10">
                              {duration} min
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Sin servicio asignado
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {!isEditingService && !isLocked && (
                <button
                  type="button"
                  onClick={() => setIsEditingService(true)}
                  className="text-xs font-bold text-[var(--accent)] hover:underline shrink-0 px-2.5 py-1.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-all"
                >
                  Cambiar
                </button>
              )}
            </div>
          )}

          {/* Tarjeta de Profesional */}
          <div
            className={`flex items-center justify-between gap-3 ${
              !isBlockedRange ? "pt-4 border-t border-[var(--foreground)]/10" : ""
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-[var(--accent)]/30 bg-[var(--background)] shadow-md">
                <Image
                  src={isValidBarberImage && barberImage ? barberImage : logo}
                  alt={currentBarber?.name || "Profesional"}
                  fill
                  sizes="48px"
                  className="object-cover bg-[var(--background)]"
                />
              </div>

              <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold text-[var(--foreground)]/50 tracking-wider">
                  Profesional
                </span>

                {isEditingBarber ? (
                  <div className="space-y-1.5 mt-1">
                    <BarberSelector
                      id="appt-barber"
                      barbers={barbers?.filter((b) => b.active !== false) ?? []}
                      selectedBarberId={selectedBarberId}
                      onChange={(id) => {
                        setSelectedBarberId(id);
                        setIsEditingBarber(false);
                      }}
                      className="w-full !h-[38px] !py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditingBarber(false)}
                      className="text-[11px] font-semibold text-[var(--accent)] hover:underline inline-block"
                    >
                      Cerrar selección
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="font-extrabold text-base text-[var(--foreground)] truncate block leading-tight">
                      {currentBarber?.name || "Sin barbero asignado"}
                    </span>
                    <span className="text-[11px] text-[var(--foreground)]/60 font-medium block mt-0.5">
                      {currentBarber?.role === "admin"
                        ? "Administrador / barbero"
                        : "Barbero profesional"}
                    </span>
                  </>
                )}
              </div>
            </div>

            {!isEditingBarber && !isLocked && (
              <button
                type="button"
                onClick={() => setIsEditingBarber(true)}
                className="text-xs font-bold text-[var(--accent)] hover:underline shrink-0 px-2.5 py-1.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-all"
              >
                Cambiar
              </button>
            )}
          </div>

          {/* Tarjeta de Fecha y horario */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--foreground)]/10">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] shrink-0 shadow-md">
                <Calendar className="w-5 h-5" />
              </div>

              <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold text-[var(--foreground)]/50 tracking-wider">
                  Fecha y horario
                </span>

                {isEditingDateTime ? (
                  <div className="space-y-2 mt-1">
                    {isBlockedRange ? (
                      <div className="space-y-2">
                        <DatePickerField date={date} onChange={setDate} />
                        <div className="grid grid-cols-2 gap-2">
                          <TimeSelect
                            id="appt-blocked-start-time"
                            label="Inicio"
                            value={startTime}
                            options={allAppointments}
                            onChange={setStartTime}
                          />
                          <TimeSelect
                            id="appt-blocked-end-time"
                            label="Fin"
                            value={endTime}
                            options={allAppointments.filter((t) => t > startTime)}
                            onChange={setEndTime}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <DatePickerField date={date} onChange={setDate} />
                        </div>
                        <div className="w-[110px] shrink-0">
                          <TimeSelect
                            id="appt-start-time"
                            label=""
                            value={startTime}
                            options={allAppointments}
                            onChange={setStartTime}
                            className="h-full"
                            selectClassName="!h-[42px] text-sm"
                          />
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsEditingDateTime(false)}
                      className="text-[11px] font-semibold text-[var(--accent)] hover:underline inline-block"
                    >
                      Listo
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="font-extrabold text-base text-[var(--foreground)] block leading-tight">
                      {formattedDate}
                    </span>
                    <span className="block text-sm font-black text-[var(--accent)] mt-0.5">
                      {isBlockedRange
                        ? `${startTime} a ${endTime} hs`
                        : `${startTime} a ${calculatedEndTime} hs (${duration} min)`}
                    </span>
                  </>
                )}
              </div>
            </div>

            {!isEditingDateTime && !isLocked && (
              <button
                type="button"
                onClick={() => setIsEditingDateTime(true)}
                className="text-xs font-bold text-[var(--accent)] hover:underline shrink-0 px-2.5 py-1.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-all"
              >
                Cambiar
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-[var(--foreground)]/50 italic text-center py-0.5">
          💡 Podés tocar en Cambiar para modificar el servicio, barbero o fecha y horario.
        </p>
      </div>

      {/* HIJO 2 (INFERIOR): Datos del cliente + Botones (Llega hasta el fondo) */}
      <form id="form-appointment-detail-split" onSubmit={handleUpdate} className="space-y-3.5">
        <div className="bg-[var(--background)]/60 border border-[var(--foreground)]/10 rounded-2xl p-4 md:p-5 space-y-3.5 shadow-inner">
          <div className="flex items-center justify-between pb-2.5 border-b border-[var(--foreground)]/10">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] block">
                Gestión
              </span>
              <h4 className="text-base font-extrabold text-[var(--foreground)] tracking-tight">
                {isBlockedRange ? "Motivo de bloqueo" : "Datos del cliente"}
              </h4>
            </div>
            <User className="w-5 h-5 text-[var(--accent)]/70" />
          </div>

          {isBlockedRange ? (
            <div>
              <label
                htmlFor="appt-blocked-reason"
                className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5"
              >
                Motivo
              </label>
              <input
                id="appt-blocked-reason"
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Ej: Almuerzo, feriado, descanso"
                className="!bg-[var(--background)] !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl p-2.5 w-full block text-sm shadow-inner"
              />
            </div>
          ) : (
            <div className="space-y-3.5">
              <ClientAutocompleteFields
                name={client}
                phone={phone}
                onNameChange={setClient}
                onPhoneChange={setPhone}
                onClientResolved={() => {}}
                disabled={isLocked}
                phoneSuffix={
                  whatsappUrl ? (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] min-w-[44px] px-3.5 py-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-xs font-semibold transition-all cursor-pointer"
                      title="Abrir chat de WhatsApp"
                      aria-label="Abrir chat de WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </a>
                  ) : null
                }
              />

              {/* Si ya está pagado, campo de monto cobrado con padding forzado */}
              {isPaid && (
                <div className="pt-2 border-t border-[var(--foreground)]/10">
                  <label
                    htmlFor="appt-price"
                    className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5"
                  >
                    Monto cobrado ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--accent)] pointer-events-none">
                      $
                    </span>
                    <input
                      id="appt-price"
                      type="number"
                      disabled={isLocked}
                      value={paidInfo?.price ?? price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className={`!bg-[var(--background)] !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl !py-2.5 !pr-3 !pl-8 w-full block text-xs shadow-inner font-bold ${
                        isLocked ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTÓN HERO: Cobrar turno si está pendiente */}
        {!isPaid && !isBlockedRange && (
          <div className="pt-0.5">
            <button
              type="button"
              id="btn-appt-charge"
              onClick={(e) => handleOpenCheckout(e)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all active:scale-95 text-sm cursor-pointer"
            >
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
              <span>Cobrar turno</span>
            </button>
          </div>
        )}

        {/* Banner si ya está cobrado */}
        {isPaid && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
            <div className="flex items-center gap-2.5 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              <div>
                <span className="text-xs font-bold block leading-tight">Turno cobrado</span>
                <span className="text-[11px] text-emerald-400/80 font-medium">
                  Monto registrado: ${(paidInfo?.price ?? price)?.toLocaleString("es-AR")}
                  {(paidInfo?.payment_method || appointment.payment_method) ? ` · ${paidInfo?.payment_method || appointment.payment_method}` : ""}
                </span>
              </div>
            </div>
            {ARCA_ENABLED && invoiceId && (
              <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-lg">
                Comprobante #{invoiceId}
              </span>
            )}
          </div>
        )}

        {/* Revertir cobro si está cobrado y no tiene comprobante */}
        {isPaid && !invoiceId && (
          <div className="space-y-2">
            {!confirmRevertPayment ? (
              <button
                type="button"
                id="btn-revert-payment"
                onClick={() => setConfirmRevertPayment(true)}
                className="w-full flex items-center justify-center gap-2 border border-amber-500/30 hover:border-amber-500/60 text-amber-400 hover:bg-amber-500/10 min-h-[44px] px-3.5 py-2.5 rounded-xl transition-all text-xs font-bold cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Revertir cobro</span>
              </button>
            ) : (
              <InlineConfirm
                message="¿Revertir el cobro de este turno?"
                confirmText="Sí, revertir"
                cancelText="No"
                loading={reversingPayment}
                onConfirm={handleRevertPayment}
                onCancel={() => setConfirmRevertPayment(false)}
              />
            )}
          </div>
        )}

        {/* Bloque Comprobante emitido */}
        {hasInvoice && invoice && (
          <div className="bg-[var(--background)]/60 border border-[var(--foreground)]/10 rounded-2xl p-4 md:p-5 space-y-3.5 shadow-inner">
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--foreground)]/10">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-extrabold text-[var(--foreground)] tracking-tight">
                  Comprobante emitido
                </h4>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                {invoice.voucher_type === 6 ? "Factura B" : "Factura C"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Número
                </span>
                <span className="font-mono font-bold text-[var(--foreground)]">
                  {invoice.point_of_sale != null && invoice.voucher_number != null
                    ? `${String(invoice.point_of_sale).padStart(4, "0")}-${String(invoice.voucher_number).padStart(8, "0")}`
                    : `#${invoiceId}`}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Estado fiscal
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  Aprobado
                </span>
              </div>

              <div className="col-span-2 bg-[var(--background)] rounded-xl p-3 border border-[var(--foreground)]/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Código CAE
                  </span>
                  {invoice.cae && (
                    <button
                      type="button"
                      onClick={() => handleCopyCae(invoice.cae!)}
                      className="text-[11px] font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1 cursor-pointer min-h-[44px] sm:min-h-0"
                      aria-label="Copiar CAE"
                    >
                      {copiedCae ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar CAE</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <p className="font-mono text-sm font-bold text-emerald-400">
                  {invoice.cae || "—"}
                </p>
                {invoice.cae_due_date && (
                  <span className="text-[10px] text-slate-400 block">
                    Vencimiento: {invoice.cae_due_date}
                  </span>
                )}
              </div>

              {invoice.customer_name && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Receptor
                  </span>
                  <span className="font-medium text-[var(--foreground)] truncate block">
                    {invoice.customer_name}
                  </span>
                </div>
              )}

              {invoice.doc_number && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Documento
                  </span>
                  <span className="font-medium text-[var(--foreground)] truncate block">
                    {invoice.doc_number}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FILA DE ACCIONES SECUNDARIAS: Eliminar y Guardar cambios */}
        <div className="pt-2 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              id="btn-appt-delete"
              aria-label="Eliminar"
              disabled={isDeleteDisabled || loading}
              onClick={() => setConfirmDelete(true)}
              title={
                isLocked
                  ? "Este turno tiene comprobante fiscal: no se puede modificar."
                  : isPaid
                  ? "No se puede eliminar un turno que ya fue cobrado"
                  : undefined
              }
              className="w-full flex items-center justify-center gap-2 border border-red-500/30 hover:border-red-500/60 text-red-400 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed font-bold py-2.5 px-3 rounded-xl transition-all text-xs active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isBlockedRange ? "Desbloquear" : "Eliminar"}</span>
            </button>

            <button
              type="submit"
              id="btn-appt-save"
              aria-label="Guardar cambios"
              disabled={!hasChanges || loadingUpdate || isLocked}
              title={
                isLocked
                  ? "Este turno tiene comprobante fiscal: no se puede modificar."
                  : undefined
              }
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all text-xs font-black active:scale-95 ${
                hasChanges && !loadingUpdate && !isLocked
                  ? "!bg-[var(--accent)] hover:!bg-[var(--accent-hover)] !text-slate-950 shadow-md shadow-[var(--accent)]/20 cursor-pointer animate-pulse"
                  : "!bg-[var(--foreground)]/5 !text-[var(--foreground)]/30 border border-[var(--foreground)]/10 cursor-not-allowed"
              }`}
            >
              {loadingUpdate ? (
                <Loader2 className="w-4 h-4 animate-spin text-inherit" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{hasChanges ? "Guardar cambios" : "Sin cambios"}</span>
                </>
              )}
            </button>
          </div>

          {confirmDelete && (
            <InlineConfirm
              message={
                isBlockedRange
                  ? "¿Desbloquear este horario? El horario volverá a quedar disponible para reservas en la agenda pública."
                  : "¿Eliminar este turno? Esta acción no se puede deshacer y el horario quedará libre para otros clientes."
              }
              confirmText={isBlockedRange ? "Desbloquear" : "Eliminar"}
              cancelText="Cancelar"
              onConfirm={async () => {
                const ok = await handleDelete();
                if (ok) {
                  setConfirmDelete(false);
                  onClose();
                  onAppointmentChanged?.();
                }
              }}
              onCancel={() => setConfirmDelete(false)}
              loading={loading}
            />
          )}

          {isLocked ? (
            <p className="text-[11px] text-amber-400/90 text-center font-medium mt-2">
              Este turno tiene comprobante fiscal: no se puede modificar.
            </p>
          ) : isDeleteDisabled ? (
            <p className="text-[11px] text-amber-400/90 text-center font-medium mt-2">
              Este turno ya fue cobrado y no puede ser eliminado.
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
