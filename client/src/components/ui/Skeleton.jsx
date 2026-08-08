function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-white/10 ${className}`}
      aria-hidden="true"
    />
  );
}

export function PizzaCardSkeleton() {
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

export function OrderRowSkeleton() {
  return (
    <div className="glass flex items-center justify-between gap-4 rounded-2xl p-4">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="glass rounded-2xl p-5">
      <Skeleton className="mb-3 h-3 w-24" />
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

export default Skeleton;
