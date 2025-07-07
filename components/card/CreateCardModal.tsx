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
      <Modal onClose={onClose}>
        <h2 className="text-xl font-bold mb-4 text-center">
          Crear {type}
        </h2>
        <form onSubmit={handleSave} className="space-y-4 px-8">
          <div className="text-left rounded-2lg mt-5 shadow-lg">

            <label className="block text-sm font-medium mb-1 mt-4">
              Nombre<span className="text-red-500"> *</span>
            </label>
            <input
              className="border p-2 rounded w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder={`Nombre del ${type}`}
            />

            <label className="block text-sm font-medium mb-1 mt-4">
              Descripción<span className="text-red-500"> *</span>
            </label>
            <textarea
              className="border p-2 rounded w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder={`Descripción del ${type}`}
            />

            <label className="block text-sm font-medium mb-1 mt-4">
              Precio<span className="text-red-500"> *</span>
            </label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              className="border p-2 rounded w-full"
              value={priceText}
              onChange={(e) => setPriceText(e.target.value)}
              placeholder="0"
              required
            />

            {type === "Servicio" && (
              <>
                <label className="block text-sm font-medium mb-1 mt-4">
                  Duración del servicio (en minutos)<span className="text-red-500"> *</span>
                </label>
                <input 
                  type="number" 
                  inputMode="decimal" 
                  value={duration} 
                  onChange={e => setDuration(Number(e.target.value))} 
                  required 
                  className="border p-2 rounded w-full" 
                />
              </>
            )}

            <label className="block text-sm font-medium mb-1 mt-4">
              Imágen<span className="text-red-500"> *</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                e.target.files && setImage(e.target.files[0])
              }
              required
            />
          </div>

          <div className="flex justify-center mt-10">
            <AddButton type="submit" loading={loading} disabled={isDisabled} />
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
