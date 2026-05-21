"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { usePopup } from "@/lib/hooks/usePopup";
import PopupModal from "@/components/ui/PopupModal";
import Spinner from "@/components/loading/Spinner";
import SaveButton from "@/components/buttons/SaveButton";
import { Shuffle, Scale, Crown, Briefcase, CheckCircle2 } from "lucide-react";

interface Props {
  onClose: () => void;
}

type CriteriaOption = "random" | "balanced" | "prioritize_admin" | "prioritize_barber";

export default function AssignmentSettingsModal({ onClose }: Readonly<Props>) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [criteria, setCriteria] = useState<CriteriaOption>("random");
  const [originalCriteria, setOriginalCriteria] = useState<CriteriaOption>("random");
  const popup = usePopup();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/business-settings");
        if (res.ok) {
          const data = await res.json();
          const val = data.assignment_criteria || "random";
          setCriteria(val);
          setOriginalCriteria(val);
        }
      } catch {
        console.error("Failed to fetch settings");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/business-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignment_criteria: criteria }),
      });

      if (res.ok) {
        popup.open("Criterio de asignación guardado con éxito", true);
        setTimeout(() => onClose(), 1500);
      } else {
        popup.open("Error al guardar la configuración", false);
      }
    } catch {
      popup.open("Error al conectar con el servidor", false);
    } finally {
      setSaving(false);
    }
  };

  const options = [
    {
      id: "random" as CriteriaOption,
      label: "Aleatorio",
      description: "Asignación al azar entre todos los barberos libres en el horario elegido. Es la forma clásica y mantiene la rotación viva.",
      icon: Shuffle,
      badge: "Recomendado",
      badgeColor: "!bg-[rgba(223,186,115,0.1)] !text-[var(--accent)] !border-[rgba(223,186,115,0.2)]",
    },
    {
      id: "balanced" as CriteriaOption,
      label: "Equitativo (Balanceado)",
      description: "Prioriza automáticamente al barbero que menos turnos tenga agendados para ese día. Mantiene el volumen de trabajo equilibrado.",
      icon: Scale,
    },
    {
      id: "prioritize_admin" as CriteriaOption,
      label: "Priorizar Dueño / Admin",
      description: "Prioriza llenar las agendas de los barberos con rol 'admin'. Ideal para asegurar que los dueños llenen sus horas primero.",
      icon: Crown,
    },
    {
      id: "prioritize_barber" as CriteriaOption,
      label: "Priorizar Empleados",
      description: "Prioriza llenar las agendas de los empleados con rol 'barber'. Te permite delegar el trabajo operativo del día a día.",
      icon: Briefcase,
    },
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <Modal onClose={onClose} size="lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white">Criterio de Asignación Automática</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
            Configurá cómo querés que el sistema asigne un barbero cuando el cliente elija la opción <strong>&quot;No tengo preferencia&quot;</strong>.
          </p>
        </div>

        <div className="space-y-6 px-2 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = criteria === opt.id;

              return (
                <button
                  key={opt.id}
                  onClick={() => setCriteria(opt.id)}
                  className={`
                    !relative !flex !flex-col !p-5 !rounded-2xl !text-left !transition-all !duration-300 group !overflow-hidden !border !cursor-pointer !select-none
                    ${
                      isSelected
                        ? "!bg-[rgba(223,186,115,0.08)] !border-[var(--accent)] !shadow-[0_0_15px_rgba(223,186,115,0.15)]"
                        : "!bg-[#131c33] !border-slate-800 hover:!bg-[#1b2747] hover:!border-slate-700"
                    }
                  `}
                >
                  <div className="flex items-start justify-between w-full mb-3">
                    <div className={`p-3 !rounded-xl transition-all duration-300 ${
                      isSelected 
                        ? "!bg-[rgba(223,186,115,0.15)] !text-[var(--accent)]" 
                        : "!bg-slate-950/40 !text-slate-400 group-hover:!text-[var(--accent)] group-hover:!bg-[rgba(223,186,115,0.08)]"
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-[var(--accent)] animate-in zoom-in-50 duration-200" />
                    )}
                    {!isSelected && opt.badge && (
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${opt.badgeColor}`}>
                        {opt.badge}
                      </span>
                    )}
                  </div>

                  <h3 className={`text-base font-bold mb-1.5 ${isSelected ? "!text-[var(--accent)]" : "!text-white"}`}>
                    {opt.label}
                  </h3>
                  <p className="text-xs !text-slate-400 group-hover:!text-slate-300 leading-relaxed font-medium">
                    {opt.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="flex justify-center pt-6 mt-4 border-t border-slate-800">
            <div className="w-[200px]">
              <SaveButton
                onClick={handleSave}
                disabled={saving || criteria === originalCriteria}
                loading={saving}
              />
            </div>
          </div>
        </div>
      </Modal>

      {popup.show && (
        <PopupModal message={popup.message} success={popup.success} onClose={popup.close} />
      )}
    </>
  );
}
