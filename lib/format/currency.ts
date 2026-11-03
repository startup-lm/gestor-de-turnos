export function formatARS(value: number | null | undefined): string {
  const rounded = Math.round(Number(value ?? 0));
  const normalized = Object.is(rounded, -0) || rounded === 0 ? 0 : rounded;
  return "$" + normalized.toLocaleString("es-AR");
}
