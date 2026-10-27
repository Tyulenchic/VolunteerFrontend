export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

/** Placeholder rows shown while a list loads, instead of a bare spinner. */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-line" role="status" aria-label="Загрузка">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="w-9 h-9 !rounded-full shrink-0" />
          <div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-1/3" /><Skeleton className="h-3 w-1/2" /></div>
          <Skeleton className="h-5 w-20 !rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" role="status" aria-label="Загрузка">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-card border border-line bg-surface overflow-hidden">
          <Skeleton className="h-40 !rounded-none" />
          <div className="p-4 space-y-2.5"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-2/3" /></div>
        </div>
      ))}
    </div>
  );
}
