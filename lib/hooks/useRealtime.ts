/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { supabaseClient } from "../supabase/supabaseClient";

export const useRealtimeData = (table: string, fetchFunction: () => Promise<any>, refreshSignal?: number) => {
  const [data, setData] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    const result = await fetchFunction();
    setData(result);
  }, [fetchFunction]);

  useEffect(() => {
    fetchData();

    const channel = supabaseClient
      .channel(`realtime:${table}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, fetchData)
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [table, fetchData]);

  useEffect(() => {
    if (refreshSignal === undefined) return;
    fetchData();
  }, [refreshSignal, fetchData]);

  return data;
};
