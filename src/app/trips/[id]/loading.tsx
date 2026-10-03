import { ListSkeleton } from "@/components/skeleton";

// Skeleton muat /trips/[id] (design_system §8.8).
export default function TripDetailLoading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-6 pb-16">
      <div className="rpg-panel-sky h-32 animate-pulse rounded-lg" />
      <div className="flex gap-2">
        <div className="h-11 w-28 animate-pulse rounded-md bg-parch-200" />
        <div className="h-11 w-28 animate-pulse rounded-md bg-parch-200" />
        <div className="h-11 w-24 animate-pulse rounded-md bg-parch-200" />
      </div>
      <ListSkeleton rows={3} />
    </main>
  );
}
