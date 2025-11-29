/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { supabaseClient } from "../supabase/supabaseClient";

export const useRealtimeData = (table: string, fetchFunction: () => Promise<any>) => {
  const [data, setData] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      const result = await fetchFunction();
      setData(result);
    };

    fetchData();

    const channel = supabaseClient
      .channel(`realtime:${table}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, fetchData)
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [table, fetchFunction]);

  return data;
};
