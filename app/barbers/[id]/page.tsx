import { getBarberById } from "@/lib/repository/barbers";
import BarberClient from "./BarberClient";

export const revalidate = 60;

export default async function BarberPage({ params, }: { params: Promise<{ id: string }>; }) {
  const { id } = await params;
  const barber = await getBarberById(Number(id));
  return <BarberClient barber={barber} />;
}
