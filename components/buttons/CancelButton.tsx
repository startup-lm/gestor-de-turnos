"use client";

import { Ban } from "lucide-react";
import { ActionButton } from "./ActionButton";

export default function DeleteButton(props: Readonly<Omit<React.ComponentProps<typeof ActionButton>, "name"|"Icon">>) {
  return <ActionButton name="Cancelar" Icon={Ban} buttonClass="btn-delete" {...props} />;
}
