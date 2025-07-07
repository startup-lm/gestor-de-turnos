import { Scissors } from "lucide-react";

export default function Spinner() {
  return (
    <div className="flex justify-center items-center h-32">
      <Scissors className="w-16 h-16 text-[var(--accent)] animate-spin" />
    </div>
  );
}
