"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import PopupModal from "@/components/ui/PopupModal";
import Spinner from "@/components/loading/Spinner";
import { usePopup } from "@/lib/hooks/usePopup";
import SaveButton from "@/components/buttons/SaveButton";
import type { GlobalHours } from "@/lib/types/BusinessHours";
import type { BusinessSettings } from "@/lib/types/BusinessSettings";
import { getBusinessHours, upsertBusinessHours } from "@/lib/repository/businessHours";
import { getBusinessSettings, updateBusinessSettings } from "@/lib/repository/businessSettings";

const DAY_LABELS = ["Dom", "Lu", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function toMinutes(hhmmOrSec?: string | null): number | null {
  if (!hhmmOrSec) return null;
  const [H, M] = hhmmOrSec.split(":").map(Number);
  if (Number.isNaN(H) || Number.isNaN(M)) return null;
  return (H ?? 0) * 60 + (M ?? 0);
}

export default function BusinessHoursModal({ onClose }: { onClose: () => void }) {
  const [loadingFetch, setLoadingFetch] = useState(true);
  const [loading, setLoading] = useState(false);
  const [hours, setHours] = useState<GlobalHours>({ open_time: "", close_time: "", lunch_start: null, lunch_end: null, closed_days: [], });
  const [settings, setSettings] = useState<BusinessSettings>({ slot_step_minutes: 30 });
  const [lunchEnabled, setLunchEnabled] = useState(false);
  const [originalHours, setOriginalHours] = useState<GlobalHours | null>(null);
  const [originalSettings, setOriginalSettings] = useState<BusinessSettings | null>(null);
  const [originalLunchEnabled, setOriginalLunchEnabled] = useState(false);
  const popup = usePopup();
  useEffect(() => {
    (async () => {
      try {
        setLoadingFetch(true);
        const [h, s] = await Promise.all([getBusinessHours(), getBusinessSettings()]);
        if (h) {
          setHours(h);
          const hasLunch = Boolean(h.lunch_start && h.lunch_end);
          setLunchEnabled(hasLunch);
          setOriginalHours(h);
          setOriginalLunchEnabled(hasLunch);
        }
        const initialSettings = s ?? { slot_step_minutes: 30 };
        setSettings(initialSettings);
        setOriginalSettings(initialSettings);
      } finally {
        setLoadingFetch(false);
      }
    })();
  }, []);

  const toggleDay = (day: number) => {
    setHours((prev) => {
      const isClosed = prev.closed_days.includes(day);
      const closed_days = isClosed
        ? prev.closed_days.filter((d) => d !== day)
        : [...prev.closed_days, day].sort((a, b) => a - b);
      return { ...prev, closed_days };
    });
  };

  const onToggleLunch = (enabled: boolean) => {
    setLunchEnabled(enabled);
    if (!enabled) {
      setHours((prev) => ({ ...prev, lunch_start: null, lunch_end: null }));
    }
  };

  const isDisabled = useMemo(() => {
    const mOpen = toMinutes(hours.open_time);
    const mClose = toMinutes(hours.close_time);
    if (mOpen == null || mClose == null) return true;
    if (mOpen >= mClose) return true;
    if (lunchEnabled) {
      const hasStart = !!hours.lunch_start;
      const hasEnd = !!hours.lunch_end;
      if (hasStart !== hasEnd) return true;
      if (hasStart && hasEnd) {
        const mLs = toMinutes(hours.lunch_start)!;
        const mLe = toMinutes(hours.lunch_end)!;
        if (mLs >= mLe) return true;
        if (mOpen > mLs || mLe > mClose) return true;
      }
    }
    if (![15, 30, 45, 60].includes(settings.slot_step_minutes)) return true;
    if (hours.closed_days.length === 7) return true;
    return false;
  }, [hours, settings, lunchEnabled]);

  const hasChanges = useMemo(() => {
    if (!originalHours || !originalSettings) return false;
    
    // Compare closed_days
    const closedDaysChanged = JSON.stringify(hours.closed_days) !== JSON.stringify(originalHours.closed_days);
    
    // Compare times
    const openTimeChanged = hours.open_time !== originalHours.open_time;
    const closeTimeChanged = hours.close_time !== originalHours.close_time;
    
    // Compare lunch
    const lunchEnabledChanged = lunchEnabled !== originalLunchEnabled;
    const lunchStartChanged = hours.lunch_start !== originalHours.lunch_start;
    const lunchEndChanged = hours.lunch_end !== originalHours.lunch_end;
    
    // Compare slot settings
    const slotStepChanged = settings.slot_step_minutes !== originalSettings.slot_step_minutes;
    
    return (
      closedDaysChanged ||
      openTimeChanged ||
      closeTimeChanged ||
      lunchEnabledChanged ||
      lunchStartChanged ||
      lunchEndChanged ||
      slotStepChanged
    );
  }, [hours, settings, lunchEnabled, originalHours, originalSettings, originalLunchEnabled]);

  const isSaveDisabled = isDisabled || !hasChanges;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSaveDisabled) {
        setLoading(false);
        return;
      }
      const payload: GlobalHours = {
        ...hours,
        lunch_start: lunchEnabled ? hours.lunch_start : null,
        lunch_end: lunchEnabled ? hours.lunch_end : null,
      };
      await Promise.all([upsertBusinessHours(payload), updateBusinessSettings(settings)]);
      await fetch("/api/admin/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["business-hours", "business-settings"] }),
      });
      popup.open("Horario de atención guardado con éxito", true);
    } catch {
      popup.open("Error al guardar", false);
    } finally {
      setLoading(false);
    }
  };

  if (loadingFetch) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-50">
        <Spinner />
      </div>
    );
  }

  const fmt = (s: string | null) => (s ? s.slice(0, 5) : "");

  return (
    <>
      <Modal onClose={onClose} size="lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--foreground)]">Días y horario de atención</h2>

        <form onSubmit={handleSave} className="px-2 text-left space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">Apertura</label>
              <input
                id="biz-open-time"
                type="time"
                value={fmt(hours.open_time)}
                className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm h-[42px]"
                required
                onChange={(e) => setHours((prev) => ({ ...prev, open_time: `${e.target.value}:00` }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">Cierre</label>
              <input
                id="biz-close-time"
                type="time"
                value={fmt(hours.close_time)}
                className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm h-[42px]"
                required
                onChange={(e) => setHours((prev) => ({ ...prev, close_time: `${e.target.value}:00` }))}
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 h-[42px] mt-2">
              <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">Habilitar Almuerzo / Descanso</span>
              <div
                id="biz-lunch-enabled"
                role="button"
                onClick={() => onToggleLunch(!lunchEnabled)}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${lunchEnabled ? 'bg-green-500' : 'bg-neutral-600'}`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${lunchEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </div>
            </div>

            {lunchEnabled && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">Inicio Almuerzo</label>
                  <input
                    id="biz-lunch-start"
                    type="time"
                    disabled={!lunchEnabled}
                    value={fmt(hours.lunch_start)}
                    onChange={(e) =>
                      setHours((prev) => ({
                        ...prev,
                        lunch_start: e.target.value ? `${e.target.value}:00` : null,
                      }))
                    }
                    className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm h-[42px] disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">Fin Almuerzo</label>
                  <input
                    id="biz-lunch-end"
                    type="time"
                    disabled={!lunchEnabled}
                    value={fmt(hours.lunch_end)}
                    onChange={(e) =>
                      setHours((prev) => ({
                        ...prev,
                        lunch_end: e.target.value ? `${e.target.value}:00` : null,
                      }))
                    }
                    className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm h-[42px] disabled:opacity-50"
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-3">Días Abiertos</label>
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
              {DAY_LABELS.map((label, idx) => {
                const isOpen = !hours.closed_days.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all text-center ${isOpen ? 'bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)] shadow-sm' : 'bg-transparent border-[var(--foreground)]/10 text-[var(--foreground)]/30 hover:border-[var(--foreground)]/20'}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {hours.closed_days.length === 7 && (
              <p className="text-xs text-red-500 mt-2 font-medium">Debe haber al menos un día abierto.</p>
            )}
          </div>

          <div className="border-t border-[var(--foreground)]/10 pt-6">
            <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">Intervalo de turnos</label>
            <select
              id="biz-slot-step"
              className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm h-[42px] max-w-[200px]"
              value={settings.slot_step_minutes}
              onChange={(e) =>
                setSettings({ slot_step_minutes: Number(e.target.value) as 15 | 30 | 45 | 60 })
              }
            >
              <option value={15} style={{ color: "black" }}>15 minutos</option>
              <option value={30} style={{ color: "black" }}>30 minutos</option>
              <option value={45} style={{ color: "black" }}>45 minutos</option>
              <option value={60} style={{ color: "black" }}>60 minutos</option>
            </select>
          </div>

          <div className="flex justify-center pt-4">
            <div className="w-[200px]">
              <SaveButton id="btn-biz-save" type="submit" disabled={isSaveDisabled} loading={loading} />
            </div>
          </div>
        </form>
      </Modal>

      {popup.show && (
        <PopupModal
          message={popup.message}
          success={popup.success}
          onClose={() => {
            popup.close();
            if (popup.success) onClose();
          }}
        />
      )}
    </>
  );
}
