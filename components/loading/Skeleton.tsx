export default function Skeleton({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <div className={`animate-pulse bg-slate-700/40 rounded-lg ${className}`} />
  );
}

export function CalendarSkeleton() {
  return (
    <div className="w-full flex flex-col gap-5 p-6 border border-[var(--foreground)]/5 rounded-2xl bg-[var(--bg-carousel)] shadow-xl">
      {/* Cabecera del Calendario */}
      <div className="flex justify-between items-center mb-2 animate-pulse">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
      
      {/* Grilla Semanal de la Agenda */}
      <div className="grid grid-cols-7 gap-3 animate-pulse">
        {Array.from({ length: 7 }).map((_, colIdx) => (
          <div key={colIdx} className="space-y-3 flex flex-col items-center">
            {/* Header del día */}
            <Skeleton className="h-5 w-12 mb-1" />
            
            {/* Franjas horarias */}
            {Array.from({ length: 6 }).map((_, slotIdx) => (
              <Skeleton 
                key={slotIdx} 
                className="h-10 w-full bg-slate-800/30 border border-slate-800/10 rounded-xl" 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
