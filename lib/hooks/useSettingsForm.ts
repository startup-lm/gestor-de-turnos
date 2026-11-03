"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { BusinessSettings } from "@/lib/types/BusinessSettings";
import { getBusinessSettings, updateBusinessSettings } from "@/lib/repository/businessSettings";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { toast } from "@/lib/store/useToastStore";

export function useSettingsForm<T>(opts: {
  /** Extrae del objeto de configuración los campos que edita esta pantalla. */
  pick: (settings: BusinessSettings) => T;
  /** Arma el body del PUT a partir del borrador. */
  toPayload: (draft: T) => Partial<BusinessSettings> | Promise<Partial<BusinessSettings>>;
  /** Carga adicional opcional (por ejemplo, businessHours en ConfigHorariosSection) */
  loadExtra?: (draft: T) => Promise<T>;
  /** Guardado adicional opcional (por ejemplo, upsertBusinessHours en ConfigHorariosSection) */
  saveExtra?: (draft: T) => Promise<void>;
}): {
  draft: T | null;            // null mientras carga
  setDraft: React.Dispatch<React.SetStateAction<T | null>>;
  loading: boolean;
  loadError: string | null;   // "No se pudo cargar la configuración. Probá de nuevo."
  hasChanges: boolean;        // JSON.stringify(draft) !== JSON.stringify(inicial)
  saving: boolean;
  save: () => Promise<boolean>;
  reset: () => void;          // vuelve al inicial
} {
  const { refreshConfig } = useBusinessContext();
  const [draft, setDraft] = useState<T | null>(null);
  const [initial, setInitial] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const optsRef = useRef(opts);
  optsRef.current = opts;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const settings = await getBusinessSettings();
      let picked = optsRef.current.pick(settings);
      if (optsRef.current.loadExtra) {
        picked = await optsRef.current.loadExtra(picked);
      }
      const cloned = JSON.parse(JSON.stringify(picked));
      setInitial(cloned);
      setDraft(cloned);
    } catch (err) {
      console.error("Error al cargar configuración:", err);
      const errorMsg = "No se pudo cargar la configuración. Probá de nuevo.";
      setLoadError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hasChanges = useMemo(() => {
    if (!draft || !initial) return false;
    return JSON.stringify(draft) !== JSON.stringify(initial);
  }, [draft, initial]);

  useEffect(() => {
    if (!hasChanges) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasChanges]);

  const reset = useCallback(() => {
    if (initial) {
      setDraft(JSON.parse(JSON.stringify(initial)));
    }
  }, [initial]);

  const save = useCallback(async (): Promise<boolean> => {
    if (!draft) return false;
    try {
      setSaving(true);
      const payload = await optsRef.current.toPayload(draft);
      if (optsRef.current.saveExtra) {
        await optsRef.current.saveExtra(draft);
      }
      const updatedSettings = await updateBusinessSettings(payload);
      let nextDraft: T = draft;
      if (updatedSettings) {
        let picked = optsRef.current.pick(updatedSettings);
        if (optsRef.current.loadExtra) {
          picked = await optsRef.current.loadExtra(picked);
        }
        nextDraft = picked;
      }
      const cloned = JSON.parse(JSON.stringify(nextDraft));
      setInitial(cloned);
      setDraft(cloned);
      toast.success("Cambios guardados");
      await refreshConfig();
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "No se pudieron guardar los cambios";
      toast.error(message);
      return false;
    } finally {
      setSaving(false);
    }
  }, [draft, refreshConfig]);

  return {
    draft,
    setDraft,
    loading,
    loadError,
    hasChanges,
    saving,
    save,
    reset,
  };
}
