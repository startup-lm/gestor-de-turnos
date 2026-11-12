"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { sendCancelAppointment } from "@/utils/whatsapp";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { toast } from "@/lib/store/useToastStore";
import {
  Hash,
  Phone,
  Calendar,
  Clock,
  User,
  Scissors,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Trash2,
  Loader2,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

type Step = "search" | "confirm" | "success";

interface AppointmentSummary {
  id: number;
  client: string;
  phone: string;
  phoneFormatted: string;
  date: string;
  start_time: string;
  end_time: string;
  barbers?: { name: string } | null;
  services?: { name: string } | null;
}

export default function CancelarTurnoPage() {
  const [step, setStep] = useState<Step>("search");
  const [appointmentId, setAppointmentId] = useState("");
  const [phone, setPhone] = useState("");
  const [appointment, setAppointment] = useState<AppointmentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const { businessSettings } = useBusinessContext();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericId = Number(appointmentId.trim());
    if (!numericId || !phone.trim()) {
      toast.error("Por favor completá el número de turno y teléfono");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/turnos/cancelar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "search",
          id: numericId,
          phone: phone.trim(),
        }),
      });

      const json = await res.json();
      setLoading(false);

      if (!res.ok || !json.success) {
        toast.error(json.error || "No se pudo encontrar el turno");
        return;
      }

      setAppointment(json.appointment);
      setStep("confirm");
    } catch (err) {
      console.error("Error buscando turno:", err);
      toast.error("Error al buscar el turno. Intenta nuevamente.");
      setLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!appointment) return;
    setLoading(true);
    try {
      const res = await fetch("/api/turnos/cancelar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          id: appointment.id,
          phone: phone.trim(),
        }),
      });

      const json = await res.json();
      setLoading(false);

      if (!res.ok || !json.success) {
        toast.error(json.error || "No se pudo cancelar el turno. Comunícate con el local.");
        return;
      }

      setStep("success");
    } catch (err) {
      console.error("Error cancelando turno:", err);
      toast.error("Error inesperado al cancelar el turno");
      setLoading(false);
    }
  };

  const handleWhatsappNotify = () => {
    if (!appointment) return;
    sendCancelAppointment(
      appointment.date,
      appointment.start_time,
      appointment.client,
      businessSettings?.phone
    );
  };

  const handleReset = () => {
    setAppointmentId("");
    setPhone("");
    setAppointment(null);
    setStep("search");
  };

  return (
    <div className="min-h-screen py-8 md:py-12 px-4 md:px-8 w-full max-w-[1720px] mx-auto flex flex-col items-center text-center">
      {/* Cabecera Principal */}
      <div className="mb-8 md:mb-10 w-full max-w-2xl text-center mx-auto flex flex-col items-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--foreground)]">
          Cancelar turno
        </h1>
        <p className="text-sm md:text-base text-slate-400 mt-2 px-2">
          Ingresá los datos de tu reserva para buscar y gestionar la cancelación
        </p>
      </div>

      {/* Tarjeta Principal Glassmorphic con Ancho Optimizado */}
      <div className="bg-[var(--foreground)]/5 backdrop-blur-xl border border-[var(--foreground)]/10 p-6 sm:p-10 rounded-3xl shadow-2xl w-full max-w-lg md:max-w-xl transition-all duration-300 flex flex-col">
        {/* PASO 1: Formulario de Búsqueda */}
        {step === "search" && (
          <div className="w-full animate-in fade-in duration-300">
            {/* Botón Volver al inicio arriba a la izquierda */}
            <div className="flex justify-start mb-6">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-[var(--accent)] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al inicio</span>
              </Link>
            </div>

            <form onSubmit={handleSearch} className="space-y-6 text-left">
              <div>
                <label
                  htmlFor="cancel-appointment-id"
                  className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2 ml-1"
                >
                  Número de Turno
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400 pointer-events-none z-10 flex items-center justify-center">
                    <Hash size={18} />
                  </span>
                  <input
                    id="cancel-appointment-id"
                    type="text"
                    inputMode="numeric"
                    value={appointmentId}
                    placeholder="Ej. 123"
                    className="w-full !bg-[var(--foreground)]/5 !text-[var(--foreground)] !border !border-[var(--foreground)]/10 rounded-2xl py-3.5 !pl-12 pr-4 text-sm focus:outline-none focus:!border-[var(--accent)] transition-all h-[50px] shadow-inner font-semibold"
                    onChange={(e) => setAppointmentId(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="cancel-phone"
                  className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2 ml-1"
                >
                  Número de Celular
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400 pointer-events-none z-10 flex items-center justify-center">
                    <Phone size={18} />
                  </span>
                  <input
                    id="cancel-phone"
                    type="tel"
                    value={phone}
                    placeholder="Ej. 11 2345 6789"
                    className="w-full !bg-[var(--foreground)]/5 !text-[var(--foreground)] !border !border-[var(--foreground)]/10 rounded-2xl py-3.5 !pl-12 pr-4 text-sm focus:outline-none focus:!border-[var(--accent)] transition-all h-[50px] shadow-inner font-semibold"
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 ml-1">
                  Ingresá los 10 dígitos (código de área + celular, ej: 11 2345 6789)
                </p>
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  type="submit"
                  disabled={!appointmentId || !phone || loading}
                  className="w-full sm:w-auto min-w-[200px] max-w-xs h-11 flex items-center justify-center gap-2 px-8 rounded-xl !bg-[var(--accent)] hover:!bg-[var(--accent-hover)] !text-slate-950 font-black text-sm shadow-lg shadow-[var(--accent)]/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                  ) : (
                    <span>Buscar mi turno</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PASO 2: Confirmación del Turno Encontrado */}
        {step === "confirm" && appointment && (
          <div className="w-full text-left animate-in fade-in duration-300">
            {/* Botón Volver arriba a la izquierda */}
            <div className="flex justify-start mb-4">
              <button
                type="button"
                onClick={() => setStep("search")}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-[var(--accent)] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a la búsqueda</span>
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-xs text-amber-300 font-medium leading-relaxed">
                  Revisá los datos antes de confirmar. Esta acción cancelará tu reserva y liberará el horario.
                </p>
              </div>

              {/* Resumen del Turno con Datos Reales */}
              <div className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-2xl p-5 space-y-3.5">
                <div className="flex justify-between items-center border-b border-[var(--foreground)]/10 pb-3">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                    <User className="w-4 h-4 text-[var(--accent)]" />
                    Cliente
                  </span>
                  <span className="font-bold text-sm text-[var(--foreground)]">
                    {appointment.client}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-[var(--foreground)]/10 pb-3">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[var(--accent)]" />
                    Fecha
                  </span>
                  <span className="font-bold text-sm text-[var(--foreground)] capitalize">
                    {format(new Date(`${appointment.date}T00:00:00-03:00`), "EEEE d 'de' MMMM", {
                      locale: es,
                    })}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-[var(--foreground)]/10 pb-3">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[var(--accent)]" />
                    Horario
                  </span>
                  <span className="font-bold text-sm text-[var(--foreground)]">
                    {appointment.start_time} hs
                  </span>
                </div>

                {appointment.barbers?.name && (
                  <div className="flex justify-between items-center border-b border-[var(--foreground)]/10 pb-3">
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-[var(--accent)]" />
                      Barbero
                    </span>
                    <span className="font-bold text-sm text-[var(--foreground)]">
                      {appointment.barbers.name}
                    </span>
                  </div>
                )}

                {appointment.services?.name && (
                  <div className="flex justify-between items-center border-b border-[var(--foreground)]/10 pb-3">
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-[var(--accent)]" />
                      Servicio
                    </span>
                    <span className="font-bold text-sm text-[var(--foreground)]">
                      {appointment.services.name}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[var(--accent)]" />
                    Celular
                  </span>
                  <span className="font-bold text-sm text-[var(--foreground)] font-mono">
                    {appointment.phoneFormatted || appointment.phone}
                  </span>
                </div>
              </div>

              {/* Botón de Confirmación Principal con Tamaño Equilibrado */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  id="btn-confirm-cancel-appt"
                  onClick={handleConfirmCancel}
                  disabled={loading}
                  className="w-full sm:w-auto min-w-[240px] max-w-sm h-11 flex items-center justify-center gap-2 px-8 rounded-xl !bg-red-500 hover:!bg-red-600 !text-white font-black text-sm shadow-lg shadow-red-500/20 transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirmar cancelación</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: Éxito & Notificación WhatsApp */}
        {step === "success" && (
          <div className="space-y-6 text-center animate-in fade-in duration-300 py-4">
            <div className="w-16 h-16 bg-red-500/10 border-2 border-red-500/30 text-red-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-[var(--foreground)]">
                Turno cancelado con éxito
              </h2>
              <p className="text-xs md:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                Tu reserva ha sido eliminada de la agenda. Si lo deseás, podés notificar a la barbería por WhatsApp.
              </p>
            </div>

            {/* Botón WhatsApp con Tamaño Equilibrado */}
            <div className="pt-2 space-y-3 flex flex-col items-center">
              <button
                type="button"
                onClick={handleWhatsappNotify}
                className="w-full sm:w-auto min-w-[260px] max-w-sm h-11 flex items-center justify-center gap-2.5 px-6 rounded-xl !bg-[var(--button-whatsapp)] hover:!bg-[var(--whatsapp-hover-alt)] !text-white font-extrabold text-sm shadow-lg shadow-green-500/20 transition-all active:scale-[0.98] cursor-pointer"
              >
                <FaWhatsapp className="w-5 h-5" />
                <span>Confirmar cancelación por WhatsApp</span>
              </button>

              <div className="flex gap-2 pt-2 w-full max-w-xs justify-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 h-9 min-h-[36px] inline-flex items-center justify-center px-3 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-slate-300 font-medium transition-all cursor-pointer"
                >
                  Cancelar otro turno
                </button>
                <Link
                  href="/"
                  className="flex-1 h-9 min-h-[36px] inline-flex items-center justify-center px-3 rounded-xl !bg-[var(--accent)] hover:!bg-[var(--accent-hover)] !text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  Ir al inicio
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
