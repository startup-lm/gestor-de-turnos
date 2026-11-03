export function formatARS(value: number | null | undefined): string {
  return "$" + Math.round(Number(value ?? 0)).toLocaleString("es-AR");
}
