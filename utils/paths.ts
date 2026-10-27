import {
  Calendar,
  CalendarX,
  Store,
  Scissors,
  Users,
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
    { href: "/turnos/cancelar", label: "Cancelar turno", Icon: CalendarX },
    { href: "/productos", label: "Productos", Icon: Store },
    { href: "/servicios", label: "Servicios", Icon: Scissors },
    { href: "/nosotros", label: "Nosotros", Icon: Users },
  ];
  if (role !== "guest") {
    paths.push({ href: "/admin", label: "Administración", Icon: Settings });
  }

  return paths;
}
