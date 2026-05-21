import { Menu } from "lucide-react";

export default function MobileMenuButton({ onClick }: Readonly<{ onClick: () => void; }>) {
    return (
        <button id="btn-mobile-menu" aria-label="Abrir menú" className="text-4xl z-30 !bg-transparent !text-[var(--accent)] hover:!scale-105 active:!scale-95 !transition-all !duration-200 cursor-pointer" onClick={onClick} >
            <Menu className="w-6 h-6" />
        </button>
    )
}