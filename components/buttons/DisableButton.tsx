"use client";

import { Slash } from "lucide-react";
import { ActionButton } from "./ActionButton";

export default function DisableButton(props: Readonly<Omit<React.ComponentProps<typeof ActionButton>, "name"|"Icon">>) {
  return <ActionButton name="Deshabilitar" Icon={Slash} {...props} />;
}
