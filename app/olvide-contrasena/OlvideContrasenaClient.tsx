"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, AlertCircle, CheckCircle, Mail, Loader2 } from "lucide-react";
import { resetPassword } from "@/lib/repository/auth";
import logo from "@/public/images/logo.png";

export default function OlvideContrasenaClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const isDisabled = !email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    // No se revela si el correo está registrado: evita la enumeración de cuentas del staff
    const error = await resetPassword(email);
    setLoading(false);

    if (error) {
      setMessage({
        text: "Hubo un error al enviar el correo. Por favor intentá nuevamente.",
        success: false,
      });
    } else {
      setMessage({
        text: "Si el correo pertenece a un miembro del equipo, te enviamos las instrucciones para restablecer tu contraseña.",
        success: true,
      });
      setEmail("");
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-8 md:py-12">
      <div className="w-full max-w-md bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--foreground)]/60 hover:text-[var(--accent)] transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a iniciar sesión</span>
        </Link>

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative p-1 rounded-full border-2 border-[var(--accent)]/20 bg-gradient-to-b from-[var(--accent)]/10 to-transparent shadow-lg shadow-[var(--accent)]/5 mb-3">
            <Image
              src={logo}
              alt="Barber Shop"
              width={90}
              height={90}
              className="rounded-full mx-auto"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight text-center">
            Recuperar Contraseña
          </h1>
          <p className="text-xs text-[var(--foreground)]/60 text-center mt-2">
            Ingresá tu email registrado para recibir las instrucciones de restablecimiento.
          </p>
        </div>

        {/* Alert Message */}
        {message && (
          <div
            className={`mb-5 p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
              message.success
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {message.success ? (
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="recovery-email"
              className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5"
            >
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="recovery-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tumail@gmail.com"
                autoComplete="email"
                className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 !transition-all !rounded-xl !pl-11 !pr-4 !py-3 !w-full !block !text-sm placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              id="btn-recovery-submit"
              type="submit"
              disabled={isDisabled || loading}
              className="w-full h-11 min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl !bg-[var(--accent)] hover:!bg-[#E8CA8C] !text-slate-950 font-bold text-sm shadow-md shadow-[var(--accent)]/15 border border-[var(--accent)]/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-inherit" />
              ) : (
                <span>Enviar enlace de recuperación</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
