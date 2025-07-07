"use client";

import Modal from "@/components/ui/Modal";
import DeleteButton from "../buttons/DeleteButton";
import LogoutButton from "../buttons/LogoutButton";

interface ConfirmModalProps {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  button: "delete" | "logout";
}

export default function ConfirmModal({ title, onConfirm, onCancel,loading,button }: Readonly<ConfirmModalProps>) {
  return (
    <Modal onClose={onCancel}>
      <div className="px-4">
        <h2 className="text-xl font-semibold mb-4">
          {title}
        </h2>
        <div className="flex justify-center mt-10">
          {button === "delete" ? (
            <DeleteButton onClick={onConfirm} loading={loading} />
          ) : (
            <LogoutButton onClick={onConfirm} loading={loading} />
          )}
        </div>
      </div>
    </Modal>
  );
}
