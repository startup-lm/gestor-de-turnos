"use client";

import { useState } from "react";
import { updatePassword } from "@/lib/repository/auth";
import dynamic from "next/dynamic";
import SaveButton from "@/components/buttons/SaveButton";
import InputPassword from "@/components/input/InputPassword";
import Link from "next/link";
import { Check, KeyRound } from "lucide-react";

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
    <div className="p-5 flex flex-col items-center text-center relative overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[var(--accent)]/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

      <h1 className="text-3xl font-bold mb-5 relative z-10">Cambiar contraseña</h1>

      <div className="relative z-10 w-full max-w-md bg-[#0a0f1d]/85 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] p-8 sm:p-10">
        {passwordChanged ? (
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-gradient-to-tr from-[var(--accent)] to-[#fcebb6] p-[2px] rounded-full shadow-[0_0_20px_rgba(223,186,115,0.3)] flex items-center justify-center animate-[scaleIn_0.3s_ease-out]">
              <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-[var(--accent)]" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">¡Contraseña modificada!</h2>
              <p className="text-sm text-slate-400">
                Tu contraseña ha sido restablecida con éxito. Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl font-semibold text-slate-950 bg-gradient-to-r from-[var(--accent)] to-[#fcebb6] hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[var(--accent)]/20"
            >
              Volver al Inicio
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Decorative Security Banner / Icon */}
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-tr from-[var(--accent)] to-[#fcebb6] p-[2px] rounded-full shadow-lg shadow-[var(--accent)]/10 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                  <KeyRound className="w-7 h-7 text-[var(--accent)] animate-pulse" />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-4 text-center max-w-[280px]">
                Ingresá tu nueva clave a continuación. Aseguráte de usar al menos 6 caracteres.
              </p>
            </div>

            <InputPassword
              id="reset-new-password"
              label="Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="******"
              error={newPassword && newPassword.length < 6 ? "La contraseña debe tener al menos 6 caracteres." : undefined}
            />

            <InputPassword
              id="reset-confirm-password"
              label="Confirmar nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="******"
              error={confirmPassword && confirmPassword !== newPassword ? "Las contraseñas no coinciden." : undefined}
            />

            <div className="flex justify-center mt-10">
              <div className="w-[200px]">
                <SaveButton id="btn-reset-password-submit" type="submit" disabled={isDisabled} loading={loading} />
              </div>
            </div>
          </form>
        )}

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
