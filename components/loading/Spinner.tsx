import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Spinner({ size = "md", className = "" }: Readonly<SpinnerProps>) {
  if (size === "sm") {
    return (
      <div className={`flex justify-center items-center p-1 ${className}`}>
        <Loader2 className="w-5 h-5 text-[var(--accent)] animate-spin" />
      </div>
    );
  }

  if (size === "lg") {
    return (
      <div className={`flex justify-center items-center h-32 ${className}`}>
        <Loader2 className="w-12 h-12 text-[var(--accent)] animate-spin" />
      </div>
    );
  }

  // size === "md" (predeterminado para secciones y paneles)
  return (
    <div className={`flex justify-center items-center h-24 ${className}`}>
      <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
    </div>
  );
}
