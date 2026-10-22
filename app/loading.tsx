import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8" aria-busy="true" aria-label="Loading">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-3 w-32 rounded-full" />
      <Skeleton className="mt-5 h-12 w-80 max-w-full rounded-2xl" />
      <Skeleton className="mt-4 h-4 w-96 max-w-full rounded-full" />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
