import { Trash2 } from "lucide-react";

export default function DeleteCardButton({ onDelete }: Readonly<{ onDelete: () => void; }>) {
  return (
    <button
      aria-label="Eliminar"
      className="p-2.5 rounded-full !bg-black/60 hover:!bg-red-500/20 text-red-500 hover:text-red-400 border border-white/10 hover:border-red-500/30 hover:scale-110 active:scale-95 transition-all duration-300 shadow-md flex items-center justify-center cursor-pointer"
      onClick={onDelete}
    >
      <Trash2 className="w-5 h-5" />
    </button>
  );
}
