import {
  getBarbersWithPrivateFields,
  getAllBarbersWithPrivateFields,
  getBarberByIdWithPrivateFields,
} from "@/lib/repository/barbers";
import { requireBarberOrAdmin } from "@/lib/api/auth";
import { isAdminStaff } from "@/lib/api/ownership";
import { Barber } from "@/lib/types/Barbers";
import AdminClient from "./AdminClient";

export const revalidate = 0;

/** Un barbero ve a sus compañeros, pero los datos privados (email, comisiones) solo los propios. */
function withoutPrivateFields(barber: Barber): Barber {
  const { id, name, role, image, instagram, active } = barber;
  return { id, name, role, image, instagram, active, email: "" };
}

export default async function AdminPage() {
  const staff = await requireBarberOrAdmin();
  // Sin sesión el middleware ya redirige: acá solo evitamos mandar datos
  if (!staff) return <AdminClient barbers={[]} me={null} />;

  const isAdmin = isAdminStaff(staff);
  const [barbers, me] = await Promise.all([
    isAdmin ? getAllBarbersWithPrivateFields() : getBarbersWithPrivateFields(),
    getBarberByIdWithPrivateFields(staff.barber.id),
  ]);

  const visibleBarbers = isAdmin
    ? barbers
    : barbers.map((b) => (b.id === staff.barber.id ? b : withoutPrivateFields(b)));

  return <AdminClient barbers={visibleBarbers} me={me} />;
}
