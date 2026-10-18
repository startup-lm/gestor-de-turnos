"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/card/Card";
import { Service } from "@/lib/types/Services";
import { deleteService } from "@/lib/repository/services";
import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "@/lib/store/useToastStore";
import { Plus } from "lucide-react";

interface Props {
  services: Service[];
}

export default function ServiciosClient({ services }: Readonly<Props>) {
  const router = useRouter();
  const { role } = useAuth();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const success = await deleteService(id);
      if (success) {
        toast.success("Servicio eliminado con éxito");
        router.refresh();
      } else {
        toast.error("Error al eliminar el servicio");
      }
    } catch (err) {
      console.error("Error eliminando servicio:", err);
      toast.error("Error inesperado al eliminar el servicio");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-6 md:gap-8 justify-center w-full max-w-[1720px] mx-auto">
      {role === "admin" && (
        <Link
          href="/servicios/nuevo"
          className="flex flex-col items-center justify-center w-[320px] h-[348px] !bg-[var(--foreground)]/5 backdrop-blur-md !border-2 !border-dashed !border-[var(--accent)]/30 hover:!border-[var(--accent)]/80 rounded-2xl p-6 hover:shadow-lg hover:shadow-[var(--accent)]/5 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
        >
          <div className="bg-[var(--accent)]/10 p-4 rounded-full mb-4 border border-[var(--accent)]/20 group-hover:scale-110 transition-transform duration-300 text-[var(--accent)]">
            <Plus className="w-8 h-8" />
          </div>
          <span className="text-lg font-bold text-[var(--accent)] tracking-wide">
            Agregar Servicio
          </span>
          <span className="text-xs text-[var(--foreground)]/40 mt-1">
            Crear nuevo servicio en el catálogo
          </span>
        </Link>
      )}

      {services.map((svc) => (
        <div key={svc.id} className="relative">
          <Card
            title={svc.name}
            price={svc.price}
            description={svc.description}
            image={svc.image}
            onEdit={() => router.push(`/servicios/${svc.id}`)}
            onDelete={() => handleDelete(svc.id)}
            onCardClick={() => router.push(`/servicios/${svc.id}`)}
            isDeleting={deletingId === svc.id}
          />
        </div>
      ))}
    </div>
  );
}
