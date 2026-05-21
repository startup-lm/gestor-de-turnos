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
    popup.open(error ? "Hubo un error al enviar el mail. Intentá de nuevo." : "Te enviamos un mail para restablecer tu contraseña.", !error);
    setLoading(false);
    setEmail("");
  };

  return (
    <>
      <Modal onClose={onClose} size="md">
        <h2 className="text-2xl font-bold mb-3 text-center text-[var(--foreground)]">
          Recuperar contraseña
        </h2>
        <p className="text-xs text-[var(--foreground)]/60 text-center mb-6 leading-relaxed">
          Ingresá tu correo electrónico registrado y te enviaremos las instrucciones para restablecer tu acceso de forma segura.
        </p>
        <form onSubmit={handleSubmit} className="px-2 text-left">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tumail@gmail.com"
                className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm"
              />
            </div>
          </div>
          <div className="flex justify-center mt-8">
            <div className="w-[200px]">
              <SendButton id="btn-forgot-submit" type="submit" loading={loading} disabled={isDisabled} />
            </div>
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
