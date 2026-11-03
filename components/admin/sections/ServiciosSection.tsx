"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Loader2 } from "lucide-react";
import { Service } from "@/lib/types/Services";
import { getServices } from "@/lib/repository/services";
import ServiceForm from "@/components/admin/catalog/ServiceForm";
import logo from "@/public/images/logo.png";

type ViewMode = { mode: "list" } | { mode: "create" } | { mode: "edit"; service: Service };

export default function ServiciosSection() {
  const [view, setView] = useState<ViewMode>({ mode: "list" });
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const loadServices = useCallback(async () => {
    setLoading(true);
    setServices(await getServices());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const backToList = () => setView({ mode: "list" });
  const afterSave = () => {
    backToList();
    loadServices();
  };

  if (view.mode !== "list") {
    return (
      <ServiceForm
        key={view.mode === "edit" ? view.service.id : "new"}
        service={view.mode === "edit" ? view.service : undefined}
        onBack={backToList}
        onSaved={afterSave}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Servicios</h2>
          <p className="text-xs text-slate-400 mt-1">Servicios que se pueden reservar, con su precio y duración</p>
        </div>
        <button
          type="button"
          onClick={() => setView({ mode: "create" })}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl !bg-[var(--accent)] hover:!bg-[var(--accent-hover)] !text-slate-950 font-bold text-sm shadow-md shadow-[var(--accent)]/15 transition-all hover:scale-105 active:scale-95 cursor-pointer self-start sm:self-auto min-h-[44px]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nuevo servicio</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
        </div>
      ) : services.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-16">
          Todavía no cargaste servicios. Creá el primero para poder tomar turnos.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] shadow-md bg-[var(--background)]">
          <table className="w-full text-left text-xs md:text-sm whitespace-nowrap">
            <thead className="bg-slate-900/80 text-slate-300 text-[11px] font-bold tracking-wider border-b border-[var(--border)]">
              <tr>
                <th className="px-4 py-3.5">Servicio</th>
                <th className="px-4 py-3.5">Precio</th>
                <th className="px-4 py-3.5">Duración</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/60 text-[var(--foreground)]">
              {services.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setView({ mode: "edit", service: p })}
                  className="hover:bg-white/10 transition-colors cursor-pointer align-middle"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-900 flex-shrink-0">
                        <Image
                          src={p.image || logo}
                          alt=""
                          fill
                          sizes="40px"
                          className={p.image ? "object-cover" : "object-contain p-1.5 opacity-40"}
                        />
                      </div>
                      <span className="font-semibold">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">${Number(p.price).toLocaleString("es-AR")}</td>
                  <td className="px-4 py-3">
                    <span className="text-slate-300">{p.duration || 30} min</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
