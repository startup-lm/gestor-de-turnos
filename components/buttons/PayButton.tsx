"use client";

import { CreditCard } from "lucide-react";
import { ActionButton } from "./ActionButton";

export default function PayButton(props: Readonly<Omit<React.ComponentProps<typeof ActionButton>, "name"|"Icon">>) {
  return <ActionButton name="Pagar" Icon={CreditCard} buttonClass="btn-paid btn-paid-enabled" {...props} />;
}
