import { getBarbers } from "@/lib/repository/barbers";
import AdminClient from "./AdminClient";

export const revalidate = 0;

export default async function AdminPage() {
  const barbers = await getBarbers();

  return <AdminClient barbers={barbers} />;
}
