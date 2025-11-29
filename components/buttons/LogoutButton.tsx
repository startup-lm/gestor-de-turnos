"use client";

import { LogOut } from "lucide-react";
import { ActionButton } from "./ActionButton";

export default function LogoutButton(props: Readonly<Omit<React.ComponentProps<typeof ActionButton>, "name"|"Icon">>) {
  return <ActionButton name="Cerrar sesión" Icon={LogOut} {...props} />;
}
