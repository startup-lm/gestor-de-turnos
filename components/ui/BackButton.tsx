"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface Props {
  href: string;
  label?: string;
}

export default function BackButton({ href, label = "Volver" }: Readonly<Props>) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(href)}
      className="flex items-center gap-2 text-[var(--primary)] bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 border border-[var(--primary)]/30 px-4 py-2 rounded-xl font-semibold transition-all duration-200 w-fit mb-4 group shadow-sm"
    >
      <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
      <span>{label}</span>
    </button>
  );
}
