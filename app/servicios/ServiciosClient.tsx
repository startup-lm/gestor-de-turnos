"use client";

import { useRouter } from "next/navigation";
import Card from "@/components/card/Card";
import { Service } from "@/lib/types/Services";

interface Props {
  services: Service[];
}

/** Catálogo público: solo lectura. El alta y la edición viven en /admin. */
export default function ServiciosClient({ services }: Readonly<Props>) {
  const router = useRouter();

  return (
    <div className="w-full flex flex-col items-center">
      {/* Cabecera Principal */}
      <div className="mb-8 md:mb-10 w-full max-w-2xl text-center mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--foreground)]">
          Nuestros servicios
        </h1>
        <p className="text-sm md:text-base text-slate-400 mt-2 px-2">
          Cortes clásicos, perfilado de barba con toalla caliente y tratamientos exclusivos
        </p>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-16 px-4">
          <p className="text-slate-400 text-sm">
            No hay servicios cargados en el catálogo en este momento.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-6 md:gap-8 justify-center w-full max-w-[1720px] mx-auto">
          {services.map((svc) => (
            <div key={svc.id} className="relative">
              <Card
                title={svc.name}
                price={svc.price}
                description={svc.description}
                image={svc.image}
                onCardClick={() => router.push(`/servicios/${svc.id}`)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
