"use client";

import { Save } from "lucide-react";
import { ActionButton } from "./ActionButton";

export default function SaveButton({
  name = "Guardar cambios",
  ...props
}: Readonly<Omit<React.ComponentProps<typeof ActionButton>, "Icon" | "name"> & { name?: string }>) {
  return <ActionButton name={name} Icon={Save} {...props} />;
}
