import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
      <Loader2 className="w-12 h-12 text-[var(--accent)] animate-spin" />
    </div>
  );
}
