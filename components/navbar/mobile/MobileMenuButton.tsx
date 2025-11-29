import { Menu } from "lucide-react";

export default function MobileMenuButton({ onClick }: Readonly<{ onClick: () => void; }>) {
    return (
        <button aria-label="Abrir menú" className="text-4xl z-30 !bg-transparent !text-[var(--accent)]" onClick={onClick} >
            <Menu className="w-6 h-6" />
        </button>
    )
}