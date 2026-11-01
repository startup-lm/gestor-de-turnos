import { getBarbersWithPrivateFields } from "@/lib/repository/barbers";
import AdminClient from "./AdminClient";

export const revalidate = 0;

export default async function AdminPage() {
  const barbers = await getBarbersWithPrivateFields();

  return <AdminClient barbers={barbers} />;
}
