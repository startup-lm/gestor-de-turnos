"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/card/Card";
import { Product } from "@/lib/types/Product";
import { deleteProduct } from "@/lib/repository/products";
import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "@/lib/store/useToastStore";
import { Plus } from "lucide-react";

interface Props {
  products: Product[];
}

export default function ProductosClient({ products }: Readonly<Props>) {
  const router = useRouter();
  const { role } = useAuth();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const success = await deleteProduct(id);
      if (success) {
        toast.success("Producto eliminado con éxito");
        router.refresh();
      } else {
        toast.error("Error al eliminar el producto");
      }
    } catch (err) {
      console.error("Error eliminando producto:", err);
      toast.error("Error inesperado al eliminar el producto");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-6 md:gap-8 justify-center w-full max-w-[1720px] mx-auto">
      {role === "admin" && (
        <Link
          href="/productos/nuevo"
          className="flex flex-col items-center justify-center w-[320px] h-[348px] !bg-[var(--foreground)]/5 backdrop-blur-md !border-2 !border-dashed !border-[var(--accent)]/30 hover:!border-[var(--accent)]/80 rounded-2xl p-6 hover:shadow-lg hover:shadow-[var(--accent)]/5 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
        >
          <div className="bg-[var(--accent)]/10 p-4 rounded-full mb-4 border border-[var(--accent)]/20 group-hover:scale-110 transition-transform duration-300 text-[var(--accent)]">
            <Plus className="w-8 h-8" />
          </div>
          <span className="text-lg font-bold text-[var(--accent)] tracking-wide">
            Agregar Producto
          </span>
          <span className="text-xs text-[var(--foreground)]/40 mt-1">
            Crear nuevo producto en el catálogo
          </span>
        </Link>
      )}

      {products.map((p) => (
        <div key={p.id} className="relative">
          <Card
            title={p.name}
            price={p.price}
            description={p.description}
            image={p.image}
            onEdit={() => router.push(`/productos/${p.id}`)}
            onDelete={() => handleDelete(p.id)}
            onCardClick={() => router.push(`/productos/${p.id}`)}
            isDeleting={deletingId === p.id}
          />
        </div>
      ))}
    </div>
  );
}
