"use client";

import { SquarePen } from "lucide-react";
import { ActionButton } from "./ActionButton";

export default function EditButton(props: Readonly<Omit<React.ComponentProps<typeof ActionButton>, "name"|"Icon">>) {
  return <ActionButton name="Editar" Icon={SquarePen} {...props} />;
}
