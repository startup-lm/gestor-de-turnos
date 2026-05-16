import { getBarbers } from "@/lib/repository/barbers";
import BackButton from "@/components/ui/BackButton";
import AdminBarberosClient from "./AdminBarberosClient";

export const revalidate = 0; // Don't cache admin page

export default async function AdminBarberosPage() {
  const barbers = await getBarbers();

  return (
    <div className="p-5 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <BackButton href="/admin" label="Panel Admin" />
      </div>
      <h1 className="text-3xl font-bold mb-5">Gestión de Barberos</h1>
      <AdminBarberosClient barbers={barbers} />
    </div>
  );
}
