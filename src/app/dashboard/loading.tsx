import { ListSkeleton } from "@/components/skeleton";

// Skeleton muat /dashboard (design_system §8.8): meniru bentuk kartu ringkasan.
export default function DashboardLoading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-6 pb-16">
      <div className="rpg-panel-sky h-28 animate-pulse rounded-lg" />
      <ListSkeleton rows={3} />
    </main>
  );
}
