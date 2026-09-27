import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  eachDayInRange,
  groupItineraryByDay,
  formatDayLabel,
  formatTripDate,
  type ItineraryItem,
} from "@/lib/itinerary";
import {
  computeBalances,
  suggestSettlements,
  formatRupiah,
  type Expense as SplitExpense,
  type Transfer,
} from "@/lib/split-bill";
import { EXPENSE_CATEGORIES } from "@/lib/validate";
import { AddItineraryForm } from "./add-itinerary-form";
import { AddExpenseForm } from "./add-expense-form";
import { DeleteItineraryButton, DeleteExpenseButton } from "./delete-buttons";
import { EditItineraryForm } from "./edit-itinerary-form";
import { EditExpenseForm } from "./edit-expense-form";
import { SettlementButton } from "./settlement-button";
import { TabNav } from "./tab-nav";

// Detail trip (PRD §4.2–§4.5, §6.3): hanya anggota yang bisa buka.
// Non-member diarahkan ke /join dengan kode terisi, sesuai gaya PRD §5.2.

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; code?: string; invite?: string }>;
};

const CATEGORY_BY_KEY = new Map(EXPENSE_CATEGORIES.map((c) => [c.key, c]));

export default async function TripDetailPage({ params, searchParams }: PageProps) {
  const { id: tripId } = await params;
  const query = await searchParams;
  const tab = query.tab === "keuangan" || query.tab === "anggota" ? query.tab : "itinerary";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/trips/${tripId}`)}`);

  const { data: membership } = await supabase
    .from("trip_members")
    .select("role")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return (
      <DetailShell backHref="/trips">
        <h1 className="font-display text-[26px] leading-8 font-bold text-fg">
          Kamu belum jadi anggota trip ini
        </h1>
        <p className="text-[15px] leading-[22px] text-fg-muted">
          Minta tautan undangan ke temanmu, atau tempel kodenya di halaman gabung.
        </p>
        <Link
          href={
            query.code ? `/join?code=${encodeURIComponent(query.code)}` : "/join"
          }
          className="flex h-12 items-center justify-center rounded-md bg-action px-4 text-[15px] font-semibold text-white transition-colors hover:bg-action-hover"
        >
          Buka halaman gabung
        </Link>
      </DetailShell>
    );
  }

  const [{ data: trip }, { data: members }, { data: itineraryRows }, { data: expenseRows }] =
    await Promise.all([
      supabase
        .from("trips")
        .select("id, title, destination, start_date, end_date, invite_code")
        .eq("id", tripId)
        .maybeSingle(),
      supabase
        .from("trip_members")
        .select("user_id, role")
        .eq("trip_id", tripId),
      supabase
        .from("itinerary_items")
        .select("id, date, time, title, notes, location, sort_order")
        .eq("trip_id", tripId)
        .order("date", { ascending: true }),
      supabase
        .from("expenses")
        .select("id, title, amount, paid_by, date, category, kind")
        .eq("trip_id", tripId)
        .order("date", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

  if (!trip) {
    return (
      <DetailShell backHref="/trips">
        <h1 className="font-display text-[26px] leading-8 font-bold text-fg">
          Trip nggak ketemu
        </h1>
        <p className="text-[15px] leading-[22px] text-fg-muted">
          Mungkin trip-nya sudah dihapus pemiliknya.
        </p>
      </DetailShell>
    );
  }

  const memberList = members ?? [];
  const memberIds = memberList.map((m) => m.user_id);
  const memberCount = memberList.length;

  // Nama anggota diambil dari profiles yang boleh dibaca oleh sesama anggota
  // (policy `profiles_select_own_or_comember`). Bila kosong, tampilkan id pendek.
  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", memberIds.length > 0 ? memberIds : ["00000000-0000-0000-0000-000000000000"]);
  const nameById = new Map((profileRows ?? []).map((p) => [p.id, p.name]));
  const displayName = (id: string) => nameById.get(id) ?? `Anggota ${id.slice(0, 6)}`;

  const itineraryItems: ItineraryItem[] = (itineraryRows ?? []).map((row) => ({
    id: row.id,
    date: row.date,
    time: row.time,
    title: row.title,
    notes: row.notes,
    location: row.location,
    sortOrder: row.sort_order,
  }));
  const days = groupItineraryByDay(itineraryItems, trip.start_date, trip.end_date);
  const tripDayCount = eachDayInRange(trip.start_date, trip.end_date).length;

  const expenseList = expenseRows ?? [];
  const expenseIds = expenseList.map((e) => e.id);
  const { data: splitRows } = await supabase
    .from("expense_splits")
    .select("expense_id, user_id, share_amount")
    .in("expense_id", expenseIds.length > 0 ? expenseIds : ["00000000-0000-0000-0000-000000000000"]);
  const splitsByExpense = new Map<string, { user_id: string; share_amount: number }[]>();
  for (const row of splitRows ?? []) {
    const list = splitsByExpense.get(row.expense_id) ?? [];
    list.push({ user_id: row.user_id, share_amount: row.share_amount });
    splitsByExpense.set(row.expense_id, list);
  }

  // Non-settlement vs settlement dipisah untuk daftar + seksi collapsed
  // "Sudah diselesaikan" (PRD §4.5: FAB; baris lunas → seksi collapsed).
  const regularExpenses = expenseList.filter((e) => e.kind !== "settlement");
  const settlementRows = expenseList.filter((e) => e.kind === "settlement");

  const splitExpenses: SplitExpense[] = regularExpenses.map((e) => ({
    amount: Math.round(Number(e.amount)),
    paidBy: e.paid_by,
    participantIds: (splitsByExpense.get(e.id) ?? []).map((s) => s.user_id),
  })).filter((e) => e.participantIds.length > 0);

  const settlements: Transfer[] = expenseList
    .filter((e) => e.kind === "settlement")
    .map((e) => {
      const pair = splitsByExpense.get(e.id) ?? [];
      return { from: e.paid_by, to: pair[0]?.user_id ?? "", amount: Math.round(Number(e.amount)) };
    })
    .filter((s) => s.to !== "");

  const balances = computeBalances(splitExpenses, settlements);
  const suggestions = suggestSettlements(balances);

  const tripTotal = expenseList
    .filter((e) => e.kind !== "settlement")
    .reduce((sum, e) => sum + Math.round(Number(e.amount)), 0);

  const inviteUrl = `/join?code=${trip.invite_code}`;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-6 pb-16">
      <header className="flex flex-col gap-1">
        <Link
          href="/trips"
          className="text-[14px] font-semibold text-action underline underline-offset-4"
        >
          ← Semua trip
        </Link>
        <h1 className="font-display text-[26px] leading-8 font-bold text-fg">{trip.title}</h1>
        <p className="flex items-center gap-1 text-[14px] leading-5 text-fg-muted">
          <span aria-hidden>📍</span>
          <span>
            {trip.destination === null || trip.destination === ""
              ? "Destinasi belum diisi"
              : trip.destination}{" "}
            · {formatTripDate(trip.start_date)} – {formatTripDate(trip.end_date)}
          </span>
        </p>
        <p className="text-[13px] leading-5 text-slate-500">
          {tripDayCount} hari · {memberCount} anggota · Total {formatRupiah(tripTotal)}
        </p>
        <Link
          href={inviteUrl}
          className="mt-1 inline-flex h-11 w-fit items-center gap-1 rounded-md border border-lagoon-600 px-3 text-[14px] font-semibold text-action"
        >
          🔗 Undang teman
        </Link>
      </header>

      <TabNav tripId={tripId} active={tab} />

      {tab === "itinerary" && (
        <section className="flex flex-col gap-4">
          {days.map((day) => (
            <article
              key={day.date}
              className="rounded-lg border border-border bg-surface p-4 shadow-sm"
            >
              <h2 className="font-display text-[17px] leading-[22px] font-semibold text-fg">
                {formatDayLabel(day.date)}
              </h2>
              {day.items.length === 0 ? (
                <p className="mt-1 text-[14px] leading-5 text-fg-muted">
                  Belum ada agenda di hari ini.
                </p>
              ) : (
                <ul className="mt-2 flex flex-col gap-2">
                  {day.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-col gap-2 rounded-md border border-border px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[15px] leading-[21px] font-semibold text-fg">
                            {item.time !== null && (
                              <span className="mr-2 rounded bg-lagoon-50 px-1.5 py-0.5 text-[13px] font-bold text-action">
                                {item.time}
                              </span>
                            )}
                            {item.title}
                          </p>
                          {(item.location !== null && item.location !== "") ||
                          (item.notes !== null && item.notes !== "") ? (
                            <p className="mt-0.5 truncate text-[13px] leading-5 text-fg-muted">
                              {[item.location, item.notes].filter((v) => v !== null && v !== "").join(" · ")}
                            </p>
                          ) : null}
                        </div>
                        <DeleteItineraryButton tripId={tripId} itemId={item.id} />
                      </div>
                      <EditItineraryForm
                        tripId={tripId}
                        itemId={item.id}
                        startDate={trip.start_date}
                        endDate={trip.end_date}
                        defaultValues={{
                          date: item.date,
                          time: item.time ?? "",
                          title: item.title,
                          location: item.location ?? "",
                          notes: item.notes ?? "",
                        }}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
          <AddItineraryForm tripId={tripId} startDate={trip.start_date} endDate={trip.end_date} />
        </section>
      )}

      {tab === "keuangan" && (
        <section className="flex flex-col gap-4">
          <article className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <h2 className="font-display text-[17px] leading-[22px] font-semibold text-fg">
              Ringkasan
            </h2>
            <p className="mt-1 text-[15px] leading-[22px] text-fg">
              Total patungan: <strong>{formatRupiah(tripTotal)}</strong>
            </p>
            {memberIds.length === 0 ? null : (
              <ul className="mt-2 flex flex-col gap-1">
                {memberIds.map((id) => {
                  const balance = balances.get(id) ?? 0;
                  return (
                    <li key={id} className="text-[14px] leading-5 text-fg-muted">
                      <span className="font-semibold text-fg">{displayName(id)}</span>:{" "}
                      {balance === 0
                        ? "lunas 🎉"
                        : balance > 0
                          ? `menerima ${formatRupiah(balance)}`
                          : `menanggung ${formatRupiah(-balance)}`}
                    </li>
                  );
                })}
              </ul>
            )}
            {suggestions.length > 0 && (
              <div className="mt-2 rounded-md bg-sunset-50 px-3 py-2.5">
                <p className="text-[14px] leading-5 font-semibold text-fg">Saran transfer</p>
                <ul className="mt-1 flex flex-col gap-2">
                  {suggestions.map((s, index) => (
                    <li
                      key={`${s.from}-${s.to}-${index}`}
                      className="flex items-center justify-between gap-3 text-[14px] leading-5 text-fg"
                    >
                      <span>
                        {displayName(s.from)} → {displayName(s.to)}:{" "}
                        <strong>{formatRupiah(s.amount)}</strong>
                      </span>
                      <SettlementButton
                        tripId={tripId}
                        from={s.from}
                        to={s.to}
                        amount={s.amount}
                        label={`Tandai lunas: ${displayName(s.from)} ke ${displayName(s.to)} ${formatRupiah(s.amount)}`}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>

          {regularExpenses.length === 0 && settlementRows.length === 0 ? (
            <p className="rounded-lg border border-border bg-surface px-4 py-8 text-center text-[15px] text-fg-muted">
              Belum ada pengeluaran. Catat yang pertama di bawah ya.
            </p>
          ) : (
            <>
              {regularExpenses.length === 0 ? (
                <p className="rounded-lg border border-border bg-surface px-4 py-8 text-center text-[15px] text-fg-muted">
                  Semua pengeluaran sudah masuk daftar pelunasan di bawah.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {regularExpenses.map((expense) => {
                    const category = CATEGORY_BY_KEY.get(expense.category);
                    const splits = splitsByExpense.get(expense.id) ?? [];
                    return (
                      <li
                        key={expense.id}
                        className="rounded-lg border border-border bg-surface p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[15px] leading-[21px] font-semibold text-fg">
                              {expense.title}
                            </p>
                            <p className="mt-0.5 text-[13px] leading-5 text-fg-muted">
                              {category ? `${category.label} · ` : ""}
                              {displayName(expense.paid_by)} membayar · {formatTripDate(expense.date)} ·{" "}
                              {splits.length} orang
                            </p>
                          </div>
                          <p className="tnum shrink-0 text-[15px] leading-[21px] font-bold text-fg">
                            {formatRupiah(Math.round(Number(expense.amount)))}
                          </p>
                        </div>
                        <div className="mt-2">
                          <DeleteExpenseButton tripId={tripId} expenseId={expense.id} />
                        </div>
                        <div className="mt-2">
                          <EditExpenseForm
                            tripId={tripId}
                            expenseId={expense.id}
                            memberIds={memberIds}
                            displayNames={Object.fromEntries(
                              memberIds.map((id) => [id, displayName(id)]),
                            )}
                            defaultValues={{
                              title: expense.title,
                              amount: Math.round(Number(expense.amount)),
                              paidBy: expense.paid_by,
                              date: expense.date,
                              category: expense.category,
                              participantIds: splits.map((s) => s.user_id),
                            }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {settlementRows.length > 0 && (
                <details className="rounded-lg border border-border bg-surface shadow-sm">
                  <summary className="cursor-pointer list-none px-4 py-3 text-[15px] font-semibold text-action">
                    ✅ Sudah diselesaikan ({settlementRows.length})
                  </summary>
                  <ul className="flex flex-col gap-2 border-t border-border p-4">
                    {settlementRows.map((expense) => {
                      const splits = splitsByExpense.get(expense.id) ?? [];
                      const receiver = splits[0]?.user_id;
                      return (
                        <li
                          key={expense.id}
                          className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-[15px] leading-[21px] font-semibold text-fg">
                              {displayName(expense.paid_by)} →{" "}
                              {receiver ? displayName(receiver) : "?"}
                            </p>
                            <p className="mt-0.5 text-[13px] leading-5 text-fg-muted">
                              {formatTripDate(expense.date)}
                            </p>
                          </div>
                          <p className="tnum shrink-0 text-[15px] leading-[21px] font-bold text-fg">
                            {formatRupiah(Math.round(Number(expense.amount)))}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              )}
            </>
          )}

          <AddExpenseForm
            tripId={tripId}
            tripDate={trip.start_date}
            memberIds={memberIds}
            displayNames={Object.fromEntries(memberIds.map((id) => [id, displayName(id)]))}
            currentUserId={user.id}
          />
        </section>
      )}

      {tab === "anggota" && (
        <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm">
          <h2 className="font-display text-[17px] leading-[22px] font-semibold text-fg">
            Anggota ({memberCount})
          </h2>
          <ul className="flex flex-col gap-2">
            {memberList.map((member) => (
              <li key={member.user_id} className="flex items-center justify-between gap-3">
                <span className="text-[15px] leading-[21px] text-fg">
                  {displayName(member.user_id)}
                  {member.user_id === user.id && (
                    <span className="text-fg-muted"> (kamu)</span>
                  )}
                </span>
                <span
                  className={`flex h-6 shrink-0 items-center rounded-full px-2.5 text-[11px] leading-[14px] font-bold tracking-[0.08em] uppercase ${
                    member.role === "owner"
                      ? "bg-sunset-100 text-sunset-700"
                      : "bg-lagoon-50 text-action"
                  }`}
                >
                  {member.role === "owner" ? "👑 Owner" : "Member"}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href={inviteUrl}
            className="flex h-12 items-center justify-center rounded-md bg-action px-4 text-[15px] font-semibold text-white transition-colors hover:bg-action-hover"
          >
            🔗 Undang teman
          </Link>
        </section>
      )}
    </main>
  );
}

function DetailShell({ backHref, children }: { backHref: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-12">
      <Link
        href={backHref}
        className="text-[14px] font-semibold text-action underline underline-offset-4"
      >
        ← Kembali
      </Link>
      {children}
    </main>
  );
}
