import { getProductById } from "@/lib/repository/products";
import ProductoDetailClient from "./ProductoDetailClient";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductoDetailPage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);
  const product = isNaN(numId) ? null : await getProductById(numId);

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <AlertCircle className="w-12 h-12 text-[var(--accent)] mb-4" />
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Producto no encontrado</h1>
        <p className="text-sm text-[var(--foreground)]/60 mb-6">
          El producto que estás buscando no existe o fue eliminado del catálogo.
        </p>
        <Link
          href="/productos"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--accent)] text-black font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a productos
        </Link>
      </div>
    );
  }

  return <ProductoDetailClient initialProduct={product} />;
}
