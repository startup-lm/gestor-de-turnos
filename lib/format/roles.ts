export function roleLabel(role?: string): string {
  if (!role) return "";
  const lower = role.toLowerCase();
  if (lower === "admin") return "Admin";
  if (lower === "barber") return "Barbero";
  return role;
}
