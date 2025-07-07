"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/card/Card";
import EditCardModal from "@/components/card/EditCardModal";
import { Service } from "@/lib/types/Services";
import { useAuth } from "@/lib/auth/AuthContext";
import { usePopup } from "@/lib/hooks/usePopup";
import { deleteService } from "@/lib/repository/services";
import ConfirmModal from "@/components/ui/ConfirmModal";
import PopupModal from "@/components/ui/PopupModal";

interface Props {
  services: Service[];
}

export default function ServiciosClient({ services }: Readonly<Props>) {
  const { role } = useAuth();
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
        {services.map(svc =>
          svc.id === 5 && role !== "admin" ? null : (
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
              />
            </div>
          )
        )}
      </div>

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
