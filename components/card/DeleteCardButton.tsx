import { Trash2 } from "lucide-react";

export default function DeleteCardButton({ onDelete }: Readonly<{ onDelete: () => void; }>) {
  return (
    <button aria-label="Eliminar" className="p-1 rounded-full hover:bg-black/10 transition !bg-transparent font-bold" onClick={onDelete} >
      <Trash2 className="w-5 h-5 text-[var(--accent-red)]" />
    </button>
  );
}
