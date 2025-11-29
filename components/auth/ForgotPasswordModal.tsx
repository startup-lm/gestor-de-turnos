"use client";

import { useState } from "react";
import { getBarberByEmail } from "@/lib/repository/barbers";
import { resetPassword } from "@/lib/repository/auth";
import { usePopup } from "@/lib/hooks/usePopup";
import Modal from "@/components/ui/Modal";
import PopupModal from "@/components/ui/PopupModal";
import SendButton from "../buttons/SendButton";

export default function ForgotPasswordModal({ onClose }: Readonly<{ onClose: () => void }>) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const isDisabled = !email;
  const popup = usePopup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!(await getBarberByEmail(email))) {
      popup.open("El email no está registrado", false);
      setLoading(false);
      return;
    }
    const error = await resetPassword(email);
    popup.open( error ? "Hubo un error al enviar el mail. Intentá de nuevo." : "Te enviamos un mail para restablecer tu contraseña.", !error );
    setLoading(false);
    setEmail("");
  };

  return (
    <>
      <Modal onClose={onClose}>
        <h2 className="text-xl font-bold mb-4 text-center">
          Recuperar contraseña
        </h2>
        <form onSubmit={handleSubmit} className="px-4">
          <div className="text-left rounded-2lg mt-5">
            <label className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tumail@gmail.com"
            />
          </div>
          <div className="flex justify-center mt-10">
            <SendButton type="submit" loading={loading} disabled={isDisabled} />
          </div>
        </form>
      </Modal>

      {popup.show && (
        <PopupModal
          message={popup.message}
          success={popup.success}
          onClose={popup.close}
        />
      )}
    </>
  );
}
