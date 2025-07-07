"use client";

import { LockKeyhole } from "lucide-react";
import { ActionButton } from "./ActionButton";

export default function BlockButton(props: Readonly<Omit<React.ComponentProps<typeof ActionButton>, "name"|"Icon">>) {
  return <ActionButton name="Bloquear" Icon={LockKeyhole} {...props} />;
}
