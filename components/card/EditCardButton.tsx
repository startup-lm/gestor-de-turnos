import { SquarePen } from "lucide-react";

export default function EditCardButton({ onEdit }: Readonly<{onEdit: () => void;}>) {
  return (
    <button
      aria-label="Editar"
      className="!p-2.5 !rounded-full !bg-[var(--accent)]/10 hover:!bg-[var(--accent)]/20 !text-[var(--accent)] hover:!text-[var(--accent)]/90 !border !border-[var(--accent)]/30 hover:!border-[var(--accent)]/60 hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg flex items-center justify-center cursor-pointer"
      onClick={onEdit}
    >
      <SquarePen className="w-5 h-5" />
    </button>
  );
}
