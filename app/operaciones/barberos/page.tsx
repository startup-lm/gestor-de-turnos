import { getBarbers } from "@/lib/repository/barbers";
import BackButton from "@/components/ui/BackButton";
import AdminBarberosClient from "./AdminBarberosClient";

export const revalidate = 0; // Don't cache admin page

export default async function AdminBarberosPage() {
  const barbers = await getBarbers();

  return (
    <div className="p-5 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <BackButton href="/operaciones" label="Operaciones" />
      </div>
      <h1 className="text-3xl font-extrabold mb-5 text-center bg-gradient-to-r from-[var(--foreground)] via-[var(--foreground)] to-[var(--accent)] bg-clip-text text-transparent tracking-tight">
        Gestión de barberos
      </h1>
      <AdminBarberosClient barbers={barbers} />
    </div>
  );
}
