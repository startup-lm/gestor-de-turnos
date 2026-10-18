"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Mail,
  Camera,
  KeyRound,
  Instagram,
  ArrowLeft,
  Calendar,
  Save,
  RotateCcw,
  Percent,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Briefcase,
} from "lucide-react";
import { Barber } from "@/lib/types/Barbers";
import { updateBarber } from "@/lib/repository/barbers";
import { updatePassword } from "@/lib/repository/auth";
import { uploadImage } from "@/lib/repository/storage";
import { toast } from "@/lib/store/useToastStore";
import InputPassword from "@/components/input/InputPassword";
import logo from "@/public/images/logo.png";

export default function BarberClient({ barber }: { barber: Barber }) {
  const router = useRouter();

  const [name, setName] = useState(barber.name);
  const [email, setEmail] = useState(barber.email);
  const [instagram, setInstagram] = useState<string>(barber.instagram ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const norm = (value: string | null | undefined) => (value ?? "").trim();

  const hasChanges = useMemo(() => {
    const changedPassword = password.length >= 6 && password === confirmPassword;
    return (
      name !== barber.name ||
      email !== barber.email ||
      norm(instagram) !== norm(barber.instagram) ||
      imageFile !== null ||
      changedPassword
    );
  }, [name, email, instagram, imageFile, barber, password, confirmPassword]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleReset = () => {
    setName(barber.name);
    setEmail(barber.email);
    setInstagram(barber.instagram ?? "");
    setImageFile(null);
    setImagePreview(null);
    setPassword("");
    setConfirmPassword("");
    toast.info("Cambios descartados");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;

    const wantsToChangePassword = password.length > 0 || confirmPassword.length > 0;
    if (wantsToChangePassword) {
      if (password.length < 6) {
        toast.error("La contraseña debe tener al menos 6 caracteres");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Las contraseñas no coinciden");
        return;
      }
    }

    setLoading(true);
    let imageUrl = barber.image || "";

    if (imageFile) {
      try {
        imageUrl = await uploadImage("barbers", imageFile);
      } catch (err) {
        console.error(err);
        toast.error("Error al subir la imagen. Verificá que no sea demasiado pesada.");
        setLoading(false);
        return;
      }
    }

    try {
      const barberUpdated = await updateBarber(barber.id!, {
        name,
        email,
        instagram: norm(instagram),
        image: imageUrl,
      });

      let passwordUpdated = true;
      if (wantsToChangePassword) {
        passwordUpdated = await updatePassword(confirmPassword);
      }

      if (barberUpdated && passwordUpdated) {
        toast.success("Perfil actualizado con éxito");
        setPassword("");
        setConfirmPassword("");
        setImageFile(null);
        router.refresh();
      } else {
        toast.error("Ocurrió un error al actualizar los datos");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error inesperado al guardar los cambios");
    } finally {
      setLoading(false);
    }
  };

  const currentImageUrl = imagePreview || barber.image || logo;
  const cleanInstagram = norm(instagram).replace(/^@/, "");

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 md:px-8 py-8 md:py-12">
      {/* Top Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
              Mi Perfil
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/20 capitalize flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              {barber.role === "admin" ? "Administrador" : "Barbero del Local"}
            </span>
            {barber.active !== false ? (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Activo
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Inactivo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (Avatar, Identity & Stats) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Identity Showcase Card */}
          <div className="p-8 rounded-3xl border border-[var(--foreground)]/10 bg-gradient-to-b from-[var(--foreground)]/6 to-[var(--foreground)]/2 backdrop-blur-xl shadow-xl flex flex-col items-center text-center relative overflow-hidden">
            <div className="relative group mb-5">
              <label className="cursor-pointer block relative">
                <div className="w-36 h-36 rounded-full p-[3px] bg-gradient-to-tr from-[var(--accent)] to-[#fcebb6] shadow-xl shadow-[var(--accent)]/10 transition-transform duration-300 group-hover:scale-105">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 relative">
                    <Image
                      src={currentImageUrl}
                      alt={name}
                      fill
                      unoptimized
                      className="object-cover transition-opacity duration-300 group-hover:opacity-75"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white">
                      <Camera className="w-6 h-6 mb-1 text-[var(--accent)]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Cambiar</span>
                    </div>
                  </div>
                </div>

                {/* Floating camera button */}
                <div className="absolute bottom-1 right-1 p-2.5 bg-[var(--accent)] text-black rounded-full hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg border-2 border-[var(--background)]">
                  <Camera className="w-4 h-4" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <h2 className="text-2xl font-extrabold text-[var(--foreground)] tracking-tight">
              {name || "Barbero"}
            </h2>
            <p className="text-xs text-[var(--foreground)]/60 mt-1 mb-4 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[var(--accent)]" />
              {email}
            </p>

            {cleanInstagram && (
              <a
                href={`https://instagram.com/${cleanInstagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20 hover:bg-pink-500/20 transition-colors"
              >
                <Instagram className="w-3.5 h-3.5" />
                @{cleanInstagram}
              </a>
            )}
          </div>

          {/* Commissions & Info Card */}
          <div className="p-6 rounded-3xl border border-[var(--foreground)]/10 bg-gradient-to-b from-[var(--foreground)]/6 to-[var(--foreground)]/2 backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--foreground)]/10 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              <Percent className="w-4 h-4" />
              <span>Condiciones & Rendimiento</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-4 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/5">
                <span className="text-[11px] text-[var(--foreground)]/60 block mb-1">
                  Por turnos / servicios
                </span>
                <span className="text-2xl font-extrabold text-[var(--accent)]">
                  {barber.commission !== undefined
                    ? `${(barber.commission * 100).toFixed(0)}%`
                    : "50%"}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/5">
                <span className="text-[11px] text-[var(--foreground)]/60 block mb-1">
                  Por venta de productos
                </span>
                <span className="text-2xl font-extrabold text-emerald-400">
                  {barber.sale_commission !== undefined
                    ? `${(barber.sale_commission * 100).toFixed(0)}%`
                    : "20%"}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
              <span>Las comisiones son liquidadas automáticamente al registrar ventas o completar turnos.</span>
            </div>
          </div>
        </div>

        {/* Right Column (Edit Form & Password) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Personal Data Section */}
            <div className="p-6 md:p-8 rounded-3xl border border-[var(--foreground)]/10 bg-gradient-to-b from-[var(--foreground)]/6 to-[var(--foreground)]/2 backdrop-blur-xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-[var(--foreground)]/10">
                <User className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Información personal
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nombre */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[var(--foreground)]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Ej. Juan Pérez"
                      className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl py-3.5 pr-4 pl-11 w-full block text-sm"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[var(--foreground)]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="barbero@barberia.com"
                      className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl py-3.5 pr-4 pl-11 w-full block text-sm"
                    />
                  </div>
                </div>

                {/* Instagram */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2">
                    Instagram
                  </label>
                  <div className="relative">
                    <Instagram className="w-4 h-4 text-[var(--foreground)]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@tu_usuario_de_instagram"
                      className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl py-3.5 pr-4 pl-11 w-full block text-sm"
                    />
                  </div>
                  <p className="text-[11px] text-[var(--foreground)]/40 mt-1.5">
                    Se mostrará en la sección &quot;Nosotros&quot; y en la ficha del equipo para que los clientes te conozcan.
                  </p>
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="p-6 md:p-8 rounded-3xl border border-[var(--foreground)]/10 bg-gradient-to-b from-[var(--foreground)]/6 to-[var(--foreground)]/2 backdrop-blur-xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-[var(--foreground)]/10">
                <KeyRound className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Modificar contraseña
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <InputPassword
                    label="Nueva contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    error={
                      password && password.length < 6
                        ? "La contraseña debe tener al menos 6 caracteres."
                        : undefined
                    }
                  />
                </div>

                <div>
                  <InputPassword
                    label="Confirmar nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repetí la nueva contraseña"
                    error={
                      confirmPassword && confirmPassword !== password
                        ? "Las contraseñas no coinciden."
                        : undefined
                    }
                  />
                </div>
              </div>

              <p className="text-[11px] text-[var(--foreground)]/40">
                Dejá los campos de contraseña vacíos si querés mantener tu clave actual sin cambios.
              </p>
            </div>

            {/* Action Bar */}
            <div className="p-4 md:p-6 rounded-2xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleReset}
                disabled={!hasChanges || loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--foreground)]/10 text-sm font-semibold text-[var(--foreground)]/70 hover:bg-[var(--foreground)]/5 disabled:opacity-30 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Descartar cambios
              </button>

              <button
                type="submit"
                disabled={!hasChanges || loading}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[var(--accent)] text-black font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-all shadow-lg shadow-[var(--accent)]/15 cursor-pointer ml-auto"
              >
                <Save className="w-4 h-4" />
                {loading ? "Guardando cambios..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
