"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/public/images/logo.png";
import { Barber } from "@/lib/types/Barbers";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  getBarberByEmail,
  addBarber,
  updateBarber,
} from "@/lib/repository/barbers";
import { signUp, isBarberAuthenticated, deleteAuthUser } from "@/lib/repository/auth";
import { uploadImage } from "@/lib/repository/storage";
import { toast } from "@/lib/store/useToastStore";
import InputPassword from "@/components/input/InputPassword";
import DeleteCardButton from "@/components/card/DeleteCardButton";
import EditCardButton from "@/components/card/EditCardButton";
import CardDeleteOverlay from "@/components/card/CardDeleteOverlay";
import {
  ArrowLeft,
  Plus,
  Scissors,
  Save,
  User,
  Mail,
  Instagram,
  Upload,
  Percent,
  ShoppingBag,
  ShieldCheck,
  X,
  Loader2,
} from "lucide-react";

interface Props {
  barbers: Barber[];
}

type ViewMode = "list" | "create" | "edit";

const CUT_COMMISSION_PRESETS = [30, 40, 50, 60, 70];
const SALE_COMMISSION_PRESETS = [0, 5, 10, 15, 20];

export default function AdminBarberosClient({ barbers }: Readonly<Props>) {
  const router = useRouter();
  const { role, user } = useAuth();

  // Navigation mode: "list", "create", or "edit"
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [password, setPassword] = useState("");
  const [commission, setCommission] = useState("50");
  const [saleCommission, setSaleCommission] = useState("10");
  const [active, setActive] = useState(true);

  // Profile image upload & preview states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string>("");

  // Loading & confirmation states
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const hasChanges = useMemo(() => {
    if (viewMode === "create") {
      return Boolean(name.trim() && email.trim() && instagram.trim() && password && password.length >= 6);
    }
    if (viewMode === "edit" && selectedBarber) {
      const origName = selectedBarber.name || "";
      const origInsta = selectedBarber.instagram || "";
      const origCut = ((selectedBarber.commission ?? 0) * 100).toFixed(0);
      const origSale = ((selectedBarber.sale_commission ?? 0) * 100).toFixed(0);
      const origActive = selectedBarber.active ?? true;

      const normInsta = (str: string) => str.trim().replace(/^@+/, "");

      const isChanged =
        name.trim() !== origName.trim() ||
        normInsta(instagram) !== normInsta(origInsta) ||
        commission !== origCut ||
        saleCommission !== origSale ||
        active !== origActive ||
        imageFile !== null ||
        existingImage !== (selectedBarber.image && selectedBarber.image !== "null" ? selectedBarber.image : "");

      return isChanged && Boolean(name.trim() && instagram.trim());
    }
    return false;
  }, [viewMode, selectedBarber, name, email, instagram, password, commission, saleCommission, active, imageFile, existingImage]);

  useEffect(() => {
    if (role === "guest" && user) return;
    if (role && role !== "admin") {
      router.replace("/operaciones");
    }
  }, [role, user, router]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setInstagram("");
    setPassword("");
    setCommission("50");
    setSaleCommission("10");
    setActive(true);
    setImageFile(null);
    setImagePreview(null);
    setExistingImage("");
    setSelectedBarber(null);
  };

  const startCreate = () => {
    resetForm();
    setViewMode("create");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEdit = (barber: Barber) => {
    setSelectedBarber(barber);
    setName(barber.name || "");
    setEmail(barber.email || "");
    setInstagram(barber.instagram || "");
    setPassword("");
    setCommission(((barber.commission ?? 0) * 100).toFixed(0));
    setSaleCommission(((barber.sale_commission ?? 0) * 100).toFixed(0));
    setActive(barber.active ?? true);
    setExistingImage(
      barber.image && barber.image !== "null" && barber.image !== "" ? barber.image : ""
    );
    setImageFile(null);
    setImagePreview(null);
    setViewMode("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (viewMode === "edit") {
      setExistingImage("");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanInstagram = instagram.trim().replace(/^@+/, "");

    if (!cleanName || !cleanEmail || !cleanInstagram || !password || password.length < 6) {
      toast.error("Completá todos los campos requeridos y una contraseña de al menos 6 caracteres.");
      return;
    }

    setSubmitting(true);
    try {
      const existingBarber = await getBarberByEmail(cleanEmail);
      const inAuth = await isBarberAuthenticated(cleanEmail);

      if (existingBarber && inAuth) {
        toast.error("El email ya se encuentra registrado.");
        setSubmitting(false);
        return;
      }

      if (!inAuth) {
        const { data, error } = await signUp(cleanEmail, password);
        if (error || !data?.user) {
          toast.error("Error al registrar la cuenta de usuario.");
          setSubmitting(false);
          return;
        }
      }

      let imageUrl = "";
      if (imageFile) {
        try {
          imageUrl = await uploadImage("barbers", imageFile);
        } catch (imgErr) {
          console.error("Error subiendo imagen:", imgErr);
          toast.info("No se pudo cargar la imagen, el barbero se creará sin avatar.");
        }
      }

      const commissionFraction = commission ? parseFloat(commission) / 100 : 0;
      const saleCommissionFraction = saleCommission ? parseFloat(saleCommission) / 100 : 0;

      let success = false;
      if (!existingBarber) {
        const created = await addBarber({
          name: cleanName,
          email: cleanEmail,
          instagram: `@${cleanInstagram}`,
          image: imageUrl,
          role: "barber",
          commission: commissionFraction,
          sale_commission: saleCommissionFraction,
          active,
        });
        success = !!created;
      } else {
        success = await updateBarber(existingBarber.id!, {
          name: cleanName,
          email: cleanEmail,
          instagram: `@${cleanInstagram}`,
          image: imageUrl || existingBarber.image,
          commission: commissionFraction,
          sale_commission: saleCommissionFraction,
          active,
        });
      }

      if (success) {
        toast.success("Barbero registrado con éxito.");
        resetForm();
        setViewMode("list");
        router.refresh();
      } else {
        toast.error("Error al registrar el barbero.");
      }
    } catch (err) {
      console.error("Error creando barbero:", err);
      toast.error("Ocurrió un error inesperado al registrar el barbero.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarber?.id) return;

    const cleanName = name.trim();
    const cleanInstagram = instagram.trim().replace(/^@+/, "");

    if (!cleanName || !cleanInstagram) {
      toast.error("El nombre y el instagram son obligatorios.");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = existingImage;
      if (imageFile) {
        try {
          imageUrl = await uploadImage("barbers", imageFile);
        } catch (imgErr) {
          console.error("Error actualizando imagen:", imgErr);
          toast.info("No se pudo actualizar la imagen.");
        }
      }

      const commissionFraction = commission ? parseFloat(commission) / 100 : 0;
      const saleCommissionFraction = saleCommission ? parseFloat(saleCommission) / 100 : 0;

      const updated = await updateBarber(selectedBarber.id, {
        name: cleanName,
        instagram: `@${cleanInstagram}`,
        image: imageUrl,
        commission: commissionFraction,
        sale_commission: saleCommissionFraction,
        active,
      });

      if (updated) {
        // Si el barbero estaba activo y ahora se desactiva, opcionalmente eliminar sesión
        if (selectedBarber.active && !active && selectedBarber.email) {
          try {
            await deleteAuthUser(selectedBarber.email);
          } catch (authErr) {
            console.error("Error revocando autenticación:", authErr);
          }
        }

        toast.success("Barbero actualizado con éxito.");
        resetForm();
        setViewMode("list");
        router.refresh();
      } else {
        toast.error("Error al actualizar los datos del barbero.");
      }
    } catch (err) {
      console.error("Error editando barbero:", err);
      toast.error("Ocurrió un error inesperado al guardar los cambios.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deletingId === null) return;
    setDeletingLoading(true);
    try {
      const success = await updateBarber(deletingId, { active: false });
      if (success) {
        toast.success("Barbero deshabilitado con éxito.");
        router.refresh();
      } else {
        toast.error("Error al deshabilitar el barbero.");
      }
    } catch (err) {
      console.error("Error deshabilitando barbero:", err);
      toast.error("Error al deshabilitar el barbero.");
    } finally {
      setDeletingLoading(false);
      setDeletingId(null);
    }
  };

  // Avatar source resolution
  const displayedAvatar = imagePreview || (existingImage ? existingImage : null);

  // -------------------------------------------------------------
  // VISTA 1 & 2: FORMULARIO EN PANTALLA (CREAR O EDITAR)
  // -------------------------------------------------------------
  if (viewMode === "create" || viewMode === "edit") {
    const isCreate = viewMode === "create";

    return (
      <div className="w-full space-y-6 animate-fadeIn">
        {/* Cabecera con botón Volver y Botón de Guardado en la cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
          <div className="space-y-1.5">
            <button
              id="btn-close-modal"
              type="button"
              onClick={() => {
                resetForm();
                setViewMode("list");
              }}
              className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[var(--accent)] hover:text-white transition-colors cursor-pointer group mb-1"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Volver al listado de barberos</span>
            </button>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              {isCreate ? "Agregar barbero" : "Editar barbero"}
            </h2>
            <p className="text-xs text-slate-400">
              {isCreate
                ? "Registrá un nuevo miembro del equipo, sus credenciales y esquema de comisiones."
                : "Modificá la información de perfil, esquema de comisiones y estado activo."}
            </p>
          </div>

          <button
            id="btn-signup-submit"
            type="submit"
            form="barber-form"
            disabled={!hasChanges || submitting}
            className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all shadow-md active:scale-95 ${
              hasChanges && !submitting
                ? "!bg-[var(--accent)] hover:!bg-[#E8CA8C] !text-slate-950 shadow-[var(--accent)]/20 cursor-pointer"
                : "!bg-white/5 !text-slate-500 border border-white/10 cursor-not-allowed opacity-50"
            }`}
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isCreate ? (
              <>
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Registrar barbero</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar cambios</span>
              </>
            )}
          </button>
        </div>

        {/* Formulario en Pantalla */}
        <form id="barber-form" onSubmit={isCreate ? handleCreateSubmit : handleEditSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Columna Izquierda: Identidad y Foto de Perfil */}
            <div className="lg:col-span-5 bg-gradient-to-b from-[var(--foreground)]/5 to-[var(--foreground)]/2 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-[var(--accent)] text-sm font-bold tracking-wider border-b border-white/10 pb-3">
                  <User className="w-4 h-4" />
                  <span>Foto e identidad</span>
                </div>

                {/* Previsualización y carga de imagen */}
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative w-36 h-36 rounded-full overflow-hidden border-2 border-[var(--accent)]/40 shadow-xl bg-slate-950 flex items-center justify-center group">
                    <Image
                      alt="Avatar preview"
                      src={displayedAvatar || logo}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="144px"
                    />
                    {displayedAvatar && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        title="Quitar foto"
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-red-400 font-semibold text-xs gap-1 cursor-pointer"
                      >
                        <X className="w-6 h-6" />
                        <span>Quitar foto</span>
                      </button>
                    )}
                  </div>

                  <div className="w-full">
                    <label className="flex flex-col items-center justify-center w-full py-3 px-4 border border-dashed border-[var(--accent)]/40 hover:border-[var(--accent)] rounded-xl cursor-pointer bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 transition-all group">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)] group-hover:scale-105 transition-transform">
                        <Upload className="w-4 h-4" />
                        <span>{imageFile ? imageFile.name : "Subir nueva foto"}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        PNG, JPG o WEBP (máx. 2MB)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Campos de Nombre e Instagram */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--accent)] tracking-wider mb-1.5">
                      Nombre completo <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="barber-name-input"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Santiago Silva"
                        className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl !pl-11 pr-3.5 py-2.5 w-full block text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--accent)] tracking-wider mb-1.5">
                      Instagram <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Instagram className="w-4 h-4" />
                      </div>
                      <input
                        id="barber-instagram-input"
                        required
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="@santi.barber"
                        className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl !pl-11 pr-3.5 py-2.5 w-full block text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Acceso y Esquema Comercial */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Bloque 1: Credenciales de Acceso */}
              <div className="bg-gradient-to-b from-[var(--foreground)]/5 to-[var(--foreground)]/2 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
                <div className="flex items-center gap-2 text-[var(--accent)] text-sm font-bold tracking-wider border-b border-white/10 pb-3">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Credenciales de acceso</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--accent)] tracking-wider mb-1.5">
                    Email de acceso <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="barber-email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!isCreate}
                      placeholder="barbero@barberia.com"
                      className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl !pl-11 pr-3.5 py-2.5 w-full block text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                  {!isCreate && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      El email es el identificador principal de login del profesional.
                    </p>
                  )}
                </div>

                {isCreate && (
                  <div>
                    <InputPassword
                      id="signup-password"
                      label="Contraseña inicial"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      error={
                        password && password.length < 6
                          ? "La contraseña debe tener al menos 6 caracteres."
                          : undefined
                      }
                      requiered
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      El barbero utilizará esta contraseña para iniciar sesión en la plataforma.
                    </p>
                  </div>
                )}
              </div>

              {/* Bloque 2: Comisiones y Liquidación */}
              <div className="bg-gradient-to-b from-[var(--foreground)]/5 to-[var(--foreground)]/2 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-6">
                <div className="flex items-center gap-2 text-[var(--accent)] text-sm font-bold tracking-wider border-b border-white/10 pb-3">
                  <Percent className="w-4 h-4" />
                  <span>Comisiones y liquidación</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Ganancia por corte */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-[var(--accent)] tracking-wider">
                      Comisión por cortes
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Scissors className="w-4 h-4" />
                      </div>
                      <input
                        id="barber-commission-input"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={commission}
                        onChange={(e) => setCommission(e.target.value)}
                        placeholder="50"
                        className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl !pl-11 pr-10 py-2.5 w-full block text-sm font-semibold"
                      />
                      <span className="font-bold absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--accent)] text-sm">
                        %
                      </span>
                    </div>

                    {/* Presets rápidos */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {CUT_COMMISSION_PRESETS.map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCommission(val.toString())}
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border transition-all ${
                            commission === val.toString()
                              ? "bg-[var(--accent)] text-slate-950 border-[var(--accent)]"
                              : "bg-white/5 text-slate-400 border-white/10 hover:border-white/30 hover:text-white"
                          }`}
                        >
                          {val}%
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Porcentaje sobre cada servicio finalizado.
                    </p>
                  </div>

                  {/* Ganancia por venta */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-[var(--accent)] tracking-wider">
                      Comisión por ventas
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <input
                        id="barber-sale-commission-input"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={saleCommission}
                        onChange={(e) => setSaleCommission(e.target.value)}
                        placeholder="10"
                        className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl !pl-11 pr-10 py-2.5 w-full block text-sm font-semibold"
                      />
                      <span className="font-bold absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--accent)] text-sm">
                        %
                      </span>
                    </div>

                    {/* Presets rápidos */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {SALE_COMMISSION_PRESETS.map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setSaleCommission(val.toString())}
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border transition-all ${
                            saleCommission === val.toString()
                              ? "bg-[var(--accent)] text-slate-950 border-[var(--accent)]"
                              : "bg-white/5 text-slate-400 border-white/10 hover:border-white/30 hover:text-white"
                          }`}
                        >
                          {val}%
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Porcentaje sobre productos vendidos en local.
                    </p>
                  </div>
                </div>

                {/* Estado Activo / Inactivo */}
                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Estado operativo del barbero
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {active
                          ? "El barbero está activo y disponible para agendar citas."
                          : "El barbero está desactivado y oculto en la agenda pública."}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActive(!active)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        active ? "bg-emerald-500" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          active ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VISTA 0: LISTADO DE CARDS DE BARBEROS
  // -------------------------------------------------------------
  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* Cabecera de la Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/40 pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            Gestión de barberos
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Alta, edición de comisiones y estado activo del personal
          </p>
        </div>

        <button
          onClick={startCreate}
          data-testid="btn-add-barber"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl !bg-[var(--accent)] hover:!bg-[#E8CA8C] !text-slate-950 font-bold text-sm shadow-md shadow-[var(--accent)]/15 transition-all hover:scale-105 active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nuevo barbero</span>
        </button>
      </div>

      {/* Grilla de Barberos */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 justify-items-center sm:justify-items-start">
        {/* Listado de Barberos */}
        {barbers.map((barber) => (
          <div
            key={barber.id}
            className="relative w-[320px] h-[326px] border border-[var(--foreground)]/10 rounded-2xl p-4 flex flex-col items-center text-center bg-gradient-to-b from-[var(--foreground)]/8 to-[var(--foreground)]/4 backdrop-blur-md max-w-xs shadow-lg hover:border-[var(--accent)]/40 hover:shadow-xl hover:shadow-[var(--accent)]/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            {/* Inline Delete Confirmation Overlay */}
            {deletingId === barber.id && (
              <CardDeleteOverlay
                title="¿Deshabilitar barbero?"
                description="No podrá recibir nuevos turnos en la agenda."
                confirmText="Deshabilitar"
                cancelText="Cancelar"
                loading={deletingLoading}
                onCancel={() => setDeletingId(null)}
                onConfirm={handleDelete}
              />
            )}

            {/* Botón de deshabilitar / eliminar */}
            {deletingId !== barber.id && (
              <div className="absolute top-3 left-3 z-10">
                <DeleteCardButton
                  onDelete={() => setDeletingId(barber.id!)}
                />
              </div>
            )}

            {/* Botón de editar */}
            {deletingId !== barber.id && (
              <div className="absolute top-3 right-3 z-10">
                <EditCardButton
                  data-testid="btn-edit-barber"
                  onEdit={() => startEdit(barber)}
                />
              </div>
            )}

            {/* Foto del Barbero */}
            <div className="w-36 h-36 relative mb-3 rounded-full overflow-hidden border border-[var(--foreground)]/10 shadow-md flex items-center justify-center bg-[var(--background)]">
              <Image
                alt={barber.name}
                src={
                  barber.image && barber.image !== "null" && barber.image !== ""
                    ? barber.image
                    : logo
                }
                fill
                className="object-cover transition-transform duration-500 hover:scale-105"
                sizes="144px"
              />
            </div>

            {/* Nombre y datos de contacto */}
            <h3 className="text-[var(--foreground)] mb-0.5 font-bold text-lg tracking-wide line-clamp-1 w-full">
              {barber.name}
            </h3>
            <p className="text-xs text-slate-400 mb-2">{barber.instagram || barber.email}</p>

            {/* Badges de Estado y Comisiones */}
            <div className="mt-auto mb-2 flex gap-1.5 items-center justify-center w-full px-2 flex-wrap">
              <span
                className={`px-2.5 py-1 text-[10px] rounded-full font-bold tracking-wider ${
                  barber.active
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {barber.active ? "Activo" : "Inactivo"}
              </span>
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 text-[10px] rounded-full font-bold tracking-wider">
                Corte: {((barber.commission ?? 0) * 100).toFixed(0)}%
              </span>
              <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 text-[10px] rounded-full font-bold tracking-wider">
                Venta: {((barber.sale_commission ?? 0) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
