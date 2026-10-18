import { getBarbers } from "@/lib/repository/barbers";
import { getServices } from "@/lib/repository/services";
import TurnosClient from "./TurnosClient";

export const revalidate = 60;

export default async function TurnosPage() {
  const [barbers, services] = await Promise.all([
    getBarbers(),
    getServices(),
  ]);

  return (
    <TurnosClient initialBarbers={barbers} initialServices={services} />
  );
}