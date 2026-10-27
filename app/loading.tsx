import { PageSkeleton } from "@/components/loading/Skeleton";

export default function Loading() {
  return (
    <div className="w-full bg-[var(--background)] pb-20">
      <PageSkeleton />
    </div>
  );
}
