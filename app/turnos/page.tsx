import { getBarbers } from "@/lib/repository/barbers";
import TurnosClient from "./TurnosClient";

export const revalidate = 60;

export default async function TurnosPage() {
  const barbers = await getBarbers();
  return <TurnosClient initialBarbers={barbers} />;
}