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
      <Modal onClose={onClose}>
        <h2 className="text-xl font-bold mb-4 text-center">Editar {type}</h2>
        <form onSubmit={handleSave} className="px-6">
          <div className="text-left rounded-2lg mt-5 shadow-lg">
            <label className="block text-sm font-medium mb-1" >
              Nombre
            </label>
            <input value={newName} onChange={e => setNewName(e.target.value)} required className="mb-4" />

            <label className="block text-sm font-medium mb-1">
              Descripción
            </label>
            <textarea className="border p-2 rounded w-full mb-4" value={newDesc} onChange={e => setNewDesc(e.target.value)} required />

            <label className="block text-sm font-medium mb-1">
              Precio
            </label>
            <input type="number" inputMode="decimal" value={newPrice} onChange={e => setNewPrice(Number(e.target.value))} required className="mb-4" />

            {type === "Servicio" && (
              <>
                <label className="block text-sm font-medium mb-1">
                  Duración del servicio (en minutos)
                </label>
                <input type="number" inputMode="decimal" value={newDuration} onChange={e => setNewDuration(Number(e.target.value))} required className="mb-4" />
              </>
            )}

            <label className="block text-sm font-medium mb-1">
              Modificar imagen
            </label>
            <input type="file" accept="image/*" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} />
          </div>

          <div className="flex justify-center mt-10">
            <SaveButton type="submit" disabled={isDisabled} loading={loading} />
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