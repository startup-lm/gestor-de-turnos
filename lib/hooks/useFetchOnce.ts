import useSWR from "swr";

export function useFetchOnce<T>(key: string, fetchFunction: () => Promise<T>) {
  const { data, error, isLoading, mutate } = useSWR<T>(key, fetchFunction, {
    revalidateOnFocus: false, // Opcional, pero para imitar "FetchOnce" con SWR no revalidamos todo el tiempo
    dedupingInterval: 60000, // 1 minuto de caché mínimo
  });

  if (error) {
    console.error(`Error en SWR fetching ${key}:`, error);
  }

  return {
    data: data ?? null,
    loading: isLoading,
    refetch: mutate,
  };
}