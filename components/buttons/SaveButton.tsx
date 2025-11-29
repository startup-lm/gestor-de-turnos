"use client";

import { Save } from "lucide-react";
import { ActionButton } from "./ActionButton";

export default function SaveButton(props: Readonly<Omit<React.ComponentProps<typeof ActionButton>, "name"|"Icon">>) {
  return <ActionButton name="Guardar" Icon={Save} {...props} />;
}
