"use client";

import { Calendar } from "lucide-react";
import { ActionButton } from "./ActionButton";

export default function ReserveButton(props: Readonly<Omit<React.ComponentProps<typeof ActionButton>, "name"|"Icon">>) {
  return <ActionButton name="Reservar" Icon={Calendar} {...props} />;
}
