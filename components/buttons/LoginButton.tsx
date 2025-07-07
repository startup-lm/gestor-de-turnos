"use client";

import { LogIn } from "lucide-react";
import { ActionButton } from "./ActionButton";

export default function LoginButton(props: Readonly<Omit<React.ComponentProps<typeof ActionButton>, "name"|"Icon">>) {
  return <ActionButton name="Ingresar" Icon={LogIn} {...props} />;
}
