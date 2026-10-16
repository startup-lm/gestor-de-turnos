"use client";

import { useState } from "react";
import { Appointment } from "@/lib/types/Appointment";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  appointments: Appointment[];
}

export default function AdminTurnosClient({ appointments }: Readonly<Props>) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAppointments = appointments.filter((appt) => {
    const searchLower = searchTerm.toLowerCase();
    const clientMatch = appt.client.toLowerCase().includes(searchLower);
    const phoneMatch = appt.phone?.includes(searchTerm);
    const barberMatch = appt.barbers?.name?.toLowerCase().includes(searchLower);
    return clientMatch || phoneMatch || barberMatch;
  });

  return (
    <div className="w-full max-w-[1400px] mx-auto px-2 md:px-4">
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Buscar por cliente, celular o barbero..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md p-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)]"
        />
        <div className="text-sm text-gray-500 font-medium">
          {filteredAppointments.length} turnos encontrados
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)] shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[var(--card)] text-[var(--foreground)] uppercase font-semibold border-b border-[var(--border)]">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Hora</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Celular</th>
              <th className="px-4 py-3">Barbero</th>
              <th className="px-4 py-3">Servicio</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] bg-[var(--background)] text-[var(--foreground)]">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appt) => {
                // Ensure date string is parsed correctly
                const dateParts = appt.date.split("-");
                const dateObj = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));

                return (
                  <tr key={appt.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 capitalize">
                      {format(dateObj, "EEE d MMM yyyy", { locale: es })}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {appt.start_time} - {appt.end_time}
                    </td>
                    <td className="px-4 py-3">{appt.client}</td>
                    <td className="px-4 py-3">{appt.phone || "-"}</td>
                    <td className="px-4 py-3">{appt.barbers?.name || "-"}</td>
                    <td className="px-4 py-3">{appt.services?.name || "-"}</td>
                    <td className="px-4 py-3">
                      {appt.price ? `$${appt.price.toLocaleString("es-AR")}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${appt.paid ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                        {appt.paid ? "Pagado" : "Pendiente"}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No se encontraron turnos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
