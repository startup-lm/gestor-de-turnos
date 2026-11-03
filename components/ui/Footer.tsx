"use client";

import { usePathname } from "next/navigation";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { PRODUCT_CREDIT } from "@/lib/brand";
import { FaInstagram, FaFacebook, FaTiktok, FaWhatsapp, FaLink } from "react-icons/fa";

const ICON_MAP: Record<string, React.ReactNode> = {
  instagram: <FaInstagram size={20} />,
  facebook: <FaFacebook size={20} />,
  tiktok: <FaTiktok size={20} />,
  whatsapp: <FaWhatsapp size={20} />,
};

export default function Footer() {
  const pathname = usePathname();
  const { businessSettings } = useBusinessContext();

  if (pathname?.startsWith("/admin")) {
    return null;
  }
  const activeSocials = (businessSettings?.social_media || []).filter(s => s.active && s.url);

  return (
    <footer className="w-full bg-[var(--background)] text-[var(--secondary)] py-8 px-4 border-t border-white/5">
      <div className="w-full max-w-[1720px] mx-auto flex flex-col items-center">
        {activeSocials.length > 0 && (
          <div className="flex gap-4 mb-4">
            {activeSocials.map(social => (
              <a 
                key={social.name} 
                href={social.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[var(--secondary)] hover:text-[var(--primary)] transition-colors"
                aria-label={social.name}
              >
                {ICON_MAP[social.name] || <FaLink size={20} />}
              </a>
            ))}
          </div>
        )}
        <div className="text-center text-xs">
          © {new Date().getFullYear()} {PRODUCT_CREDIT}. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
