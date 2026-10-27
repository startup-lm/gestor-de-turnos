"use client";

import { Send } from "lucide-react";
import { ActionButton } from "./ActionButton";

export default function SendButton({
  name = "Enviar",
  ...props
}: Readonly<Omit<React.ComponentProps<typeof ActionButton>, "Icon"> & { name?: string }>) {
  return <ActionButton name={name} Icon={Send} {...props} />;
}