"use client";

import { Trash2 } from "lucide-react";
import { ActionButton } from "./ActionButton";

export default function DeleteButton(props: Readonly<Omit<React.ComponentProps<typeof ActionButton>, "name"|"Icon">>) {
  return <ActionButton name="Eliminar" Icon={Trash2} buttonClass="btn-delete" {...props} />;
}
