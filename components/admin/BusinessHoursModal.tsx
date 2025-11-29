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
  const popup = usePopup();
  useEffect(() => {
    (async () => {
      try {
        setLoadingFetch(true);
        const [h, s] = await Promise.all([getBusinessHours(), getBusinessSettings()]);
        setHours(h);
        setSettings(s ?? { slot_step_minutes: 30 });
        setLunchEnabled(Boolean(h.lunch_start && h.lunch_end));
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isDisabled) {
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
        body: JSON.stringify({ tags: ["business-hours-global", "business-settings"] }),
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
      <Modal onClose={onClose}>
        <h2 className="text-xl font-bold mb-4 text-center">Días y horario de atención</h2>

        <form onSubmit={handleSave} className="px-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block font-medium mb-1">Apertura</label>
              <input
                type="time"
                value={fmt(hours.open_time)}
                className="time-input border rounded px-1 py-1 w-full"
                required
                onChange={(e) => setHours((prev) => ({ ...prev, open_time: `${e.target.value}:00` }))}
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Cierre</label>
              <input
                type="time"
                value={fmt(hours.close_time)}
                className="time-input border rounded px-1 py-1 w-full"
                required
                onChange={(e) => setHours((prev) => ({ ...prev, close_time: `${e.target.value}:00` }))}
              />
            </div>

            <div className="sm:col-span-2 mt-4">
              <label className="inline-flex items-center gap-2 select-none">
                <input
                  type="checkbox"
                  checked={lunchEnabled}
                  onChange={(e) => onToggleLunch(e.target.checked)}
                />
                <span className="font-medium">Almuerzo</span>
              </label>
            </div>

            <div>
              <label className="block font-medium mb-1">Desde</label>
              <input
                type="time"
                disabled={!lunchEnabled}
                value={fmt(hours.lunch_start)}
                onChange={(e) =>
                  setHours((prev) => ({
                    ...prev,
                    lunch_start: e.target.value ? `${e.target.value}:00` : null,
                  }))
                }
                className="time-input border rounded px-1 py-1 w-full disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Hasta</label>
              <input
                type="time"
                disabled={!lunchEnabled}
                value={fmt(hours.lunch_end)}
                onChange={(e) =>
                  setHours((prev) => ({
                    ...prev,
                    lunch_end: e.target.value ? `${e.target.value}:00` : null,
                  }))
                }
                className="time-input border rounded px-1 py-1 w-full disabled:opacity-60"
              />
            </div>
          </div>

          <div className="mt-6 text-sm">
            <label className="block font-medium mb-2">Días abiertos</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
              {DAY_LABELS.map((label, idx) => {
                const isOpen = !hours.closed_days.includes(idx);
                return (
                  <label key={idx} className="inline-flex items-center gap-1">
                    <input type="checkbox" checked={isOpen} onChange={() => toggleDay(idx)} />
                    {label}
                  </label>
                );
              })}
            </div>
            {hours.closed_days.length === 7 && (
              <p className="text-sm text-red-600 mt-2">Debe haber al menos un día abierto.</p>
            )}
          </div>

          <div className="mt-6 border-t pt-4 text-sm">
            <label className="block font-medium mb-1">Intervalo de turnos</label>
            <select
              className="border rounded px-2 py-1"
              value={settings.slot_step_minutes}
              onChange={(e) =>
                setSettings({ slot_step_minutes: Number(e.target.value) as 15 | 30 | 45 | 60 })
              }
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>60 minutos</option>
            </select>
          </div>

          <div className="flex justify-center mt-10">
            <SaveButton type="submit" disabled={isDisabled} loading={loading} />
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