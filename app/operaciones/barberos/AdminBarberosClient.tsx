"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Barber } from "@/lib/types/Barbers";
import { useAuth } from "@/lib/auth/AuthContext";
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
  const { role, user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const popup = usePopup();

  useEffect(() => {
    if (role === "guest" && user) return;
    if (role && role !== "admin") {
      router.replace("/operaciones");
    }
  }, [role, user, router]);

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
          className="flex flex-col items-center justify-center w-[320px] h-[326px] !bg-[var(--foreground)]/5 backdrop-blur-md !border-2 !border-dashed !border-[var(--accent)]/30 hover:!border-[var(--accent)]/80 rounded-2xl p-6 hover:shadow-lg hover:shadow-[var(--accent)]/5 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
        >
          <div className="bg-[var(--accent)]/10 p-4 rounded-full mb-4 border border-[var(--accent)]/20 group-hover:scale-110 transition-transform duration-300 text-[var(--accent)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
          </div>
          <span className="text-lg font-bold text-[var(--accent)] tracking-wide">Agregar Barbero</span>
        </button>
        {barbers.map((barber) => (
          <div
            key={barber.id}
            className="relative w-[320px] h-[326px] border border-[var(--foreground)]/10 rounded-2xl p-4 flex flex-col items-center text-center bg-gradient-to-b from-[var(--foreground)]/8 to-[var(--foreground)]/4 backdrop-blur-md max-w-xs shadow-lg hover:border-[var(--accent)]/40 hover:shadow-xl hover:shadow-[var(--accent)]/5 hover:-translate-y-1 transition-all duration-300"
          >
            
            <div className="absolute top-3 left-3 z-10">
              <DeleteCardButton onDelete={() => { setSelectedId(barber.id!); setConfirmModal(true); }} />
            </div>
            <div className="absolute top-3 right-3 z-10">
              <EditCardButton onEdit={() => handleEdit(barber.id!)} />
            </div>

            <div className="w-40 h-40 relative mb-4 rounded-full overflow-hidden border border-[var(--foreground)]/5 shadow-md flex items-center justify-center bg-[var(--background)]">
              <Image
                alt={barber.name}
                src={(barber.image && barber.image !== "null" && barber.image !== "") ? barber.image : logo}
                fill
                className="object-cover transition-transform duration-500 hover:scale-105"
                sizes="160px"
              />
            </div>
            <h3 className="text-[var(--foreground)] mb-1.5 font-bold text-lg tracking-wide line-clamp-1 w-full">{barber.name}</h3>
            
            <div className="mt-auto mb-2 flex gap-1.5 items-center justify-center w-full px-2 flex-wrap">
              <span className={`px-2.5 py-1 text-[10px] rounded-full font-bold uppercase tracking-wider ${barber.active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {barber.active ? "Activo" : "Inactivo"}
              </span>
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 text-[10px] rounded-full font-bold uppercase tracking-wider">
                Corte: {((barber.commission ?? 0) * 100).toFixed(0)}%
              </span>
              <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 text-[10px] rounded-full font-bold uppercase tracking-wider">
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
