import AdminTurnosClient from "./AdminTurnosClient";
import BackButton from "@/components/ui/BackButton";

export const revalidate = 0; // Don't cache admin page

export default async function AdminTurnosPage() {
  const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  // We fetch all appointments (non-deleted). For a huge DB, we'd add pagination or date filters.
  const res = await fetch(`${BASE}/api/appointments`, { cache: "no-store" });
  const appointments = res.ok ? await res.json() : [];

  return (
    <div className="p-2 sm:p-5 flex flex-col items-center w-full">
      <div className="w-full max-w-[1400px] mb-4">
        <BackButton href="/admin" label="Panel Admin" />
      </div>
      <h1 className="text-3xl font-bold mb-5">Gestión de Turnos</h1>
      <AdminTurnosClient appointments={appointments} />
    </div>
  );
}
