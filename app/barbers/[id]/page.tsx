import { redirect } from "next/navigation";
import { requireBarberOrAdmin } from "@/lib/api/auth";
import { getBarberByIdWithPrivateFields } from "@/lib/repository/barbers";
import BarberClient from "./BarberClient";

// Perfil con datos privados (email, comisiones): se renderiza por pedido, nunca se cachea.
export const dynamic = "force-dynamic";

export default async function BarberPage({ params, }: { params: Promise<{ id: string }>; }) {
  const { id } = await params;
  const staff = await requireBarberOrAdmin();
  if (!staff) redirect(`/login?redirect=/barbers/${id}`);

  // Un barbero solo puede ver su propio perfil; el admin puede ver todos
  if (staff.barber.role !== "admin" && staff.barber.id !== Number(id)) {
    redirect(`/barbers/${staff.barber.id}`);
  }

  const barber = await getBarberByIdWithPrivateFields(Number(id));
  return <BarberClient barber={barber} />;
}
