import Link from "next/link";

// Navigasi tab detail trip (PRD §6.3): Itinerary | Keuangan | Anggota.
// Server component kecil — tanpa JS klien agar ringan di HP.

export function TabNav({ tripId, active }: { tripId: string; active: string }) {
  const tabs = [
    { key: "itinerary", label: "🗓️ Itinerary" },
    { key: "keuangan", label: "💰 Keuangan" },
    { key: "anggota", label: "👥 Anggota" },
  ] as const;

  return (
    <nav aria-label="Bagian trip" className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <Link
            key={tab.key}
            href={`/trips/${tripId}?tab=${tab.key}`}
            aria-current={isActive ? "page" : undefined}
            className={`flex h-11 shrink-0 items-center rounded-md px-4 text-[15px] font-semibold transition-colors ${
              isActive
                ? "bg-action text-white"
                : "border border-border bg-surface text-slate-700"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
