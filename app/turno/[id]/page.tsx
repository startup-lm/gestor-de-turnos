import { getAppointmentById } from "@/lib/repository/appointments";
import TurnoDetailClient from "./TurnoDetailClient";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TurnoDetailPage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);
  const appointment = isNaN(numId) ? null : await getAppointmentById(numId);

  if (!appointment) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <AlertCircle className="w-12 h-12 text-[var(--accent)] mb-4" />
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Turno no encontrado</h1>
        <p className="text-sm text-[var(--foreground)]/60 mb-6">
          El turno que estás buscando no existe o fue cancelado/eliminado del sistema.
        </p>
        <Link
          href="/admin?tab=turnos"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl !bg-[var(--accent)] hover:!bg-[#E8CA8C] !text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Turnos
        </Link>
      </div>
    );
  }

  return <TurnoDetailClient initialAppointment={appointment} />;
}
