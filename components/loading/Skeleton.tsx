export default function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-300 dark:bg-gray-700 rounded-lg ${className}`} />
  );
}

export function CalendarSkeleton() {
  return (
    <div className="w-full flex flex-col gap-4 p-4 border border-[var(--primary)] rounded-lg bg-[var(--accent)] shadow-xl">
      <Skeleton className="h-10 w-full mb-4" />
      <div className="grid grid-cols-7 gap-2">
         {Array.from({ length: 35 }).map((_, i) => (
           <Skeleton key={i} className="h-12 w-full" />
         ))}
      </div>
    </div>
  );
}
