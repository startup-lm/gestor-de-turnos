"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFetchOnce } from "@/lib/hooks/useFetchOnce";
import { Service } from "@/lib/types/Services";
import { getServices } from "@/lib/repository/services";
import BarberSelector from "@/components/turnos/BarberSelector";
import { Barber } from "@/lib/types/Barbers";
import { getBarbers } from "@/lib/repository/barbers";
import { DetailFormSkeleton } from "@/components/loading/Skeleton";
import { updateAppointment, deleteAppointment } from "@/lib/repository/appointments";
import { emitArcaInvoice, getArcaStatus } from "@/lib/repository/arca";
import { ArcaStatus, ArcaDocType } from "@/lib/types/Arca";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { toast } from "@/lib/store/useToastStore";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { Appointment } from "@/lib/types/Appointment";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { normalizePhone } from "@/utils/phone";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  FileText,
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  Receipt,
  Hash,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Copy,
  Check,
  ArrowUpRight,
} from "lucide-react";

const DOC_TYPES: { value: ArcaDocType; label: string }[] = [
  { value: 99, label: "Consumidor final" },
  { value: 96, label: "DNI" },
  { value: 80, label: "CUIT" },
  { value: 86, label: "CUIL" },
];

interface Props {
  initialAppointment: Appointment;
}

export default function TurnoDetailClient({ initialAppointment }: Readonly<Props>) {
  const router = useRouter();
  const { businessSettings, isEnabled } = useBusinessContext();
  const ARCA_ENABLED = isEnabled("arca");

  const { data: servicesData, loading: loadingServices } = useFetchOnce<Service[]>(
    "services",
    getServices
  );
  const { data: barbers = [], loading: loadingBarbers } = useFetchOnce<Barber[]>(
    "barbers",
    getBarbers
  );
  const { data: arcaStatus } = useFetchOnce<ArcaStatus>("arcaStatus", getArcaStatus);

  const services = useMemo<Service[]>(() => servicesData ?? [], [servicesData]);

  const availablePaymentMethods = useMemo(() => {
    if (businessSettings?.payment_methods && businessSettings.payment_methods.length > 0) {
      return businessSettings.payment_methods;
    }
    return ["Efectivo", "Mercado Pago"];
  }, [businessSettings?.payment_methods]);

  // Form states
  const [client, setClient] = useState<string>(initialAppointment.client);
  const [phone, setPhone] = useState<string>(initialAppointment.phone || "");
  const [serviceId, setServiceId] = useState<number>(initialAppointment.service_id);
  const [barberId, setBarberId] = useState<number>(initialAppointment.barber_id);
  const [date, setDate] = useState<string>(initialAppointment.date);
  const [startTime, setStartTime] = useState<string>(
    initialAppointment.start_time?.slice(0, 5) || "10:00"
  );
  const [endTime, setEndTime] = useState<string>(
    initialAppointment.end_time?.slice(0, 5) || "10:30"
  );
  const [paid, setPaid] = useState<boolean>(initialAppointment.paid);
  const [price, setPrice] = useState<number>(initialAppointment.price || 0);
  const [paymentMethod, setPaymentMethod] = useState<string>(
    initialAppointment.payment_method || availablePaymentMethods[0] || "Efectivo"
  );

  // Action states
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // ARCA
  const arcaAvailable = ARCA_ENABLED && !!arcaStatus?.ready;
  const hasExistingInvoice = !!initialAppointment.arca_invoice_id;
  const isLocked = initialAppointment.type !== "block" && hasExistingInvoice;
  const invoice = initialAppointment.arca_invoices;
  const [copiedCae, setCopiedCae] = useState(false);

  const handleCopyCae = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCae(true);
    toast.success("CAE copiado al portapapeles");
    setTimeout(() => setCopiedCae(false), 2000);
  };

  const [emitInvoice, setEmitInvoice] = useState(false);
  const [docType, setDocType] = useState<ArcaDocType>(99);
  const [docNumber, setDocNumber] = useState("");

  // Dirty check
  const isDirty =
    client.trim() !== initialAppointment.client.trim() ||
    phone.trim() !== (initialAppointment.phone ?? "").trim() ||
    serviceId !== initialAppointment.service_id ||
    barberId !== initialAppointment.barber_id ||
    date !== initialAppointment.date ||
    startTime !== (initialAppointment.start_time?.slice(0, 5) || "") ||
    endTime !== (initialAppointment.end_time?.slice(0, 5) || "") ||
    paid !== initialAppointment.paid ||
    price !== (initialAppointment.price || 0) ||
    paymentMethod !== (initialAppointment.payment_method || availablePaymentMethods[0] || "Efectivo") ||
    emitInvoice;

  const handleServiceChange = (newServiceId: number) => {
    setServiceId(newServiceId);
    const selectedServ = services.find((s) => s.id === newServiceId);
    if (selectedServ) {
      setPrice(selectedServ.price);
      // Auto-recalculate end_time based on service duration
      if (selectedServ.duration && startTime) {
        const [hours, minutes] = startTime.split(":").map(Number);
        const totalMinutes = hours * 60 + minutes + selectedServ.duration;
        const newHours = Math.floor(totalMinutes / 60) % 24;
        const newMins = totalMinutes % 60;
        setEndTime(
          `${String(newHours).padStart(2, "0")}:${String(newMins).padStart(2, "0")}`
        );
      }
    }
  };

  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    const selectedServ = services.find((s) => s.id === serviceId);
    const duration = selectedServ?.duration || 30;
    if (newStartTime) {
      const [hours, minutes] = newStartTime.split(":").map(Number);
      const totalMinutes = hours * 60 + minutes + duration;
      const newHours = Math.floor(totalMinutes / 60) % 24;
      const newMins = totalMinutes % 60;
      setEndTime(
        `${String(newHours).padStart(2, "0")}:${String(newMins).padStart(2, "0")}`
      );
    }
  };

  const handleBack = () => {
    router.push("/admin?tab=turnos");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.trim()) {
      toast.error("El nombre del cliente no puede estar vacío");
      return;
    }
    if (!date) {
      toast.error("Debes seleccionar una fecha");
      return;
    }
    if (!startTime || !endTime) {
      toast.error("El horario de inicio y fin son obligatorios");
      return;
    }

    if (isLocked) {
      toast.error("No es posible editar un turno que ya posee comprobante fiscal emitido");
      return;
    }

    setSaving(true);
    try {
      const res = await updateAppointment(initialAppointment.id, {
        client: client.trim(),
        phone: phone.trim() ? normalizePhone(phone.trim()).e164 : "",
        service_id: serviceId,
        barber_id: barberId,
        date,
        start_time: startTime,
        end_time: endTime,
        paid,
        price,
        payment_method: paymentMethod,
      });

      if (!res.success) {
        toast.error(res.error || "No se pudo actualizar el turno");
        setSaving(false);
        return;
      }

      // If user toggled to emit an invoice
      if (emitInvoice && arcaAvailable && !hasExistingInvoice && paid) {
        const arcaResult = await emitArcaInvoice({
          total: price,
          docType,
          docNumber: docNumber.trim() || undefined,
          sourceType: "appointment",
          sourceId: initialAppointment.id,
        });

        if (arcaResult.success) {
          toast.success(`Turno actualizado · Factura C emitida (CAE: ${arcaResult.cae})`);
        } else {
          toast.success("Turno actualizado · Aviso: no se emitió comprobante fiscal");
        }
      } else {
        toast.success("Turno actualizado con éxito");
      }

      handleBack();
    } catch (err) {
      console.error("Error al actualizar turno:", err);
      toast.error("Error inesperado al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  const isDeleteDisabled =
    initialAppointment.type !== "block" &&
    (initialAppointment.paid || !!initialAppointment.arca_invoice_id);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await deleteAppointment(initialAppointment.id);
      if (res.success) {
        toast.success("Turno eliminado con éxito");
        handleBack();
      } else {
        toast.error(res.error || "Error al eliminar el turno");
        setIsConfirmingDelete(false);
      }
    } catch (err) {
      console.error("Error al eliminar turno:", err);
      toast.error("Error inesperado al eliminar el turno");
      setIsConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const cleanPhoneDigits = phone.replace(/\D/g, "");
  const whatsappUrl = cleanPhoneDigits ? `https://wa.me/${cleanPhoneDigits}` : null;

  const formattedCreationDate = initialAppointment.created_at
    ? format(new Date(initialAppointment.created_at), "EEE d MMM yyyy, HH:mm'hs'", { locale: es })
    : null;

  if (loadingServices || loadingBarbers) {
    return (
      <div className="w-full max-w-[1720px] mx-auto px-4 md:px-8 py-8 md:py-12">
        <DetailFormSkeleton />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 md:px-8 py-8 md:py-12 space-y-6 animate-in fade-in duration-300">
      {/* Cabecera con Volver y Botones de Acción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)] hover:text-white transition-colors cursor-pointer group mb-1"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Volver a turnos</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
              Editar turno
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 text-xs font-mono text-slate-400">
              <Hash className="w-3 h-3 text-[var(--accent)]" />
              {initialAppointment.id}
            </span>
            {initialAppointment.type === "block" && (
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                Bloqueo de horario
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Modificá los datos de la reserva o el estado del pago
          </p>
        </div>

        {/* Acciones principales en cabecera */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsConfirmingDelete(true)}
            disabled={deleting || saving || isDeleteDisabled}
            title={
              initialAppointment.arca_invoice_id
                ? "No se puede eliminar un turno que ya posee comprobante fiscal emitido ante ARCA"
                : initialAppointment.paid
                ? "No se puede eliminar un turno que ya fue cobrado"
                : undefined
            }
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 border border-red-500/20 text-xs md:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            <span>Eliminar turno</span>
          </button>

          <button
            type="submit"
            form="appointment-edit-form"
            disabled={!isDirty || saving || isLocked}
            title={
              isLocked
                ? "No se puede editar un turno que ya posee comprobante fiscal emitido ante ARCA"
                : undefined
            }
            className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all shadow-md active:scale-95 min-h-[40px] ${
              isDirty && !saving && !isLocked
                ? "!bg-[var(--accent)] hover:!bg-[#E8CA8C] !text-slate-950 shadow-[var(--accent)]/20 cursor-pointer"
                : "!bg-white/5 !text-slate-500 border border-white/10 cursor-not-allowed opacity-50"
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin text-inherit" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar cambios</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Formulario en 2 Columnas idéntico a SaleSplitPanel */}
      <form id="appointment-edit-form" onSubmit={handleSave} className="space-y-6">
        {isLocked && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-sm animate-in fade-in">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400" />
            <div>
              <span className="font-bold block">Turno bloqueado fiscalmente</span>
              <span className="text-xs text-amber-300/80">
                Este turno cuenta con comprobante fiscal emitido ante ARCA (Factura #{initialAppointment.arca_invoice_id}) y no puede ser modificado ni eliminado.
              </span>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Datos del Turno y Horario */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card: Datos de la Reserva */}
            <div className="bg-gradient-to-b from-[var(--foreground)]/5 to-[var(--foreground)]/2 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-[var(--accent)] text-sm font-bold uppercase tracking-wider">
                  <User className="w-4 h-4" />
                  <span>Datos del cliente y servicio</span>
                </div>
                {formattedCreationDate && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 capitalize">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formattedCreationDate}</span>
                  </div>
                )}
              </div>

              {/* Cliente */}
              <div>
                <label htmlFor="appt-client" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                  Nombre del cliente *
                </label>
                <input
                  id="appt-client"
                  type="text"
                  required
                  disabled={isLocked}
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className={`w-full !bg-[var(--background)] !text-[var(--foreground)] !border !border-[var(--foreground)]/15 focus:!border-[var(--accent)] rounded-xl p-3 text-sm transition-all outline-none ${
                    isLocked ? "!opacity-60 !cursor-not-allowed" : ""
                  }`}
                />
              </div>

              {/* Teléfono y WhatsApp */}
              <div>
                <label htmlFor="appt-phone" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                  Teléfono / WhatsApp
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="appt-phone"
                    type="text"
                    disabled={isLocked}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: +54 9 11 1234-5678"
                    className={`flex-1 !bg-[var(--background)] !text-[var(--foreground)] !border !border-[var(--foreground)]/15 focus:!border-[var(--accent)] rounded-xl p-3 text-sm transition-all outline-none font-mono ${
                      isLocked ? "!opacity-60 !cursor-not-allowed" : ""
                    }`}
                  />
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-xs font-semibold transition-all cursor-pointer"
                      title="Abrir chat de WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Selector de Servicio */}
              <div>
                <label htmlFor="appt-service" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                  Servicio *
                </label>
                <select
                  id="appt-service"
                  required
                  disabled={isLocked}
                  value={serviceId}
                  onChange={(e) => handleServiceChange(Number(e.target.value))}
                  className={`w-full !bg-[var(--background)] !text-[var(--foreground)] !border !border-[var(--foreground)]/15 focus:!border-[var(--accent)] rounded-xl p-3 text-sm transition-all outline-none ${
                    isLocked ? "!opacity-60 !cursor-not-allowed" : ""
                  }`}
                >
                  <option value={-1} disabled style={{ color: "black" }}>
                    Seleccioná un servicio
                  </option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id} style={{ color: "black" }}>
                      {s.name} — ${s.price?.toLocaleString("es-AR") ?? 0} ({s.duration || 30} min)
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Barbero */}
              <div>
                <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                  Barbero / profesional
                </label>
                <BarberSelector
                  id="appt-barber"
                  barbers={barbers ?? []}
                  selectedBarberId={barberId}
                  onChange={setBarberId}
                  disabled={isLocked}
                  className="w-full"
                />
              </div>
            </div>

            {/* Card: Fecha y Horario */}
            <div className="bg-gradient-to-b from-[var(--foreground)]/5 to-[var(--foreground)]/2 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-5">
              <div className="flex items-center gap-2 text-[var(--accent)] text-sm font-bold uppercase tracking-wider border-b border-white/10 pb-3">
                <Clock className="w-4 h-4" />
                <span>Fecha y Horario de la Reserva</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Fecha */}
                <div>
                  <label htmlFor="appt-date" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                    Fecha *
                  </label>
                  <input
                    id="appt-date"
                    type="date"
                    required
                    disabled={isLocked}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={`w-full !bg-[var(--background)] !text-[var(--foreground)] !border !border-[var(--foreground)]/15 focus:!border-[var(--accent)] rounded-xl p-3 text-sm transition-all outline-none ${
                      isLocked ? "!opacity-60 !cursor-not-allowed" : ""
                    }`}
                  />
                </div>

                {/* Horario Inicio */}
                <div>
                  <label htmlFor="appt-start" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                    Horario desde *
                  </label>
                  <input
                    id="appt-start"
                    type="time"
                    required
                    disabled={isLocked}
                    value={startTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className={`w-full !bg-[var(--background)] !text-[var(--foreground)] !border !border-[var(--foreground)]/15 focus:!border-[var(--accent)] rounded-xl p-3 text-sm font-mono transition-all outline-none ${
                      isLocked ? "!opacity-60 !cursor-not-allowed" : ""
                    }`}
                  />
                </div>

                {/* Horario Fin */}
                <div>
                  <label htmlFor="appt-end" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                    Horario hasta *
                  </label>
                  <input
                    id="appt-end"
                    type="time"
                    required
                    disabled={isLocked}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={`w-full !bg-[var(--background)] !text-[var(--foreground)] !border !border-[var(--foreground)]/15 focus:!border-[var(--accent)] rounded-xl p-3 text-sm font-mono transition-all outline-none ${
                      isLocked ? "!opacity-60 !cursor-not-allowed" : ""
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Estado de Cobro y Facturación ARCA */}
          <div className="lg:col-span-5 space-y-6">
            {/* Card: Tarjeta de Cobro y Precio */}
            <div className="bg-gradient-to-b from-[var(--accent)]/15 to-[var(--accent)]/5 border border-[var(--accent)]/30 rounded-2xl p-6 shadow-xl space-y-5">
              <div>
                <span className="text-[11px] font-bold text-[var(--accent)] uppercase tracking-wider block mb-1">
                  Estado del cobro
                </span>
                <p className="text-xs text-slate-400">
                  Control de pago y método seleccionado para este turno
                </p>
              </div>

              {/* Botones de Estado: Pagado / Pendiente */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => setPaid(true)}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all border ${
                    isLocked ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                  } ${
                    paid
                      ? "bg-green-500/20 text-green-400 border-green-500/40 shadow-sm"
                      : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pagado</span>
                </button>
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => setPaid(false)}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all border ${
                    isLocked ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                  } ${
                    !paid
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm"
                      : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Pendiente</span>
                </button>
              </div>

              {/* Precio */}
              <div>
                <label htmlFor="appt-price" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                  Precio del servicio ($)
                </label>
                <input
                  id="appt-price"
                  type="number"
                  min={0}
                  required
                  disabled={isLocked}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className={`w-full !bg-[var(--background)] !text-[var(--foreground)] !border !border-[var(--foreground)]/15 focus:!border-[var(--accent)] rounded-xl p-3 text-lg font-bold transition-all outline-none ${
                    isLocked ? "!opacity-60 !cursor-not-allowed" : ""
                  }`}
                />
              </div>

              {/* Método de pago */}
              <div>
                <label htmlFor="appt-payment-method" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                  Método de pago
                </label>
                <select
                  id="appt-payment-method"
                  disabled={isLocked}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className={`w-full !bg-[var(--background)] !text-[var(--foreground)] !border !border-[var(--foreground)]/15 focus:!border-[var(--accent)] rounded-xl p-3 text-sm transition-all outline-none ${
                    isLocked ? "!opacity-60 !cursor-not-allowed" : ""
                  }`}
                >
                  {availablePaymentMethods.map((method) => (
                    <option key={method} value={method} style={{ color: "black" }}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-[var(--accent)]/20 flex items-baseline justify-between">
                <span className="text-xs text-slate-400 font-medium">Total a liquidar:</span>
                <span className="text-3xl font-black text-[var(--accent)] tracking-tight">
                  ${price.toLocaleString("es-AR")}
                </span>
              </div>
            </div>

            {/* Sección ARCA */}
            {ARCA_ENABLED && (
              <div className="bg-gradient-to-b from-[var(--foreground)]/5 to-[var(--foreground)]/2 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
                {hasExistingInvoice ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-green-400" />
                        <span className="text-xs font-bold text-slate-200">
                          Comprobante Fiscal ARCA
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold">
                        {invoice?.voucher_type === 6 ? "Factura B" : "Factura C"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                          Nro. Comprobante
                        </span>
                        <span className="font-mono font-bold text-slate-200">
                          {invoice?.point_of_sale != null && invoice?.voucher_number != null
                            ? `${String(invoice.point_of_sale).padStart(4, "0")}-${String(invoice.voucher_number).padStart(8, "0")}`
                            : `#${initialAppointment.arca_invoice_id}`}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                          Estado fiscal
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          {invoice?.status === "mock" ? "Demo" : "Aprobado"}
                        </span>
                      </div>

                      <div className="col-span-2 bg-[var(--background)]/60 rounded-xl p-3 border border-white/5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                            Código CAE
                          </span>
                          {invoice?.cae && (
                            <button
                              type="button"
                              onClick={() => handleCopyCae(invoice.cae!)}
                              className="text-[10px] font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              {copiedCae ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copiar</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        <p className="font-mono text-sm font-bold text-emerald-400">
                          {invoice?.cae || "—"}
                        </p>
                        {invoice?.cae_due_date && (
                          <span className="text-[10px] text-slate-500 block">
                            Vto: {invoice.cae_due_date}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                          Receptor
                        </span>
                        <span className="font-medium text-slate-200 truncate block">
                          {invoice?.customer_name || client || "Consumidor Final"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                          Documento
                        </span>
                        <span className="font-medium text-slate-200 truncate block">
                          {invoice?.doc_number ? `${invoice.doc_number}` : "Sin doc."}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {invoice?.created_at
                          ? new Date(invoice.created_at).toLocaleDateString("es-AR")
                          : "Comprobante registrado"}
                      </span>
                      <Link
                        href="/admin?tab=facturas"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent)] hover:text-white transition-colors group cursor-pointer"
                      >
                        <span>Ver en Facturación</span>
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                ) : arcaAvailable && paid ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-medium text-slate-200">
                          Emitir comprobante ARCA
                        </span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={emitInvoice}
                        onClick={() => setEmitInvoice((v) => !v)}
                        className={`w-10 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                          emitInvoice ? "bg-[var(--accent)]" : "bg-slate-700"
                        }`}
                      >
                        <div
                          className={`bg-slate-950 w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                            emitInvoice ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {emitInvoice && (
                      <div className="space-y-4 pt-3 border-t border-white/10 animate-in fade-in duration-200">
                        <div>
                          <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                            Tipo de documento
                          </label>
                          <select
                            value={docType}
                            onChange={(e) => setDocType(Number(e.target.value) as ArcaDocType)}
                            className="w-full !bg-[var(--background)] !text-[var(--foreground)] !border !border-[var(--foreground)]/15 focus:!border-[var(--accent)] rounded-xl p-2.5 text-xs outline-none"
                          >
                            {DOC_TYPES.map((dt) => (
                              <option key={dt.value} value={dt.value} style={{ color: "black" }}>
                                {dt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {docType !== 99 && (
                          <div>
                            <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                              Número de documento
                            </label>
                            <input
                              type="text"
                              required
                              value={docNumber}
                              onChange={(e) => setDocNumber(e.target.value)}
                              placeholder="Sin puntos ni guiones"
                              className="w-full !bg-[var(--background)] !text-[var(--foreground)] !border !border-[var(--foreground)]/15 focus:!border-[var(--accent)] rounded-xl p-2.5 text-xs outline-none"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-slate-400">
                    {!paid
                      ? "Marcar como pagado para habilitar la emisión de comprobante fiscal."
                      : "Facturación ARCA actualmente no configurada o no disponible."}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmModal
        isOpen={isConfirmingDelete}
        onClose={() => setIsConfirmingDelete(false)}
        onConfirm={handleDelete}
        title="¿Eliminar este turno?"
        description="Esta acción cancelará y eliminará el turno agendado de la base de datos."
        confirmText="Eliminar"
        cancelText="Cancelar"
        loading={deleting}
      />
    </div>
  );
}
