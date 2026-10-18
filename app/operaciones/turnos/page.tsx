import AdminTurnosClient from "./AdminTurnosClient";
import BackButton from "@/components/ui/BackButton";

export const revalidate = 0; // Don't cache admin page

export default async function AdminTurnosPage() {
  const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  let appointments = [];
  try {
    const res = await fetch(`${BASE}/api/appointments`, { cache: "no-store" });
    if (res.ok) {
      const text = await res.text();
      if (text.trim().startsWith("[")) {
        appointments = JSON.parse(text);
      }
    }
  } catch (err) {
    console.error("AdminTurnosPage fetch error:", err);
  }

  return (
    <div className="p-4 md:p-8 flex flex-col items-center w-full max-w-[1720px] mx-auto">
      <div className="w-full mb-4">
        <BackButton href="/operaciones" label="Operaciones" />
      </div>
      <h1 className="text-3xl font-bold mb-5">Gestión de Turnos</h1>
      <AdminTurnosClient appointments={appointments} />
    </div>
  );
}
