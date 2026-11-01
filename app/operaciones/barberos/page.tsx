import { redirect } from "next/navigation";
import { getBarbersWithPrivateFields } from "@/lib/repository/barbers";
import { isServerFeatureEnabled } from "@/lib/flags/server";
import BackButton from "@/components/ui/BackButton";
import AdminBarberosClient from "./AdminBarberosClient";

export const revalidate = 0; // Don't cache admin page

export default async function AdminBarberosPage() {
  if (!(await isServerFeatureEnabled("staff_management"))) redirect("/admin?tab=turnos");
  const barbers = await getBarbersWithPrivateFields();

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
