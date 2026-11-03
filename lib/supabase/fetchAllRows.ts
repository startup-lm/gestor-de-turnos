/**
 * Supabase (PostgREST) devuelve como máximo 1000 filas por consulta, sin avisar.
 * Para sumar turnos, ventas o movimientos de un período hay que traer todas las páginas.
 *
 * `buildPage(from, to)` arma la consulta de una página con `.range(from, to)`.
 * Tiene que llevar un `.order(...)` estable para que las páginas no se pisen.
 */
export const PAGE_SIZE = 1000;

export async function fetchAllRows<T>(
  buildPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  pageSize: number = PAGE_SIZE
): Promise<{ data: T[]; error: unknown }> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildPage(from, from + pageSize - 1);
    if (error) return { data: [], error };
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return { data: rows, error: null };
  }
}
