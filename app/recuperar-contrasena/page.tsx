"use client";

import { useState } from "react";
import { updatePassword } from "@/lib/repository/auth";
import dynamic from "next/dynamic";
import SaveButton from "@/components/buttons/SaveButton";
import InputPassword from "@/components/input/InputPassword";

const PopupModal = dynamic(() => import("@/components/ui/PopupModal"), { ssr: false, loading: () => null });

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupSuccess, setPopupSuccess] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const isDisabled = !newPassword || newPassword.length < 6 || confirmPassword !== newPassword || passwordChanged;
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPopupMessage("La contraseña debe tener al menos 6 caracteres.");
      setPopupSuccess(false);
      setShowPopup(true);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPopupMessage("Las contraseñas no coinciden.");
      setPopupSuccess(false);
      setShowPopup(true);
      return;
    }
    setLoading(true);
    const updated = await updatePassword(newPassword);

    setPopupMessage(updated ? "Contraseña modificada con éxito!" : "No se pudo cambiar la contraseña");
    setPopupSuccess(updated);
    setShowPopup(true);

    if (updated) {
      setNewPassword("");
      setConfirmPassword("");
      setPasswordChanged(true);
    }
    setLoading(false);
  };


  return (
    <div className="p-5 flex flex-col items-center text-center">
      <h1 className="text-3xl font-bold mb-15">Cambiar contraseña</h1>
      <div className="bg-[var(--bg-carousel)] px-15 py-5 md:px-15 md:py-10 rounded-xl shadow-md w-full max-w-md">
        <form onSubmit={handleSubmit}>

          <InputPassword
            label="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="******"
            error={newPassword && newPassword.length < 6 ? "La contraseña debe tener al menos 6 caracteres." : undefined}
          />

          <InputPassword
            label="Confirmar nueva contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="******"
            error={confirmPassword && confirmPassword !== newPassword ? "Las contraseñas no coinciden." : undefined}
          />

          <div className="flex justify-center mt-10">
            <SaveButton type="submit" disabled={isDisabled} loading={loading} />
          </div>

        </form>
        {showPopup && (
          <PopupModal
            message={popupMessage}
            success={popupSuccess}
            onClose={() => { setShowPopup(false) }}
          />
        )}
      </div>
    </div>
  );
}
