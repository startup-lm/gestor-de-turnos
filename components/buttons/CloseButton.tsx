import { X } from "lucide-react";

export default function CloseButton({ onClose }: Readonly<{ onClose: () => void; }>) {
    return (
        <button onClick={onClose} aria-label="Cerrar" className="btn-close absolute top-2 right-2">
            <X size={30} />
        </button>
    );
}