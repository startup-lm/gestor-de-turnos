"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { usePopup } from "@/lib/hooks/usePopup";
import Modal from "@/components/ui/Modal";
import PopupModal from "@/components/ui/PopupModal";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { useAuth } from "@/lib/auth/AuthContext";
import LoginButton from "../buttons/LoginButton";
import InputPassword from "../input/InputPassword";

export default function LoginModal({ onClose, }: Readonly<{ onClose: () => void; }>) {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const isDisabled = !email || !password;
  const popup = usePopup();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      popup.open(error, false);
      setEmail("");
      setPassword("");
      return;
    }
    router.push("/turnos");
    onClose();
  };

  return (
    <>
      <Modal onClose={onClose}>
        <Image src="/images/logo_hooligans.png" alt="Login Icon" width={120} height={120} className="rounded-full mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--primary)]">
          Iniciar Sesión
        </h2>
        <form onSubmit={handleLogin} className="px-4 md:px-6">
          <div className="text-left rounded-2lg mt-5 shadow-lg">
            <label className="block text-sm font-medium mb-1 mt-3">
              Email
            </label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tumail@gmail.com" />

            <InputPassword
              label="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******"
              requiered
            />

            <div className="text-right text-xs mb-3 mt-1">
              <button type="button" className="forgot-password-button" onClick={() => setForgotOpen(true)} >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>

          <div className="flex justify-center mt-10">
            <LoginButton type="submit" loading={loading} disabled={isDisabled} onMouseEnter={() => router.prefetch("/turnos")} />
          </div>
        </form>
      </Modal>

      {popup.show && (
        <PopupModal message={popup.message} success={popup.success} onClose={popup.close} />
      )}

      {forgotOpen && <ForgotPasswordModal onClose={() => setForgotOpen(false)} />}
    </>
  );
}
