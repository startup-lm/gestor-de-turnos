"use client";

import { FaWhatsapp } from "react-icons/fa";
import { ActionButton } from "./ActionButton";

export default function WhatsappButton(props: Readonly<Omit<React.ComponentProps<typeof ActionButton>, "name"|"Icon">>) {
  return <ActionButton name="Confirmar turno" Icon={FaWhatsapp} buttonClass="btn-whatsapp" {...props} />;
}
