"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, Mail, Loader2 } from "lucide-react";
import { startOfWeek, endOfWeek } from "date-fns";
import { useAuth } from "@/lib/auth/AuthContext";
import InputPassword from "@/components/input/InputPassword";
import logo from "@/public/images/logo.png";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const { signIn, user, role, isLoadingAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Precargar /turnos en segundo plano al montar la pantalla de login
  useEffect(() => {
    router.prefetch("/turnos");
  }, [router]);

  // Si ya está autenticado, redirigir automáticamente
  useEffect(() => {
    if (!isLoadingAuth && user && role !== "guest") {
      router.replace(redirectParam || "/turnos");
    }
  }, [user, role, isLoadingAuth, redirectParam, router]);

  const isDisabled = !email || !password;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const { error } = await signIn(email.trim(), password);

    if (error) {
      setLoading(false);
      setErrorMessage(error);
      return;
    }

    const targetUrl = redirectParam || "/turnos";

    // Precargar todos los datos requeridos por /turnos antes de redirigir
    if (targetUrl.startsWith("/turnos")) {
      try {
        const now = new Date();
        const start = startOfWeek(now, { weekStartsOn: 1 }).toISOString().split("T")[0];
        const end = endOfWeek(now, { weekStartsOn: 1 }).toISOString().split("T")[0];

        const storedRaw = typeof window !== "undefined" ? sessionStorage.getItem("auth") : null;
        const stored = storedRaw ? JSON.parse(storedRaw) : null;
        const bId = stored?.barberId && stored.barberId > 0 ? stored.barberId : 0;

        await Promise.allSettled([
          router.prefetch(targetUrl),
          fetch("/api/services"),
          fetch("/api/barbers"),
          fetch(`/api/appointments?barber_id=${bId}&start_date=${start}&end_date=${end}`),
        ]);
      } catch (err) {
        console.error("Error precargando datos de turnos:", err);
      }
    }

    router.replace(targetUrl);
    router.refresh();
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-8 md:py-12">
      <div className="w-full max-w-md bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative">
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
            Iniciar sesión
          </h1>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5"
            >
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="login-email"
                data-testid="login-email"
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

          <div>
            <InputPassword
              id="login-password"
              data-testid="login-password"
              label="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******"
              requiered
            />
          </div>

          <div className="flex justify-end pt-1">
            <Link
              href="/olvide-contrasena"
              id="btn-forgot-password"
              className="text-xs font-semibold text-[var(--accent)]/80 hover:text-[var(--accent)] hover:underline transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <div className="pt-3">
            <div data-testid="login-submit-wrapper" className="w-full">
              <button
                id="btn-login-submit"
                type="submit"
                disabled={isDisabled || loading}
                className="w-full h-11 min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl !bg-[var(--accent)] hover:!bg-[#E8CA8C] !text-slate-950 font-bold text-sm shadow-md shadow-[var(--accent)]/15 border border-[var(--accent)]/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-inherit" />
                ) : (
                  <span>Iniciar sesión</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
