"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { CalendarEvent } from "@/lib/types/CalendarEvent";

/**
 * loader: función que trae eventos del barbero.
 * Debe devolver una Promise<CalendarEvent[]>
 */
export function useBarberEvents(
  selectedBarberId: number,
  loader: (barberId: number) => Promise<CalendarEvent[]>
) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const lastReq = useRef(0);

  const load = useCallback(async () => {
    if (selectedBarberId < 0) {
      setEvents([]);
      setLoading(false);
      setError(null);
      return;
    }

    const reqId = ++lastReq.current;
    setLoading(true);
    setError(null);
    // Reset ligero para evitar "flash" del barbero anterior
    setEvents([]);

    try {
      const data = await loader(selectedBarberId);
      if (reqId === lastReq.current) {
        setEvents(data);
      }
    } catch (e) {
      if (reqId === lastReq.current) setError(e);
    } finally {
      if (reqId === lastReq.current) setLoading(false);
    }
  }, [selectedBarberId, loader]);

  useEffect(() => {
    void load();
  }, [load]);

  return { events, loading, error, reload: load };
}