import { getSaleById } from "@/lib/repository/sales";
import VentaDetailClient from "./VentaDetailClient";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireBarberOrAdmin } from "@/lib/api/auth";
import { ArrowLeft, AlertCircle } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

// Datos de clientes: solo staff, se renderiza por pedido y nunca se cachea.
export const dynamic = "force-dynamic";

export default async function VentaDetailPage({ params }: Props) {
  const { id } = await params;
  const staff = await requireBarberOrAdmin();
  if (!staff) redirect(`/login?redirect=/venta/${id}`);

  const numId = Number(id);
  const sale = isNaN(numId) ? null : await getSaleById(numId);

  if (!sale) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <AlertCircle className="w-12 h-12 text-[var(--accent)] mb-4" />
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Venta no encontrada</h1>
        <p className="text-sm text-[var(--foreground)]/60 mb-6">
          La venta que estás buscando no existe o fue eliminada del sistema.
        </p>
        <Link
          href="/admin?tab=ventas"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl !bg-[var(--accent)] hover:!bg-[var(--accent-hover)] !text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Ventas
        </Link>
      </div>
    );
  }

  return <VentaDetailClient initialSale={sale} />;
}
