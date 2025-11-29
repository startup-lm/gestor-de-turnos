"use client";

import { DollarSign } from "lucide-react";
import { ActionButton, ActionButtonProps } from "./ActionButton";


interface ChargeButtonProps extends Omit<ActionButtonProps, "name" | "Icon"> { isPaid: boolean; }

export default function ChargeButton({isPaid,disabled = false,...props}: Readonly<ChargeButtonProps>) {
  const baseClass = "btn-paid";
  const stateClass = isPaid ? "btn-paid-disabled" : "btn-paid-enabled";

  return (
    <ActionButton name="Cobrar" Icon={DollarSign} buttonClass={baseClass} className={stateClass} disabled={isPaid || disabled} {...props} />
  );
}
