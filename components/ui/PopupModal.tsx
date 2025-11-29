"use client";

import { CheckCircle, XCircle } from "lucide-react";
import Modal from "./Modal";
import WhatsappButton from "../buttons/WhatsappButton";

export default function PopupModal({ message, success, onClose, showWhatsappButton, handleWhatsappButton}:
  Readonly<{ message: string; success: boolean; onClose: () => void; showWhatsappButton?: boolean; handleWhatsappButton?: () => void;}>) {

  return (
    <Modal onClose={onClose}>
      <div className="px-2">
        <h2 className="text-xl font-semibold mb-4">
          {message
            .split(".")
            .filter((row) => row.trim())
            .map((row, i) => (
              <div key={i} className="mb-2">
                {row.trim() + "."}
              </div>
            ))}
        </h2>

        <div className="flex justify-center mb-4">
          {success ? (
            <CheckCircle className="text-green-500" size={48} />
          ) : (
            <XCircle className="text-red-500" size={48} />
          )}
        </div>

        <div className={showWhatsappButton ? "flex justify-center" : ""}>
          {showWhatsappButton && handleWhatsappButton && (
            <WhatsappButton onClick={handleWhatsappButton} name={message.includes("cancelado") ? "Confirmar cancelación turno" : "Confirmar turno"}/>
          )}
        </div>
      </div>
    </Modal>
  );
}
