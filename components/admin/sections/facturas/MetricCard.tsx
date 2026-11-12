import React from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: "accent" | "green" | "yellow" | "red";
}

export function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "accent",
}: MetricCardProps) {
  const colorMap = {
    accent: "text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent)]/20",
    green: "text-green-400 bg-green-500/10 border-green-500/20",
    yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
  };
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${colorMap[color]}`}>
      <div className="p-2 rounded-lg bg-current/10">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-medium opacity-70 tracking-wider">{label}</p>
        <p className="text-xl font-bold">{value}</p>
        {sub && <p className="text-[10px] opacity-60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
