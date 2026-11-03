"use client";

import { useState } from "react";
import { ArrowLeft, DollarSign, Clock, Save, Plus, Trash2, Loader2 } from "lucide-react";
import { Service } from "@/lib/types/Services";
import { createService, updateService, deleteService } from "@/lib/repository/services";
import { uploadImage, deleteImage } from "@/lib/repository/storage";
import { toast } from "@/lib/store/useToastStore";
import InlineConfirm from "@/components/ui/InlineConfirm";
import CatalogImageField from "./CatalogImageField";
import { catalogInputClass, catalogLabelClass } from "./styles";

const DURATION_PRESETS = [15, 20, 30, 45, 60, 90];

interface Props {
  /** Sin servicio es un alta; con servicio, una edición */
  service?: Service;
  onBack: () => void;
  onSaved: () => void;
}

export default function ServiceForm({ service, onBack, onSaved }: Readonly<Props>) {
  const isEditing = Boolean(service);

  const [name, setName] = useState(service?.name ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [price, setPrice] = useState(service ? String(service.price) : "");
  const [duration, setDuration] = useState(String(service?.duration || 30));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const isDirty =
    !service ||
    name !== service.name ||
    description !== service.description ||
    Number(price) !== service.price ||
    Number(duration) !== (service.duration || 30) ||
    imageFile !== null;

  const handleImageSelect = (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("El nombre del servicio es obligatorio");
      return;
    }
    const numPrice = Number(price);
    if (price === "" || isNaN(numPrice) || numPrice < 0) {
      toast.error("Ingresá un precio válido");
      return;
    }
    const numDuration = Number(duration);
    if (!Number.isInteger(numDuration) || numDuration < 5) {
      toast.error("Ingresá una duración válida, de al menos 5 minutos");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = service?.image ?? "";
      if (imageFile) {
        try {
          if (service?.image) await deleteImage("services", service.image).catch(() => undefined);
          imageUrl = await uploadImage("services", imageFile);
        } catch {
          toast.info("No se pudo subir la imagen, el servicio se guarda sin cambiarla");
        }
      }

      const fields = {
        name: name.trim(),
        description: description.trim(),
        price: numPrice,
        duration: numDuration,
        image: imageUrl,
      };
      const success = service ? await updateService({ id: service.id, ...fields }) : await createService(fields);

      if (success) {
        toast.success(isEditing ? "Servicio actualizado con éxito" : "Servicio creado con éxito");
        onSaved();
      } else {
        toast.error(isEditing ? "Error al actualizar el servicio" : "Error al crear el servicio");
      }
    } catch {
      toast.error("Error inesperado al guardar el servicio");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!service) return;
    setDeleting(true);
    try {
      const success = await deleteService(service.id);
      if (success) {
        toast.success("Servicio eliminado con éxito");
        onSaved();
      } else {
        toast.error("Error al eliminar el servicio");
        setIsConfirmingDelete(false);
      }
    } catch {
      toast.error("Error inesperado al eliminar el servicio");
      setIsConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[var(--accent)] hover:text-white transition-colors cursor-pointer group mb-1"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Volver a servicios</span>
          </button>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            {isEditing ? "Editar servicio" : "Nuevo servicio"}
          </h2>
        </div>

        <div className="flex flex-col gap-3 self-start sm:self-auto w-full sm:w-auto">
          <div className="flex items-center gap-3">
            {isEditing && (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                disabled={deleting || saving}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 border border-red-500/20 text-xs md:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
            )}
            <button
              type="submit"
              form="service-form"
              disabled={!isDirty || saving}
              className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all shadow-md active:scale-95 min-h-[44px] ${
                isDirty && !saving
                  ? "!bg-[var(--accent)] hover:!bg-[var(--accent-hover)] !text-slate-950 shadow-[var(--accent)]/20 cursor-pointer"
                  : "!bg-[var(--foreground)]/5 !text-[var(--foreground)]/30 border border-[var(--foreground)]/10 cursor-not-allowed opacity-50"
              }`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEditing ? (
                <Save className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{isEditing ? "Guardar cambios" : "Crear servicio"}</span>
            </button>
          </div>

          {isConfirmingDelete && (
            <InlineConfirm
              message="¿Eliminar el servicio? Deja de aparecer para reservar turnos y no se puede deshacer."
              confirmText="Eliminar"
              cancelText="Cancelar"
              onConfirm={handleDelete}
              onCancel={() => setIsConfirmingDelete(false)}
              loading={deleting}
            />
          )}
        </div>
      </div>

      <form id="service-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5">
          <CatalogImageField
            label="Foto del servicio"
            currentImage={service?.image}
            preview={imagePreview}
            fileName={imageFile?.name}
            onSelect={handleImageSelect}
          />
        </div>

        <div className="lg:col-span-7 p-6 md:p-8 rounded-2xl border border-[var(--foreground)]/10 bg-gradient-to-b from-[var(--foreground)]/5 to-[var(--foreground)]/2 backdrop-blur-md space-y-6">
          <div>
            <label htmlFor="service-name" className={catalogLabelClass}>
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              id="service-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Corte y barba"
              required
              className={`${catalogInputClass} p-3.5`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="service-price" className={catalogLabelClass}>
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
                  className={`${catalogInputClass} !py-3.5 !pr-4 !pl-11`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="service-duration" className={catalogLabelClass}>
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
                  onChange={(e) => setDuration(e.target.value)}
                  required
                  className={`${catalogInputClass} !py-3.5 !pr-4 !pl-11`}
                />
              </div>
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-semibold text-[var(--foreground)]/60 uppercase tracking-wider mb-2">
              Duraciones comunes
            </span>
            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDuration(String(mins))}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer min-h-[36px] ${
                    Number(duration) === mins
                      ? "!border-[var(--accent)] !bg-[var(--accent)]/15 !text-[var(--accent)] font-semibold"
                      : "!border-[var(--foreground)]/10 !bg-[var(--foreground)]/5 !text-[var(--foreground)]/70 hover:!border-[var(--accent)]/40"
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="service-description" className={catalogLabelClass}>
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              id="service-description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contá qué incluye el servicio"
              required
              className={`${catalogInputClass} p-3.5 resize-none`}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
