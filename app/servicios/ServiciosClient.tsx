"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/card/Card";
import EditCardModal from "@/components/card/EditCardModal";
import { Service } from "@/lib/types/Services";
import { usePopup } from "@/lib/hooks/usePopup";
import { deleteService } from "@/lib/repository/services";
import ConfirmModal from "@/components/ui/ConfirmModal";
import PopupModal from "@/components/ui/PopupModal";
import CreateCardModal from "@/components/card/CreateCardModal";
import { useAuth } from "@/lib/auth/AuthContext";

interface Props {
  services: Service[];
}

export default function ServiciosClient({ services }: Readonly<Props>) {
  const router = useRouter();
  const { role } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const popup = usePopup();

  const handleEdit = (id: number) => {
    const svc = services.find(s => s.id === id);
    if (!svc) return;
    setSelectedName(svc.name);
    setSelectedId(id);
    setIsEditModalOpen(true);
  };

  const handleDelete = async () => {
    setLoading(true);
    const success = await deleteService(selectedId!);
    popup.open(success ? "Servicio eliminado con éxito" : "Error al eliminar el Servicio", success);
    setLoading(false);
    setConfirmModal(false);
  };

  return (
    <>


      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 justify-center">
        {role !== "guest" && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--primary)]/50 rounded-2xl p-6 h-full min-h-[300px] hover:bg-[var(--primary)]/5 transition-all group hover:border-[var(--primary)]"
          >
            <div className="bg-[var(--primary)]/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary)]"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
            </div>
            <span className="text-lg font-bold text-[var(--primary)]">Agregar Servicio</span>
          </button>
        )}
        {services.map(svc => (
          <div key={svc.id} className="relative" >
            <Card
              title={svc.name}
              price={svc.price}
              description={svc.description}
              image={svc.image}
              onEdit={() => handleEdit(svc.id)}
              onDelete={() => {
                setSelectedId(svc.id);
                setConfirmModal(true);
              }}
              onCardClick={() => router.push("/turnos")}
            />
          </div>
        ))}
      </div>

      {isCreateModalOpen && (
        <CreateCardModal
          type="Servicio"
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {isEditModalOpen && selectedId !== null && (
        <EditCardModal
          id={selectedId}
          name={selectedName}
          description={services.find(s => s.id === selectedId)?.description ?? ""}
          price={services.find(s => s.id === selectedId)?.price ?? 0}
          duration={services.find(s => s.id === selectedId)?.duration ?? 30}
          image={services.find((s) => s.id === selectedId)?.image ?? null}
          type="Servicio"
          onClose={() => setIsEditModalOpen(false)}
          onSave={() => {
            setIsEditModalOpen(false);
            router.refresh();
          }}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          title={`¿Estás seguro que querés eliminar este servicio?`}
          onConfirm={handleDelete}
          onCancel={() => {
            popup.close();
            setConfirmModal(false);
          }}
          loading={loading}
          button="delete"
        />
      )}

      {popup.show && (
        <PopupModal message={popup.message} success={popup.success}
          onClose={() => {
            popup.close();
            if (popup.success) router.refresh();
          }}
        />
      )}
    </>
  );
}
