"use client";

import { useState } from "react";
import { createProduct } from "@/lib/repository/products";
import { createService } from "@/lib/repository/services";
import Modal from "@/components/ui/Modal";
import PopupModal from "@/components/ui/PopupModal";
import { usePopup } from "@/lib/hooks/usePopup";
import { uploadImage } from "@/lib/repository/storage";
import AddButton from "../buttons/AddButton";

interface Props {
  type: "Producto" | "Servicio";
  onClose: () => void;
}

export default function CreateCardModal({ type, onClose }: Readonly<Props>) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceText, setPriceText] = useState("");
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const priceNumber = Number(priceText);
  const isDisabled =
    !name.trim() ||
    !description.trim() ||
    !priceText.trim() ||
    isNaN(priceNumber) ||
    priceNumber < 0 ||
    !image;

  const popup = usePopup();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const price = priceNumber;
    let imageUrl = "";
    let imageError = false;
    const table = type.toLowerCase() === 'producto' ? "products" : "services"; 
    if (image) {
      try {
        imageUrl = await uploadImage(table, image);
      } catch {
        imageError = true;
      }
    }
    const params = { name, description, price, image: imageUrl };
    const success = type === "Producto" ? await createProduct(params) : await createService(params);
    const message = imageError ? `${type} creado sin imagen. Imágen demasiado grande` : `${type} creado con éxito.`;
    popup.open( success ? message : `Error al crear el ${type.toLowerCase()}`, success );
    setLoading(false);
  };

  return (
    <>
      <Modal onClose={onClose} size="md">
        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--foreground)]">
          Agregar {type}
        </h2>
        <form onSubmit={handleSave} className="px-2 text-left space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Nombre<span className="text-red-500"> *</span>
              </label>
              <input
                id="card-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder={`Nombre del ${type.toLowerCase()}`}
                className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Descripción<span className="text-red-500"> *</span>
              </label>
              <textarea
                id="card-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder={`Descripción corta del ${type.toLowerCase()}...`}
                className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm h-20 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                  Precio ($)<span className="text-red-500"> *</span>
                </label>
                <div className="relative">
                  <input
                    id="card-price"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="1"
                    value={priceText}
                    onChange={(e) => setPriceText(e.target.value)}
                    placeholder="0"
                    required
                    className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm"
                  />
                </div>
              </div>

              {type === "Servicio" && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                    Duración (minutos)<span className="text-red-500"> *</span>
                  </label>
                  <input 
                    id="card-duration"
                    type="number" 
                    inputMode="decimal" 
                    value={duration} 
                    onChange={e => setDuration(Number(e.target.value))} 
                    required 
                    className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm" 
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Imagen del {type}<span className="text-red-500"> *</span>
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-[var(--foreground)]/10 border-dashed rounded-lg cursor-pointer bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 hover:border-[var(--accent)]/30 transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <p className="text-xs text-[var(--accent)] font-semibold uppercase tracking-wider">
                      {image ? image.name : "Seleccionar Imagen"}
                    </p>
                    <p className="text-[10px] text-[var(--foreground)]/40 mt-1">PNG, JPG o WEBP (máx. 2MB)</p>
                  </div>
                  <input 
                    id="signup-profile-image" 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => e.target.files && setImage(e.target.files[0])} 
                    required
                    className="hidden" 
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-6">
            <AddButton id="btn-card-add" type="submit" loading={loading} disabled={isDisabled} />
          </div>
        </form>
      </Modal>

      {popup.show && (
        <PopupModal
          message={popup.message}
          success={popup.success}
          onClose={() => {
            popup.close();
            if (popup.success) onClose();
          }}
        />
      )}
    </>
  );
}
