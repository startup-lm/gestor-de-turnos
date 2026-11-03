/**
 * Reglas de permisos del staff: el barbero ve todo el local, pero solo modifica lo suyo.
 * El admin puede modificar cualquier registro.
 */
export interface StaffIdentity {
  barber: { id: number; role: string };
}

export function isAdminStaff(staff: StaffIdentity): boolean {
  return staff.barber.role === "admin";
}

/** true si el staff puede modificar un registro cuyo dueño es `ownerBarberId`. */
export function canModify(staff: StaffIdentity, ownerBarberId: number | null | undefined): boolean {
  if (isAdminStaff(staff)) return true;
  return ownerBarberId != null && Number(ownerBarberId) === Number(staff.barber.id);
}
