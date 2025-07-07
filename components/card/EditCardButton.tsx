import { SquarePen } from "lucide-react";

export default function DeleteCardButton({ onEdit }: Readonly<{onEdit: () => void;}>) {
  return (
    <button aria-label="EliminarCard" className="p-1 rounded-full hover:bg-black/10 transition !bg-transparent font-bold" onClick={onEdit} >
      <SquarePen className="w-5 h-5 text-[var(--primary)]" />
    </button>
  );
}
