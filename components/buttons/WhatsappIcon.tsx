"use client";

import { usePathname } from "next/navigation";
import { FaWhatsapp } from "react-icons/fa";
import { sendWhatsAppMessage } from "@/utils/whatsapp";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { getPaths } from "@/utils/paths";

export default function WhatsappIcon() {
  const pathname = usePathname();
  const { role } = useAuth();
  const { businessSettings } = useBusinessContext();

  if (role !== "guest" || !pathname) {
    return null;
  }

  const normalizedPath =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  const guestNavHrefs = new Set(["/", ...getPaths("guest").map((p) => p.href)]);

  if (!guestNavHrefs.has(normalizedPath)) {
    return null;
  }

  return (
    <button
      id="btn-whatsapp-floating"
      onClick={() =>
        sendWhatsAppMessage(
          "Hola! Me gustaría hacer una consulta.",
          businessSettings?.phone
        )
      }
      className="icon-whatsapp"
      aria-label="Contactar por WhatsApp"
    >
      <FaWhatsapp size={24} color="white" />
    </button>
  );
}
