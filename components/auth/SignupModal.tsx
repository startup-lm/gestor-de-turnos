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
      <Modal onClose={onClose} size="lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--foreground)]">Agregar Barbero</h2>
        <form onSubmit={handleSignup} className="px-2 text-left space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Nombre<span className="text-red-500"> *</span>
              </label>
              <input 
                id="signup-name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required
                placeholder="Nombre del barbero"
                className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Email<span className="text-red-500"> *</span>
              </label>
              <input 
                id="signup-email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="tumail@gmail.com" 
                className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <InputPassword
                id="signup-password"
                label="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                error={password && password.length < 6 ? "La contraseña debe tener al menos 6 caracteres." : undefined}
                requiered
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Ganancia por corte (%)
              </label>
              <div className="relative w-full">
                <input 
                  id="signup-commission" 
                  type="number" 
                  min="0" 
                  max="100" 
                  step="0.1" 
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)} 
                  className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 pr-10 w-full block text-sm"
                  placeholder="0"
                />
                <span className="font-semibold absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--accent)] text-sm">%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Instagram<span className="text-red-500"> *</span>
              </label>
              <input 
                id="signup-instagram" 
                value={instagram} 
                onChange={(e) => setInstagram(e.target.value)} 
                required 
                placeholder="@instagram" 
                className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Foto de perfil
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-[var(--foreground)]/10 border-dashed rounded-lg cursor-pointer bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 hover:border-[var(--accent)]/30 transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <p className="text-xs text-[var(--accent)] font-semibold uppercase tracking-wider">
                      {image ? image.name : "Seleccionar Foto de Perfil"}
                    </p>
                    <p className="text-[10px] text-[var(--foreground)]/40 mt-1">PNG, JPG o WEBP (máx. 2MB)</p>
                  </div>
                  <input 
                    id="signup-profile-image" 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => e.target.files && setImage(e.target.files[0])} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <AddButton id="btn-signup-submit" type="submit" loading={loading} disabled={isDisabled} />
          </div>
        </form>
      </Modal>

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
