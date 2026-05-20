"use client";

import { useState } from "react";
import { updateProduct } from "@/lib/repository/products";
import { updateService } from "@/lib/repository/services";
import Modal from "@/components/ui/Modal";
import PopupModal from "@/components/ui/PopupModal";
import { usePopup } from "@/lib/hooks/usePopup";
import { deleteImage, uploadImage } from "@/lib/repository/storage";
import SaveButton from "../buttons/SaveButton";

interface Props {
  id: number;
  name: string;
  description: string;
  price: number;
  duration?: number;
  image: string | null;
  type: "Producto" | "Servicio";
  onClose: () => void;
  onSave: () => void;
}

export default function EditCardModal({ id, name, description, price, duration, image, type, onClose, onSave, }: Readonly<Props>) {
  const [newName, setNewName] = useState(name);
  const [newDesc, setNewDesc] = useState(description);
  const [newPrice, setNewPrice] = useState(price);
  const [newDuration, setNewDuration] = useState(duration);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const isDisabled = newName === name && newDesc === description && newPrice === price && !selectedFile;
  const popup = usePopup();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const bucket = type.toLowerCase() === "producto" ? "products" : "services";
    let params;
    let newImage = "";
    let imageError = false;
    if (selectedFile) {
      await deleteImage(bucket, image);
      try {
        newImage = await uploadImage(bucket, selectedFile);
      } catch {
        imageError = true;
      }
      params = { id, name: newName, description: newDesc, price: newPrice, image: newImage };
    } else params = { id, name: newName, description: newDesc, price: newPrice };
    const edited = type === "Producto" ? await updateProduct(params) : await updateService(params);
    const message = imageError ? `${type} editado sin imagen. Imágen demasiado grande` : `${type} editado con éxito.`;
    popup.open(edited ? message : `Error al editar el ${type.toLowerCase()}`, edited);
    setLoading(false);
  };

  return (
    <>
      <Modal onClose={onClose} size="md">
        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--foreground)]">Editar {type}</h2>
        <form onSubmit={handleSave} className="px-2 text-left space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5" >
                Nombre
              </label>
              <input 
                id="edit-card-name" 
                value={newName} 
                onChange={e => setNewName(e.target.value)} 
                required 
                className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Descripción
              </label>
              <textarea 
                id="edit-card-description" 
                value={newDesc} 
                onChange={e => setNewDesc(e.target.value)} 
                required 
                className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm h-20 resize-none" 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                  Precio ($)
                </label>
                <input 
                  id="edit-card-price" 
                  type="number" 
                  inputMode="decimal" 
                  value={newPrice} 
                  onChange={e => setNewPrice(Number(e.target.value))} 
                  required 
                  className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm" 
                />
              </div>

              {type === "Servicio" && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                    Duración (minutos)
                  </label>
                  <input 
                    id="edit-card-duration" 
                    type="number" 
                    inputMode="decimal" 
                    value={newDuration} 
                    onChange={e => setNewDuration(Number(e.target.value))} 
                    required 
                    className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm" 
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Modificar Imagen
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-[var(--foreground)]/10 border-dashed rounded-lg cursor-pointer bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 hover:border-[var(--accent)]/30 transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <p className="text-xs text-[var(--accent)] font-semibold uppercase tracking-wider">
                      {selectedFile ? selectedFile.name : "Seleccionar Nueva Imagen"}
                    </p>
                    <p className="text-[10px] text-[var(--foreground)]/40 mt-1">Dejar vacío para mantener la imagen actual</p>
                  </div>
                  <input 
                    id="edit-card-image" 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-6">
            <SaveButton id="btn-edit-card-save" type="submit" disabled={isDisabled} loading={loading} />
          </div>
        </form>
      </Modal>

      {popup.show && (
        <PopupModal
          message={popup.message}
          success={popup.success}
          onClose={() => {
            popup.close();
            if (popup.success) onSave();
          }}
        />
      )}
    </>
  );
}