"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Upload,
  Save,
  Trash2,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Service } from "@/lib/types/Services";
import { updateService, deleteService } from "@/lib/repository/services";
import { uploadImage, deleteImage } from "@/lib/repository/storage";
import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "@/lib/store/useToastStore";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import logo from "@/public/images/logo.png";

interface Props {
  initialService: Service;
}

const DURATION_PRESETS = [15, 20, 30, 45, 60, 90];

export default function ServicioDetailClient({ initialService }: Readonly<Props>) {
  const router = useRouter();
  const { role } = useAuth();

  const [service, setService] = useState<Service>(initialService);
  const [name, setName] = useState(initialService.name);
  const [description, setDescription] = useState(initialService.description);
  const [price, setPrice] = useState(String(initialService.price));
  const [duration, setDuration] = useState(initialService.duration || 30);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const isAdmin = role === "admin";

  const isDirty =
    name !== service.name ||
    description !== service.description ||
    Number(price) !== service.price ||
    duration !== (service.duration || 30) ||
    selectedFile !== null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("El nombre no puede estar vacío");
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      toast.error("El precio debe ser un número válido");
      return;
    }

    setSaving(true);
    try {
      let finalImageUrl = service.image;

      if (selectedFile) {
        if (service.image) {
          try {
            await deleteImage("services", service.image);
          } catch (delErr) {
            console.warn("No se pudo eliminar la imagen previa:", delErr);
          }
        }
        finalImageUrl = await uploadImage("services", selectedFile);
      }

      const success = await updateService({
        id: service.id,
        name: name.trim(),
        description: description.trim(),
        price: numPrice,
        duration: Number(duration) || 30,
        image: finalImageUrl,
      });

      if (success) {
        setService({
          ...service,
          name: name.trim(),
          description: description.trim(),
          price: numPrice,
          duration: Number(duration) || 30,
          image: finalImageUrl,
        });
        setSelectedFile(null);
        toast.success("Servicio actualizado con éxito");
        router.refresh();
      } else {
        toast.error("Error al actualizar el servicio");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error inesperado al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const success = await deleteService(service.id);
      if (success) {
        toast.success("Servicio eliminado con éxito");
        router.push("/servicios");
        router.refresh();
      } else {
        toast.error("Error al eliminar el servicio");
        setIsConfirmingDelete(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error inesperado al eliminar");
      setIsConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 md:px-8 py-8 md:py-12">
      {/* Top Header & Breadcrumb */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/servicios"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)] hover:underline mb-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a servicios
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
              {isAdmin ? "Editar servicio" : null}
            </h1>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              disabled={deleting || saving}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 border border-red-500/20 text-xs md:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar servicio</span>
            </button>

            <button
              type="submit"
              form="service-edit-form"
              disabled={!isDirty || saving}
              className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all shadow-md active:scale-95 min-h-[40px] ${
                isDirty && !saving
                  ? "!bg-[var(--accent)] hover:!bg-[#E8CA8C] !text-slate-950 shadow-[var(--accent)]/20 cursor-pointer"
                  : "!bg-[var(--foreground)]/5 !text-[var(--foreground)]/30 border border-[var(--foreground)]/10 cursor-not-allowed opacity-50"
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
        )}
      </div>

      {/* Main Content */}
      {isAdmin ? (
        <>
        <form id="service-edit-form" onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Image */}
          <div className="lg:col-span-5 flex flex-col h-full">
            <div className="p-6 rounded-2xl border border-[var(--foreground)]/10 bg-gradient-to-b from-[var(--foreground)]/5 to-[var(--foreground)]/2 backdrop-blur-md flex flex-col justify-between h-full">
              <div className="flex flex-col flex-1 min-h-0 mb-4">
                <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-3">
                  Imagen del Servicio
                </label>

                <div className="relative w-full h-[320px] lg:h-auto lg:flex-1 min-h-[240px] rounded-2xl overflow-hidden border border-[var(--foreground)]/10 bg-[var(--background)]/50 flex flex-col items-center justify-center group cursor-pointer shadow-inner">
                  <Image
                    src={imagePreview || service.image || logo}
                    alt={name}
                    fill
                    className={`transition-all duration-300 ${!service.image && !imagePreview ? "object-contain p-8" : "object-cover group-hover:scale-105"}`}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                    <Upload className="w-8 h-8 text-[var(--accent)] mb-2" />
                    <span className="text-xs font-semibold text-white">
                      {selectedFile ? selectedFile.name : "Hacé clic para cambiar la foto"}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex-shrink-0 flex items-center justify-between text-xs text-[var(--foreground)]/60">
                <span>Estado: <strong className="text-emerald-400">Activo</strong></span>
                <span>Proporción: 1:1</span>
              </div>
            </div>
          </div>

          {/* Right Column: Form Inputs */}
          <div className="lg:col-span-7 flex flex-col h-full">
            <div className="p-6 md:p-8 rounded-2xl border border-[var(--foreground)]/10 bg-gradient-to-b from-[var(--foreground)]/5 to-[var(--foreground)]/2 backdrop-blur-md flex flex-col justify-between h-full space-y-6">
              <div className="space-y-6 flex-1">
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
                        required
                        className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl !py-3.5 !pr-4 !pl-11 w-full block text-sm"
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
                        className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl !py-3.5 !pr-4 !pl-11 w-full block text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Duration presets */}
                <div>
                  <span className="block text-[11px] font-semibold text-[var(--foreground)]/60 uppercase tracking-wider mb-2">
                    Duraciones comunes
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
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="service-description"
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl p-3.5 w-full block text-sm resize-none"
                  />
                </div>

              </div>
            </div>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={isConfirmingDelete}
          onClose={() => setIsConfirmingDelete(false)}
          onConfirm={handleDelete}
          title="¿Eliminar servicio?"
          description="Esta acción no se puede deshacer. Se eliminará del menú de turnos."
          confirmText="Eliminar"
          cancelText="Cancelar"
          loading={deleting}
        />
        </>
      ) : (
        /* Guest Showcase View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
          <div className="lg:col-span-6">
            <div className="relative aspect-square w-full max-w-lg mx-auto rounded-3xl overflow-hidden border border-[var(--foreground)]/10 bg-gradient-to-b from-[var(--foreground)]/5 to-[var(--foreground)]/2 backdrop-blur-md shadow-2xl">
              <Image
                src={service.image || logo}
                alt={service.name}
                fill
                className={`transition-all duration-500 hover:scale-105 ${!service.image ? "object-contain p-12" : "object-cover"}`}
                priority
              />
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/20">
                <Clock className="w-3.5 h-3.5" />
                {service.duration || 30} minutos
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Disponible
              </span>
            </div>

            <h2 className="text-4xl font-extrabold text-[var(--foreground)] tracking-tight">
              {service.name}
            </h2>

            <div className="text-3xl font-extrabold text-[var(--accent)]">
              ${service.price.toLocaleString("es-AR")}
            </div>

            <p className="text-base text-[var(--foreground)]/70 leading-relaxed">
              {service.description}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <Link
                href={`/turnos?service=${service.id}`}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[var(--accent)] text-black font-bold text-base hover:opacity-90 transition-all shadow-xl shadow-[var(--accent)]/15"
              >
                Reservar turno con este servicio
              </Link>
              <Link
                href="/servicios"
                className="inline-flex items-center justify-center px-6 py-4 rounded-2xl border border-[var(--foreground)]/10 text-[var(--foreground)]/80 hover:bg-[var(--foreground)]/5 font-semibold text-base transition-colors"
              >
                Ver todos los servicios
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
