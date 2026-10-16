import {
  Calendar,
  CalendarX,
  Store,
  Scissors,
  Users,
  ChartNoAxesCombined,
  Briefcase,
  Settings,
} from "lucide-react";
import type { FC, SVGProps } from "react";

export type NavPath = {
  href: string;
  label: string;
  Icon: FC<SVGProps<SVGSVGElement>>;
};

export function getPaths(role: string): NavPath[] {
  const paths: NavPath[] = [
    { href: "/turnos", label: "Turnos", Icon: Calendar },
    { href: "/turnos/cancelar", label: "Cancelar Turno", Icon: CalendarX },
    { href: "/productos", label: "Productos", Icon: Store },
    { href: "/servicios", label: "Servicios", Icon: Scissors },
    { href: "/nosotros", label: "Nosotros", Icon: Users },
  ];
  if (role !== "guest") {
    paths.push({ href: "/dashboard", label: "Dashboard", Icon: ChartNoAxesCombined });
    paths.push({ href: "/operaciones", label: "Operaciones", Icon: Briefcase });
  }
  if (role === "admin") {
    paths.push({ href: "/configuracion", label: "Configuración", Icon: Settings });
  }

  return paths;
}
