"use client";

import { Send } from "lucide-react";
import { ActionButton } from "./ActionButton";

export default function SendButton(props: Readonly<Omit<React.ComponentProps<typeof ActionButton>, "name"|"Icon">>) {
  return <ActionButton name="Enviar" Icon={Send} {...props} />;
}