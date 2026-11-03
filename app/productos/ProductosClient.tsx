"use client";

import { useRouter } from "next/navigation";
import Card from "@/components/card/Card";
import { Product } from "@/lib/types/Product";

interface Props {
  products: Product[];
}

/** Catálogo público: solo lectura. El alta y la edición viven en /admin. */
export default function ProductosClient({ products }: Readonly<Props>) {
  const router = useRouter();

  return (
    <div className="w-full flex flex-col items-center">
      {/* Cabecera Principal */}
      <div className="mb-8 md:mb-10 w-full max-w-2xl text-center mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--foreground)]">
          Nuestros productos
        </h1>
        <p className="text-sm md:text-base text-slate-400 mt-2 px-2">
          Línea exclusiva de pomadas, ceras y cuidado capilar seleccionados por nuestros barberos
        </p>
      </div>

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
                onCardClick={() => router.push(`/productos/${p.id}`)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
