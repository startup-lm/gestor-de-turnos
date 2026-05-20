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
import logo from "@/public/images/logo.png";

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
      <Modal onClose={onClose} size="md">
        <div className="flex flex-col items-center">
          <div className="relative p-1 rounded-full border-2 border-[var(--accent)]/20 bg-gradient-to-b from-[var(--accent)]/10 to-transparent shadow-lg shadow-[var(--accent)]/5 mb-4">
            <Image
              src={logo}                  // import estático
              alt="Login Icon"
              width={100}
              height={100}
              className="rounded-full mx-auto"
              unoptimized                 // opcional si <10 KB
            />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--foreground)]">
          Iniciar Sesión
        </h2>
        <form onSubmit={handleLogin} className="px-2">
          <div className="text-left mt-2 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5 mt-3">
                Email
              </label>
              <input 
                id="login-email" 
                data-testid="login-email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="tumail@gmail.com" 
                className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm"
              />
            </div>

            <div>
              <InputPassword
                id="login-password"
                data-testid="login-password"
                label="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                requiered
              />
            </div>

            <div className="text-right">
              <button 
                id="btn-forgot-password" 
                type="button" 
                className="text-[var(--accent)]/70 hover:text-[var(--accent)] font-semibold transition-colors text-xs inline-block mt-1" 
                onClick={() => setForgotOpen(true)} 
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <div data-testid="login-submit-wrapper" className="w-full">
              <LoginButton id="btn-login-submit" type="submit" loading={loading} disabled={isDisabled} onMouseEnter={() => router.prefetch("/turnos")} />
            </div>
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
