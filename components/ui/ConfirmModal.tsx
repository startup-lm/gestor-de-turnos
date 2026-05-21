"use client";

import Modal from "@/components/ui/Modal";
import DeleteButton from "../buttons/DeleteButton";
import LogoutButton from "../buttons/LogoutButton";
import { AlertTriangle, LogOut } from "lucide-react";

interface ConfirmModalProps {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  button: "delete" | "logout";
}

export default function ConfirmModal({ title, onConfirm, onCancel, loading, button }: Readonly<ConfirmModalProps>) {
  return (
    <Modal onClose={onCancel} size="sm">
      <div className="px-2 text-center">
        <div className="flex flex-col items-center mb-5">
          <div className={`p-4 rounded-full border-2 ${
            button === "delete" 
              ? "border-red-500/25 bg-red-500/5 text-red-500 shadow-lg shadow-red-500/5" 
              : "border-[var(--accent)]/25 bg-[var(--accent)]/5 text-[var(--accent)] shadow-lg shadow-[var(--accent)]/5"
          }`}>
            {button === "delete" ? <AlertTriangle size={30} /> : <LogOut size={30} />}
          </div>
        </div>
        <h2 className="text-lg font-bold mb-6 text-[var(--foreground)] leading-snug">
          {title}
        </h2>
        <div className="flex justify-center mt-6">
          {button === "delete" ? (
            <DeleteButton id="btn-confirm-delete" onClick={onConfirm} loading={loading} />
          ) : (
            <LogoutButton id="btn-confirm-logout" onClick={onConfirm} loading={loading} />
          )}
        </div>
      </div>
    </Modal>
  );
}
