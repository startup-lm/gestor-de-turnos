import { getBarbers } from "@/lib/repository/barbers";
import DashboardClient from "./DashboardClient";

export const revalidate = 60;

export default async function DashboardPage() {
  const barbers = await getBarbers();
  return <DashboardClient initialBarbers={barbers} />;
}
