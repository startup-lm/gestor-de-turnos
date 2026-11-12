"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Appointment } from "@/lib/types/Appointment";
import { Barber } from "@/lib/types/Barbers";
import { generateAllAppointments } from "@/utils/appointments";
import { DetailFormSkeleton } from "../loading/Skeleton";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { useAppointmentDetailsLogic } from "@/lib/hooks/useAppointmentDetailsLogic";
import { updateAppointment } from "@/lib/repository/appointments";
import { emitArcaInvoice, getArcaStatus } from "@/lib/repository/arca";
import { useFetchOnce } from "@/lib/hooks/useFetchOnce";
import { ArcaStatus, ArcaDocType } from "@/lib/types/Arca";
import { CONSUMIDOR_FINAL } from "@/lib/arca/receiverConditions";
import { toast } from "@/lib/store/useToastStore";
import { capitalize } from "./appointment-details/utils";
import { AppointmentHeader } from "./appointment-details/AppointmentHeader";
import { AppointmentCheckoutView } from "./appointment-details/AppointmentCheckoutView";
import { AppointmentSummarySection } from "./appointment-details/AppointmentSummarySection";
import { AppointmentClientSection } from "./appointment-details/AppointmentClientSection";
import { AppointmentPaymentStatusSection } from "./appointment-details/AppointmentPaymentStatusSection";
import { AppointmentInvoiceSection } from "./appointment-details/AppointmentInvoiceSection";
import { AppointmentActionsSection } from "./appointment-details/AppointmentActionsSection";

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

  const handleDeleteConfirm = async () => {
    const ok = await handleDelete();
    if (ok) {
      setConfirmDelete(false);
      onClose();
      onAppointmentChanged?.();
    }
  };

  // ==========================================
  // VISTA 1: FLUJO DE COBRO INTEGRADO EN EL PANEL
  // ==========================================
  if (isCheckoutView) {
    return (
      <AppointmentCheckoutView
        appointment={appointment}
        currentService={currentService}
        client={client}
        currentBarber={currentBarber}
        formattedDate={formattedDate}
        checkoutPrice={checkoutPrice}
        setCheckoutPrice={setCheckoutPrice}
        availablePaymentMethods={availablePaymentMethods}
        selectedPaymentMethod={selectedPaymentMethod}
        setSelectedPaymentMethod={setSelectedPaymentMethod}
        arcaAvailable={arcaAvailable}
        emitInvoice={emitInvoice}
        setEmitInvoice={setEmitInvoice}
        docType={docType}
        setDocType={setDocType}
        docNumber={docNumber}
        setDocNumber={setDocNumber}
        receiverCondition={receiverCondition}
        setReceiverCondition={setReceiverCondition}
        checkoutLoading={checkoutLoading}
        onBack={() => setIsCheckoutView(false)}
        onClose={onClose}
        onSubmit={handleExecutePayment}
      />
    );
  }

  // ==========================================
  // VISTA 2: DETALLE DEL TURNO (ESTRUCTURA IDÉNTICA A RESERVA)
  // ==========================================
  return (
    <div className="w-full bg-[var(--bg-carousel)] border border-[var(--foreground)]/10 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col justify-between h-full text-left overflow-y-auto gap-4">
      {/* HIJO 1 (SUPERIOR): Header + Resumen del turno + Tip */}
      <div className="space-y-4">
        <AppointmentHeader
          appointment={appointment}
          isBlockedRange={isBlockedRange}
          isPaid={isPaid}
          arcaEnabled={ARCA_ENABLED}
          invoiceId={invoiceId}
          onClose={onClose}
        />

        <AppointmentSummarySection
          isBlockedRange={isBlockedRange}
          currentService={currentService}
          isValidServiceImage={isValidServiceImage}
          isEditingService={isEditingService}
          setIsEditingService={setIsEditingService}
          services={services}
          selectedServiceId={selectedServiceId}
          setSelectedServiceId={setSelectedServiceId}
          duration={duration}
          isLocked={isLocked}
          currentBarber={currentBarber}
          isValidBarberImage={isValidBarberImage}
          barberImage={barberImage}
          isEditingBarber={isEditingBarber}
          setIsEditingBarber={setIsEditingBarber}
          barbers={barbers}
          selectedBarberId={selectedBarberId}
          setSelectedBarberId={setSelectedBarberId}
          isEditingDateTime={isEditingDateTime}
          setIsEditingDateTime={setIsEditingDateTime}
          date={date}
          setDate={setDate}
          startTime={startTime}
          setStartTime={setStartTime}
          endTime={endTime}
          setEndTime={setEndTime}
          calculatedEndTime={calculatedEndTime}
          allAppointments={allAppointments}
          formattedDate={formattedDate}
        />
      </div>

      {/* HIJO 2 (INFERIOR): Datos del cliente + Botones (Llega hasta el fondo) */}
      <form id="form-appointment-detail-split" onSubmit={handleUpdate} className="space-y-3.5">
        <AppointmentClientSection
          isBlockedRange={isBlockedRange}
          client={client}
          setClient={setClient}
          phone={phone}
          setPhone={setPhone}
          isLocked={isLocked}
          whatsappUrl={whatsappUrl}
          isPaid={isPaid}
          paidInfo={paidInfo}
          price={price}
          setPrice={setPrice}
        />

        <AppointmentPaymentStatusSection
          isPaid={isPaid}
          isBlockedRange={isBlockedRange}
          loading={loading}
          onOpenCheckout={handleOpenCheckout}
          paidInfo={paidInfo}
          price={price}
          appointment={appointment}
          arcaEnabled={ARCA_ENABLED}
          invoiceId={invoiceId}
          confirmRevertPayment={confirmRevertPayment}
          setConfirmRevertPayment={setConfirmRevertPayment}
          reversingPayment={reversingPayment}
          onRevertPayment={handleRevertPayment}
        />

        <AppointmentInvoiceSection
          hasInvoice={hasInvoice}
          invoice={invoice}
          invoiceId={invoiceId}
          copiedCae={copiedCae}
          onCopyCae={handleCopyCae}
        />

        <AppointmentActionsSection
          isDeleteDisabled={isDeleteDisabled}
          loading={loading}
          isBlockedRange={isBlockedRange}
          isLocked={isLocked}
          isPaid={isPaid}
          hasChanges={hasChanges}
          loadingUpdate={loadingUpdate}
          confirmDelete={confirmDelete}
          setConfirmDelete={setConfirmDelete}
          onDeleteConfirm={handleDeleteConfirm}
        />
      </form>
    </div>
  );
}
