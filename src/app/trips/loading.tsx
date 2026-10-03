import { ListSkeleton } from "@/components/skeleton";

// Skeleton muat /trips (design_system §8.8).
export default function TripsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6 pb-16">
      <div className="h-8 w-40 animate-pulse rounded-md bg-parch-200" />
      <ListSkeleton rows={3} />
    </main>
  );
}
