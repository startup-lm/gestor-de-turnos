"use client";

import { PlusCircle } from "lucide-react";
import { ActionButton } from "./ActionButton";

export default function AddButton(props: Readonly<Omit<React.ComponentProps<typeof ActionButton>, "name"|"Icon">>) {
  return <ActionButton name="Agregar" Icon={PlusCircle} {...props} />;
}