interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`rounded-sm bg-zinc-700 animate-pulse-soft ${className}`}
    />
  );
}

export function ReservationCardSkeleton() {
  return (
    <div className="rounded-sm border border-zinc-700 bg-zinc-800 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-14" />
          <Skeleton className="hidden h-5 w-20 sm:block" />
        </div>
        <Skeleton className="h-6 w-20 rounded-sm" />
      </div>
    </div>
  );
}

export function MenuItemSkeleton() {
  return (
    <div className="py-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <Skeleton className="h-5 w-36" />
        <div className="min-w-8 flex-1 border-b border-dotted border-zinc-700" />
        <Skeleton className="h-5 w-12" />
      </div>
      <Skeleton className="mt-2 h-4 w-64" />
    </div>
  );
}
