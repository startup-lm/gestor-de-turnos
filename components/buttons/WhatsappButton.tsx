"use client";

import { ComponentProps } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { ActionButton } from "./ActionButton";

type WhatsappButtonProps = Omit<ComponentProps<typeof ActionButton>,"Icon" | "name"> & {name?: string;};

export default function WhatsappButton({ name = "", buttonClass = "btn-whatsapp", ...restProps }: WhatsappButtonProps) {
  return (
    <ActionButton name={name} Icon={FaWhatsapp} buttonClass={buttonClass} {...restProps} />
  );
}
