"use client";

import { useState } from "react";
import { usePopup } from "@/lib/hooks/usePopup";
import { getBarberByEmail, addBarber, updateBarber } from "@/lib/repository/barbers";
import { isBarberAuthenticated, signUp } from "@/lib/repository/auth";
import Modal from "@/components/ui/Modal";
import PopupModal from "@/components/ui/PopupModal";
import { uploadImage } from "../../lib/repository/storage";
import AddButton from "../buttons/AddButton";
import InputPassword from "../input/InputPassword";

export default function SignupModal({ onClose }: Readonly<{ onClose: () => void }>) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [password, setPassword] = useState("");
  const [commission, setCommission] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const isDisabled = !name || !email || !password || !instagram || password.length < 6;
  const popup = usePopup();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const existingBarber = await getBarberByEmail(email);
    const inAuth = await isBarberAuthenticated(email);
    if (existingBarber && inAuth) {
      popup.open("El email ya está registrado", false);
      setLoading(false);
      return;
    }
    if (!inAuth) {
      const { data, error } = await signUp(email, password);
      if (error || !data?.user) {
        popup.open("Error al crear la cuenta", false);
        setLoading(false);
        return;
      }
    }
    let imageUrl = "";
    let imageError = false;
    if (image) {
      try {
        imageUrl = await uploadImage("barbers", image);
      } catch {
        imageError = true;
      }
    }
    if (!existingBarber) await addBarber({ email, name, image: imageUrl, instagram, role: "barber" });
    else await updateBarber(existingBarber.id!, { name, email, instagram, image: imageUrl, commission, active: true });
    popup.open(imageError ? "Barbero creado sin imágen. Imágen demasiado grande" : "Barbero creado exitosamente", true);
    setLoading(false);
  };

  return (
    <>
      <Modal onClose={onClose}>
        <h2 className="text-xl font-bold mb-4 text-center">Agregar Barbero</h2>
        <form onSubmit={handleSignup} className="px-8">
          <div className="text-left rounded-2lg mt-5 shadow-lg">
            <label className="block text-sm font-medium mb-1 mt-4">
              Nombre<span className="text-red-500"> *</span>
            </label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
            />
            <label className="block text-sm font-medium mb-1 mt-4">
              Email<span className="text-red-500"> *</span>
            </label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tumail@gmail.com" />

            <InputPassword
              label="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******"
              error={password && password.length < 6 ? "La contraseña debe tener al menos 6 caracteres." : undefined}
              requiered
            />

            <label className="block text-sm font-medium mb-1 mt-4">Ganancia por corte</label>
            <div className="relative w-30">
              <input type="number" min="0" max="100" step="0.1" value={Number(commission)}
                onChange={(e) => setCommission(e.target.value)} className="border rounded p-2 pr-8" />
              <span className="font-medium absolute right-2 top-1/2 -translate-y-1/2">%</span>
            </div>

            <label className="block text-sm font-medium mb-1 mt-4">
              Instagram<span className="text-red-500"> *</span>
            </label>
            <input value={instagram} onChange={(e) => setInstagram(e.target.value)} required placeholder="@instagram" />

            <label className="block text-sm font-medium mb-1 mt-4">
              Foto de perfil
            </label>
            <input type="file" accept="image/*" onChange={(e) => e.target.files && setImage(e.target.files[0])} />
          </div>

          <div className="flex justify-center mt-10">
            <AddButton type="submit" loading={loading} disabled={isDisabled} />
          </div>

        </form>
      </Modal >

      {popup.show && (
        <PopupModal message={popup.message} success={popup.success}
          onClose={() => {
            popup.close();
            onClose();
          }}
        />
      )}
    </>
  );
}
