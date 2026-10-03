"use client";

// Placeholder muat (design_system §8.8): blok parch-200, meniru bentuk kartu.
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-parch-200 ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div aria-hidden="true" className="rpg-panel p-4">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-1/2" />
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <ul role="status" aria-label="Memuat…" className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i}>
          <CardSkeleton />
        </li>
      ))}
    </ul>
  );
}
