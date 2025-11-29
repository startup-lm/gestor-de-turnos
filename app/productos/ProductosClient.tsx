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

interface Props {
  products: Product[];
}

export default function ProductosClient({ products }: Readonly<Props>) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
