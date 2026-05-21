"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/card/Card";
import EditCardModal from "@/components/card/EditCardModal";
import { Product } from "@/lib/types/Product";
import { deleteProduct } from "@/lib/repository/products";
import { usePopup } from "@/lib/hooks/usePopup";
import ConfirmModal from "@/components/ui/ConfirmModal";
import PopupModal from "@/components/ui/PopupModal";
import CreateCardModal from "@/components/card/CreateCardModal";
import { useAuth } from "@/lib/auth/AuthContext";

interface Props {
  products: Product[];
}

export default function ProductosClient({ products }: Readonly<Props>) {
  const router = useRouter();
  const { role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const popup = usePopup();

  const handleEdit = (id: number) => {
    const prod = products.find((p) => p.id === id);
    if (!prod) return;
    setSelectedProduct(prod.name);
    setSelectedId(id);
    setIsEditModalOpen(true);
  };

  const handleDelete = async () => {
    setLoading(true);
    const success = await deleteProduct(selectedId!);
    popup.open(success ? "Producto eliminado con éxito" : "Error al eliminar el Producto", success);
    setLoading(false);
    setConfirmModal(false);
  };

  return (
    <>


      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 justify-center">
        {role !== "guest" && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex flex-col items-center justify-center w-[320px] h-[326px] !bg-[var(--foreground)]/5 backdrop-blur-md !border-2 !border-dashed !border-[var(--accent)]/30 hover:!border-[var(--accent)]/80 rounded-2xl p-6 hover:shadow-lg hover:shadow-[var(--accent)]/5 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
          >
            <div className="bg-[var(--accent)]/10 p-4 rounded-full mb-4 border border-[var(--accent)]/20 group-hover:scale-110 transition-transform duration-300 text-[var(--accent)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
            </div>
            <span className="text-lg font-bold text-[var(--accent)] tracking-wide">Agregar Producto</span>
          </button>
        )}
        {products.map((p) => (
          <div key={p.id} className="relative" >
            <Card
              title={p.name}
              price={p.price}
              description={p.description}
              image={p.image}
              onEdit={() => handleEdit(p.id)}
              onDelete={() => {
                setSelectedId(p.id);
                setConfirmModal(true);
              }}
            />
          </div>
        ))}
      </div>

      {isCreateModalOpen && (
        <CreateCardModal
          type="Producto"
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {isEditModalOpen && selectedId !== null && (
        <EditCardModal
          id={selectedId}
          name={selectedProduct}
          description={products.find((p) => p.id === selectedId)?.description ?? ""}
          price={products.find((p) => p.id === selectedId)?.price ?? 0}
          image={products.find((p) => p.id === selectedId)?.image ?? null}
          type="Producto"
          onClose={() => setIsEditModalOpen(false)}
          onSave={() => {
            setIsEditModalOpen(false);
            router.refresh();
          }}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          title={`¿Estás seguro que querés eliminar este producto?`}
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
