"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import Modal from "./Modal";
import WhatsappButton from "../buttons/WhatsappButton";

export default function PopupModal({ message, success, onClose, showWhatsappButton, handleWhatsappButton}:
  Readonly<{ message: string; success: boolean; onClose: () => void; showWhatsappButton?: boolean; handleWhatsappButton?: () => void;}>) {

  // Si no se requiere botón de acción de WhatsApp, la notificación ya la gestiona el Toast global.
  // Cerramos limpiamente sin bloquear la pantalla con un modal centrado.
  useEffect(() => {
    if (!showWhatsappButton) {
      const timer = setTimeout(() => {
        onClose();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showWhatsappButton, onClose]);

  if (!showWhatsappButton) {
    return null;
  }

  return (
    <Modal onClose={onClose} size="sm">
      <div className="px-2 text-center">
        <div className="flex flex-col items-center mb-5">
          <div className={`p-4 rounded-full border-2 ${
            success 
              ? "border-green-500/25 bg-green-500/5 text-green-500 shadow-lg shadow-green-500/5" 
              : "border-red-500/25 bg-red-500/5 text-red-500 shadow-lg shadow-red-500/5"
          }`}>
            {success ? (
              <CheckCircle size={30} />
            ) : (
              <XCircle size={30} />
            )}
          </div>
        </div>

        <h2 className="text-base font-semibold mb-6 text-[var(--foreground)] leading-relaxed">
          {message.includes('\n')
            ? message.split('\n').map((row, i) => (
                <div key={i} className="mb-2">
                  {row}
                </div>
              ))
            : message
                .split(".")
                .filter((row) => row.trim())
                .map((row, i) => (
                  <div key={i} className="mb-2">
                    {row.trim() + "."}
                  </div>
                ))}
        </h2>

        <div className={showWhatsappButton ? "flex justify-center mt-4" : ""}>
          {showWhatsappButton && handleWhatsappButton && (
            <WhatsappButton onClick={handleWhatsappButton} name={message.includes("cancelado") ? "Confirmar cancelación turno" : "Confirmar turno"}/>
          )}
        </div>
      </div>
    </Modal>
  );
}
