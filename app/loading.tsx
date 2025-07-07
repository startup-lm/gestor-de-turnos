import { Scissors } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
      <Scissors className="w-16 h-16 text-[var(--accent)] animate-spin" />
    </div>
  );
}
