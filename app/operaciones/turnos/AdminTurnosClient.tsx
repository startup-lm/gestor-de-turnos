"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Appointment } from "@/lib/types/Appointment";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatPhoneDisplay, normalizePhone } from "@/utils/phone";
import { Receipt } from "lucide-react";
import { useBusinessContext } from "@/lib/context/BusinessContext";

interface Props {
  appointments: Appointment[];
}

export default function AdminTurnosClient({ appointments }: Readonly<Props>) {
  const router = useRouter();
  const { isEnabled } = useBusinessContext();
  const ARCA_ENABLED = isEnabled("arca");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAppointments = appointments.filter((appt) => {
    const searchLower = searchTerm.toLowerCase().trim();
    const cleanSearchDigits = searchTerm.replace(/\D/g, "");
    const clientMatch = appt.client.toLowerCase().includes(searchLower);
    const barberMatch = appt.barbers?.name?.toLowerCase().includes(searchLower);

    const cleanApptDigits = appt.phone?.replace(/\D/g, "") || "";
    const apptNational = appt.phone ? normalizePhone(appt.phone).national : "";
    const phoneMatch = cleanSearchDigits.length >= 2
      ? cleanApptDigits.includes(cleanSearchDigits) || apptNational.includes(cleanSearchDigits)
      : (appt.phone ? appt.phone.toLowerCase().includes(searchLower) : false);

    return clientMatch || phoneMatch || barberMatch;
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por cliente, celular o barbero..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-md p-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none transition-all shadow-inner"
        />
        <div className="text-xs text-slate-400 font-semibold bg-[var(--foreground)]/5 px-3 py-1.5 rounded-lg border border-[var(--foreground)]/10">
          {filteredAppointments.length} {filteredAppointments.length === 1 ? "turno encontrado" : "turnos encontrados"}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] shadow-md bg-[var(--background)]">
        <table className="w-full text-left text-xs md:text-sm whitespace-nowrap">
          <thead className="bg-slate-900/80 text-slate-300 text-[11px] font-bold tracking-wider border-b border-[var(--border)]">
            <tr>
              <th className="px-4 py-3.5">Fecha</th>
              <th className="px-4 py-3.5">Horario</th>
              <th className="px-4 py-3.5">Cliente</th>
              <th className="px-4 py-3.5">Celular</th>
              <th className="px-4 py-3.5">Barbero</th>
              <th className="px-4 py-3.5">Servicio</th>
              <th className="px-4 py-3.5">Precio</th>
              <th className="px-4 py-3.5 text-center">Estado</th>
              {ARCA_ENABLED && <th className="px-4 py-3.5 text-center">Factura</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]/60 text-[var(--foreground)]">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appt) => {
                // Ensure date string is parsed correctly
                const dateParts = appt.date.split("-");
                const dateObj = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));

                return (
                  <tr
                    key={appt.id}
                    onClick={() => router.push(`/turno/${appt.id}`)}
                    className="hover:bg-white/10 active:scale-[0.99] transition-all cursor-pointer align-middle"
                  >
                    <td className="px-4 py-3 capitalize font-medium text-slate-200">
                      {format(dateObj, "EEE d MMM yyyy", { locale: es })}
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-semibold">
                      {appt.start_time} - {appt.end_time}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[var(--foreground)]">{appt.client}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{formatPhoneDisplay(appt.phone)}</td>
                    <td className="px-4 py-3 text-slate-300">{appt.barbers?.name || "-"}</td>
                    <td className="px-4 py-3 text-slate-300">{appt.services?.name || "-"}</td>
                    <td className="px-4 py-3 font-bold text-[var(--accent)]">
                      {appt.price ? `$${appt.price.toLocaleString("es-AR")}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs rounded-full font-bold border ${
                        appt.paid 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {appt.paid ? "Pagado" : "Pendiente"}
                      </span>
                    </td>
                    {ARCA_ENABLED && (
                      <td className="px-4 py-3 text-center">
                        {appt.arca_invoice_id ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-medium whitespace-nowrap">
                            <Receipt className="w-3 h-3" />
                            Emitida
                          </span>
                        ) : (
                          <span className="text-[var(--foreground)]/30 text-xs">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={ARCA_ENABLED ? 9 : 8} className="px-4 py-10 text-center text-slate-400">
                  No se encontraron turnos con los criterios de búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
