"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, DollarSign, Upload, AlertCircle } from "lucide-react";
import { createService } from "@/lib/repository/services";
import { uploadImage } from "@/lib/repository/storage";
import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "@/lib/store/useToastStore";

const DURATION_PRESETS = [15, 20, 30, 45, 60, 90];

export default function NuevoServicioClient() {
  const router = useRouter();
  const { role } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState(30);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre del servicio es obligatorio.");
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError("Ingresá un precio válido.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let imageUrl = "";
      if (imageFile) {
        try {
          imageUrl = await uploadImage("services", imageFile);
        } catch (imgErr) {
          console.error("Error subiendo imagen:", imgErr);
          toast.info("No se pudo subir la imagen, el servicio se creará sin imagen.");
        }
      }

      const success = await createService({
        name: name.trim(),
        description: description.trim(),
        price: numPrice,
        duration: Number(duration) || 30,
        image: imageUrl,
      });

      if (success) {
        toast.success("Servicio creado con éxito");
        router.push("/servicios");
        router.refresh();
      } else {
        setError("Ocurrió un error al guardar el servicio en el servidor.");
        toast.error("Error al crear el servicio");
      }
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error inesperado.");
      toast.error("Error inesperado al guardar");
    } finally {
      setLoading(false);
    }
  };

  if (role === "guest") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-[var(--accent)] mb-4" />
        <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Acceso restringido</h2>
        <p className="text-sm text-[var(--foreground)]/60 mb-6 max-w-md">
          Esta sección es exclusiva para administradores de la barbería.
        </p>
        <Link
          href="/servicios"
          className="px-6 py-2.5 rounded-xl bg-[var(--accent)] text-black font-semibold hover:opacity-90 transition-opacity"
        >
          Volver a Servicios
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 md:px-8 py-8 md:py-12">
      {/* Navigation & Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/servicios"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)] hover:underline mb-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a Servicios
          </Link>
          <h1 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
            Nuevo Servicio
          </h1>
          <p className="text-sm text-[var(--foreground)]/60 mt-1">
            Completá los detalles para sumar una nueva opción al catálogo y a la agenda
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form Layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Upload & Preview */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="p-6 rounded-2xl border border-[var(--foreground)]/10 bg-gradient-to-b from-[var(--foreground)]/5 to-[var(--foreground)]/2 backdrop-blur-md">
            <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-3">
              Foto del Servicio
            </label>

            <div className="relative aspect-square w-full rounded-2xl overflow-hidden border-2 border-dashed border-[var(--foreground)]/15 hover:border-[var(--accent)]/50 transition-colors bg-[var(--background)]/50 flex flex-col items-center justify-center group cursor-pointer">
              {imagePreview ? (
                <>
                  <Image
                    src={imagePreview}
                    alt="Vista previa"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                    <Upload className="w-8 h-8 text-[var(--accent)] mb-2" />
                    <span className="text-xs font-semibold text-white">Hacé clic para cambiar la foto</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-7 h-7" />
                  </div>
                  <span className="text-sm font-semibold text-[var(--foreground)]">Seleccionar foto</span>
                  <span className="text-xs text-[var(--foreground)]/40 mt-1">PNG, JPG o WEBP (máx. 4MB)</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-[var(--foreground)]/40 mt-3 text-center">
              Recomendado: 800x800 px o proporción 1:1 para una óptima visualización en tarjetas.
            </p>
          </div>
        </div>

        {/* Right Column: Service Fields */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="p-6 md:p-8 rounded-2xl border border-[var(--foreground)]/10 bg-gradient-to-b from-[var(--foreground)]/5 to-[var(--foreground)]/2 backdrop-blur-md space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="service-name" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2">
                Nombre del Servicio <span className="text-red-500">*</span>
              </label>
              <input
                id="service-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Corte Clásico + Barba Esculpida"
                required
                className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl p-3.5 w-full block text-sm"
              />
            </div>

            {/* Price & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="service-price" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2">
                  Precio ($) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-[var(--foreground)]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="service-price"
                    type="number"
                    min="0"
                    step="100"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="12000"
                    required
                    className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl py-3.5 pr-4 pl-11 w-full block text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="service-duration" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2">
                  Duración (minutos) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-[var(--foreground)]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="service-duration"
                    type="number"
                    min="5"
                    step="5"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    required
                    className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl py-3.5 pr-4 pl-11 w-full block text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Quick Duration Presets */}
            <div>
              <span className="block text-[11px] font-semibold text-[var(--foreground)]/60 uppercase tracking-wider mb-2">
                Duraciones sugeridas
              </span>
              <div className="flex flex-wrap gap-2">
                {DURATION_PRESETS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                      duration === mins
                        ? "!border-[var(--accent)] !bg-[var(--accent)]/15 !text-[var(--accent)] font-semibold"
                        : "!border-[var(--foreground)]/10 !bg-[var(--foreground)]/5 !text-[var(--foreground)]/70 hover:!border-[var(--accent)]/40"
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="service-description" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2">
                Descripción del Servicio <span className="text-red-500">*</span>
              </label>
              <textarea
                id="service-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detallá los pasos del servicio, técnicas utilizadas y beneficios para el cliente..."
                required
                className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl p-3.5 w-full block text-sm resize-none"
              />
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-[var(--foreground)]/10 flex items-center justify-end gap-3">
              <Link
                href="/servicios"
                className="px-5 py-2.5 rounded-xl border border-[var(--foreground)]/10 text-sm font-semibold text-[var(--foreground)]/80 hover:bg-[var(--foreground)]/5 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--accent)] text-black font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-[var(--accent)]/10 cursor-pointer"
              >
                {loading ? "Creando servicio..." : "Crear Servicio"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
