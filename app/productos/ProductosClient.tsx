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
    <div className="w-full flex flex-col items-center">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/40 pb-6 mb-8 md:mb-10 w-full">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--foreground)]">
            Nuestros Productos
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1.5">
            Línea exclusiva de pomadas, ceras y cuidado capilar seleccionados por nuestros barberos
          </p>
        </div>

        {role === "admin" && (
          <Link
            href="/productos/nuevo"
            data-testid="btn-add-product"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl !bg-[var(--accent)] hover:!bg-[#E8CA8C] !text-slate-950 font-bold text-sm shadow-md shadow-[var(--accent)]/15 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nuevo producto</span>
          </Link>
        )}
      </div>

      {/* Grilla de Productos */}
      {products.length === 0 ? (
        <div className="text-center py-16 px-4">
          <p className="text-slate-400 text-sm">
            No hay productos cargados en el catálogo en este momento.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-6 md:gap-8 justify-center w-full max-w-[1720px] mx-auto">
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
      )}
    </div>
  );
}
