import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  toSplitExpenses,
  toSettlementTransfers,
  formatRupiah,
} from "@/lib/split-bill";
import { summarizePersonal, type TripData } from "@/lib/dashboard";

export const metadata = { title: "Dashboard — KemanaKita" };

// Ringkasan personal lintas trip (spec §4.3, §5). Tampilan saja: tanpa form,
// tanpa server action, tanpa dangerouslySetInnerHTML.
// Server component agar agregasi memakai sesi user (RLS per member).
//
// Gaya query: skip-early saat daftar id kosong (spec §4.1), bukan dummy UUID.

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const { data: memberships } = await supabase
    .from("trip_members")
    .select("trip_id")
    .eq("user_id", user.id);
  const tripIds = [...new Set((memberships ?? []).map((m) => m.trip_id))];

  // Tanpa trip → kondisi kosong, hentikan query lanjutan (jangan kirim .in([])).
  if (tripIds.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-6 pb-16">
        <header>
          <span className="rpg-ribbon mb-1">🏠 Dashboard</span>
          <h1 className="font-display text-[26px] leading-8 font-extrabold text-action">
            Ringkasanmu
          </h1>
        </header>

        <section className="rpg-panel-sky rpg-corner relative flex flex-col gap-2 rounded-lg p-4">
          <p className="text-[15px] leading-[22px] font-bold text-white">
            Belum ada trip. Bikin atau gabung dulu, ya.
          </p>
          <Link
            href="/trips"
            className="rpg-btn inline-flex h-11 w-fit items-center rounded-md border-2 border-white/70 bg-white/15 px-4 text-[14px] font-bold text-white hover:bg-white/25"
          >
            Ke halaman trip
          </Link>
        </section>

        <section className="rpg-panel p-4">
          <h2 className="font-display text-[17px] leading-[22px] font-semibold text-fg">
            Saran pelunasan
          </h2>
          <p className="mt-1 text-[14px] leading-5 text-ink-600">
            Saran pelunasan akan muncul di sini setelah ada pengeluaran.
          </p>
          <Link
            href="/trips"
            className="mt-2 inline-block text-[14px] font-semibold text-action underline underline-offset-4"
          >
            Ke halaman trip
          </Link>
        </section>
      </main>
    );
  }

  const [{ data: tripRows }, { data: expenseRows }] = await Promise.all([
    supabase
      .from("trips")
      .select("id, title, start_date, end_date")
      .in("id", tripIds),
    supabase
      .from("expenses")
      .select("id, trip_id, title, amount, paid_by, date, kind")
      .in("trip_id", tripIds),
  ]);

  const trips = tripRows ?? [];
  const expenses = expenseRows ?? [];
  const expenseIds = expenses.map((e) => e.id);

  // Tanpa expense → lewati query splits (jangan kirim .in("expense_id", [])).
  const { data: splitRows } =
    expenseIds.length > 0
      ? await supabase
          .from("expense_splits")
          .select("expense_id, user_id")
          .in("expense_id", expenseIds)
      : { data: [] };

  const splitsByExpense = new Map<string, { user_id: string }[]>();
  for (const row of splitRows ?? []) {
    const list = splitsByExpense.get(row.expense_id) ?? [];
    list.push({ user_id: row.user_id });
    splitsByExpense.set(row.expense_id, list);
  }

  // Nama anggota di-fan-out per trip: policy profiles hanya mengizinkan baca
  // profil yang berbagi ≥1 trip dengan viewer, jadi satu .in lintas trip
  // akan dikembalikan sebagian tanpa error. N+1 ini tidak dapat dihindari
  // tanpa RPC/tabel baru (ditolak spec §2).
  const nameById = new Map<string, string>();
  const membersPerTrip = await Promise.all(
    tripIds.map((tripId) =>
      supabase.from("trip_members").select("user_id").eq("trip_id", tripId),
    ),
  );
  const memberIdsPerTrip = membersPerTrip.map(
    ({ data }) => (data ?? []).map((m) => m.user_id),
  );
  const profilesPerTrip = await Promise.all(
    memberIdsPerTrip.map((memberIds) =>
      memberIds.length > 0
        ? supabase.from("profiles").select("id, name").in("id", memberIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    ),
  );
  for (const { data } of profilesPerTrip) {
    for (const p of data ?? []) nameById.set(p.id, p.name);
  }
  const displayName = (id: string) =>
    id === user.id
      ? "Kamu"
      : (nameById.get(id) ?? `Anggota ${id.slice(0, 6)}`);

  const titleByTrip = new Map(trips.map((t) => [t.id, t.title]));

  const tripDataList: TripData[] = trips.map((t) => {
    const rows = expenses
      .filter((e) => e.trip_id === t.id)
      .map((e) => ({
        id: e.id,
        amount: e.amount,
        paid_by: e.paid_by,
        kind: e.kind,
      }));
    return {
      tripId: t.id,
      title: t.title ?? "(tanpa judul)",
      expenses: toSplitExpenses(rows, splitsByExpense),
      settlements: toSettlementTransfers(rows, splitsByExpense),
    };
  });
  const summary = summarizePersonal(user.id, tripDataList);

  const activeTrips = [...trips]
    .sort((a, b) => (b.start_date ?? "").localeCompare(a.start_date ?? ""))
    .slice(0, 4);
  const recentExpenses = [...expenses]
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, 5);

  const statusHeadline =
    summary.status === "menerima"
      ? `Kamu menerima ${formatRupiah(summary.net)}`
      : summary.status === "bayar"
        ? `Kamu perlu membayar ${formatRupiah(-summary.net)}`
        : summary.status === "impas"
          ? "Impas lintas trip"
          : "Aman, lunas";
  const statusSub =
    summary.status === "menerima"
      ? `dari ${summary.partnerCount} orang`
      : summary.status === "bayar"
        ? `ke ${summary.partnerCount} orang`
        : summary.status === "impas"
          ? `piutang dan utangmu saling hapus · ${summary.partnerCount} orang`
          : "Tidak ada utang berjalan 🎉";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-6 pb-16">
      <header>
        <span className="rpg-ribbon mb-1">🏠 Dashboard</span>
        <h1 className="font-display text-[26px] leading-8 font-extrabold text-action">
          Ringkasanmu
        </h1>
      </header>

      {/* Kartu 1: status personal */}
      <section className="rpg-panel-sky rpg-corner relative flex flex-col gap-1 rounded-lg p-4">
        <p className="text-[15px] leading-[22px] font-bold text-white">
          {statusHeadline}
        </p>
        <p className="text-[13px] leading-5 text-white/90">{statusSub}</p>
      </section>

      {/* Kartu 2: tiga kotak ringkas */}
      <section aria-label="Ringkasan angka" className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rpg-panel p-4">
          <p className="text-[12px] leading-4 font-semibold text-ink-600">
            Total pengeluaranmu
          </p>
          <p className="tnum mt-1 text-[20px] leading-[26px] font-extrabold text-fg">
            {formatRupiah(summary.totalSpent)}
          </p>
          {expenses.length === 0 && (
            <p className="mt-1 text-[12px] leading-4 text-ink-600">
              Belum ada pengeluaran
            </p>
          )}
        </div>
        <div className="rpg-panel p-4">
          <p className="text-[12px] leading-4 font-semibold text-ink-600">
            Harus diterima
          </p>
          <p className="tnum mt-1 text-[20px] leading-[26px] font-extrabold text-fg">
            {formatRupiah(summary.totalReceive)}
          </p>
        </div>
        <div className="rpg-panel p-4">
          <p className="text-[12px] leading-4 font-semibold text-ink-600">
            Harus dibayar
          </p>
          <p className="tnum mt-1 text-[20px] leading-[26px] font-extrabold text-fg">
            {formatRupiah(summary.totalPay)}
          </p>
        </div>
      </section>

      {/* Kartu 3: saran pelunasan */}
      <section className="rpg-panel p-4">
        <h2 className="font-display text-[17px] leading-[22px] font-semibold text-fg">
          Saran pelunasan
        </h2>
        {summary.mySuggestions.length === 0 ? (
          <p className="mt-1 text-[14px] leading-5 text-ink-600">
            Semua beres 🎉
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {summary.mySuggestions.map((s, i) => (
              <li
                key={`${s.tripId}-${s.from}-${s.to}-${i}`}
                className="flex items-baseline justify-between gap-3"
              >
                <p className="min-w-0 text-[14px] leading-5 text-fg">
                  <span className="font-semibold">
                    {displayName(s.from)} → {displayName(s.to)}
                  </span>{" "}
                  <span className="tnum font-bold">
                    {formatRupiah(s.amount)}
                  </span>
                  <span className="block truncate text-[12px] leading-4 text-ink-600">
                    {s.tripTitle}
                  </span>
                </p>
                <Link
                  href={`/trips/${s.tripId}?tab=keuangan`}
                  aria-label={`Bayar di trip ${s.tripTitle}: ${displayName(s.from)} ke ${displayName(s.to)} ${formatRupiah(s.amount)} — buka tab Keuangan`}
                  className="shrink-0 text-[13px] font-semibold text-action underline underline-offset-4"
                >
                  Bayar di trip →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Kartu 4: trip aktif */}
      <section className="rpg-panel p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-[17px] leading-[22px] font-semibold text-fg">
            Trip aktif
          </h2>
          <Link
            href="/trips"
            className="shrink-0 text-[13px] font-semibold text-action underline underline-offset-4"
          >
            Lihat semua →
          </Link>
        </div>
        {activeTrips.length === 0 ? (
          <p className="mt-1 text-[14px] leading-5 text-ink-600">
            Belum ada trip.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {activeTrips.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/trips/${t.id}`}
                  className="block truncate text-[14px] leading-5 font-semibold text-action underline underline-offset-4"
                >
                  {t.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Kartu 5: pengeluaran terbaru */}
      <section className="rpg-panel p-4">
        <h2 className="font-display text-[17px] leading-[22px] font-semibold text-fg">
          Pengeluaran terbaru
        </h2>
        {recentExpenses.length === 0 ? (
          <p className="mt-1 text-[14px] leading-5 text-ink-600">
            Belum ada pengeluaran.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-3">
            {recentExpenses.map((e) => (
              <li
                key={e.id}
                className="flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] leading-5 font-semibold text-fg">
                    {e.title}
                  </p>
                  <p className="truncate text-[12px] leading-4 text-ink-600">
                    {displayName(e.paid_by)} · {titleByTrip.get(e.trip_id) ?? "Trip"}
                  </p>
                </div>
                <p className="tnum shrink-0 text-[14px] leading-5 font-bold text-fg">
                  {formatRupiah(Math.round(Number(e.amount)))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
