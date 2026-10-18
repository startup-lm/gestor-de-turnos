"use client";

import { useState, useEffect } from "react";
import { CalendarX } from "lucide-react";
import { Appointment } from "@/lib/types/Appointment";
import AdminTurnosClient from "@/app/operaciones/turnos/AdminTurnosClient";
import BlockDateModal from "@/components/admin/BlockDateModal";
import Spinner from "@/components/loading/Spinner";

export default function TurnosSection() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBlockModal, setShowBlockModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/appointments")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setAppointments(data);
        }
      })
      .catch((err) => console.error("Error al cargar turnos:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Gestión de Turnos
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Búsqueda, inspección y seguimiento de reservas
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowBlockModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold !bg-[var(--accent)]/15 !text-[var(--accent)] !border !border-[var(--accent)]/30 hover:!bg-[var(--accent)]/25 transition-all cursor-pointer active:scale-95"
        >
          <CalendarX className="w-4 h-4" />
          Bloquear Horarios
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <AdminTurnosClient appointments={appointments} />
      )}

      {showBlockModal && <BlockDateModal onClose={() => setShowBlockModal(false)} />}
    </div>
  );
}
