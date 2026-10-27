/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from "react";
import { supabaseClient } from "../supabase/supabaseClient";

export const useRealtimeData = (table: string, fetchFunction: () => Promise<any>, refreshSignal?: number) => {
  const [data, setData] = useState<any[]>([]);
  const fetchRef = useRef(fetchFunction);

  useEffect(() => {
    fetchRef.current = fetchFunction;
  });

  const executeFetch = useCallback(async () => {
    try {
      const result = await fetchRef.current();
      setData(result);
    } catch (e) {
      console.error(`Error in useRealtimeData fetch for ${table}:`, e);
    }
  }, [table]);

  useEffect(() => {
    executeFetch();
  }, [executeFetch, refreshSignal, fetchFunction]);

  useEffect(() => {
    const channel = supabaseClient
      .channel(`realtime:${table}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        executeFetch();
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [table, executeFetch]);

  return data;
};
