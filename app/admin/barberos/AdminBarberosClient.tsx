"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Barber } from "@/lib/types/Barbers";
import SignupModal from "@/components/auth/SignupModal";
import EditBarberModal from "@/components/auth/EditBarberModal";
import { updateBarber } from "@/lib/repository/barbers";
import { usePopup } from "@/lib/hooks/usePopup";
import ConfirmModal from "@/components/ui/ConfirmModal";
import PopupModal from "@/components/ui/PopupModal";
import DeleteCardButton from "@/components/card/DeleteCardButton";
import EditCardButton from "@/components/card/EditCardButton";
import Image from "next/image";
import logo from "@/public/images/logo.png";

interface Props {
  barbers: Barber[];
}

export default function AdminBarberosClient({ barbers }: Readonly<Props>) {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const popup = usePopup();

  const handleEdit = (id: number) => {
    setSelectedId(id);
    setIsEditModalOpen(true);
  };

  const handleDelete = async () => {
    if (selectedId === null) return;
    setLoading(true);
    const success = await updateBarber(selectedId, { active: false });
    popup.open(success ? "Barbero deshabilitado con éxito" : "Error al deshabilitar el Barbero", success);
    setLoading(false);
    setConfirmModal(false);
    if (success) router.refresh();
  };

  // If we only want admins to see this view, we could redirect or hide elements,
  // but this page is already protected by middleware or layout potentially.

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 justify-center">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--primary)]/50 rounded-2xl p-6 h-full min-h-[300px] hover:bg-[var(--primary)]/5 transition-all group hover:border-[var(--primary)]"
        >
          <div className="bg-[var(--primary)]/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary)]"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
          </div>
          <span className="text-lg font-bold text-[var(--primary)]">Agregar Barbero</span>
        </button>
        {barbers.map((barber) => (
          <div key={barber.id} className="relative bg-[var(--accent)] border border-[var(--primary)] rounded-xl p-4 shadow flex flex-col items-center justify-center text-center">
            
            <div className="absolute top-2 left-2 flex space-x-2">
              <DeleteCardButton onDelete={() => { setSelectedId(barber.id!); setConfirmModal(true); }} />
            </div>
            <div className="absolute top-2 right-2 flex space-x-2">
              <EditCardButton onEdit={() => handleEdit(barber.id!)} />
            </div>

            <div className="w-24 h-24 mt-4 rounded-full overflow-hidden bg-[var(--background)] mb-4 border-2 border-[var(--primary)] flex items-center justify-center">
              <Image
                alt={barber.name}
                src={(barber.image && barber.image !== "null" && barber.image !== "") ? barber.image : logo}
                width={96}
                height={96}
                className="object-cover w-full h-full"
              />
            </div>
            <h3 className="text-xl font-bold !text-black">{barber.name}</h3>
            
            <div className="mt-4 flex flex-col gap-2 items-center w-full px-4">
              <span className={`px-4 py-1.5 text-xs w-fit text-center rounded-full font-semibold ${barber.active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                {barber.active ? "Activo" : "Inactivo"}
              </span>
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-4 py-1.5 text-xs w-fit text-center rounded-full font-semibold">
                Corte: {((barber.commission ?? 0) * 100).toFixed(0)}%
              </span>
              <span className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-4 py-1.5 text-xs w-fit text-center rounded-full font-semibold">
                Venta: {((barber.sale_commission ?? 0) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {isAddModalOpen && (
        <SignupModal onClose={() => { setIsAddModalOpen(false); router.refresh(); }} />
      )}

      {isEditModalOpen && selectedId !== null && (
        <EditBarberModal barberId={selectedId} onClose={() => { setIsEditModalOpen(false); router.refresh(); }} />
      )}

      {confirmModal && (
        <ConfirmModal
          title={`¿Estás seguro que querés deshabilitar a este barbero?`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmModal(false)}
          loading={loading}
          button="delete"
        />
      )}

      {popup.show && (
        <PopupModal message={popup.message} success={popup.success} onClose={popup.close} />
      )}
    </div>
  );
}
