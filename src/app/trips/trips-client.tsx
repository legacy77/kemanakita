"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createTrip, type CreateTripState } from "@/lib/trips/actions";
import { signOut } from "@/lib/auth/actions";

export interface TripCard {
  id: string;
  title: string;
  destination: string | null;
  dateLabel: string;
  inviteCode: string;
  role: "owner" | "member";
}

const initialState: CreateTripState = { status: "idle" };

// Halaman /trips (client): daftar trip + form buat trip inline.
// design_system: kartu radius-lg, tombol h-12 penuh di HP, empty state santai.

export function TripsPageClient({
  userName,
  email,
  trips,
}: {
  userName: string;
  email: string;
  trips: TripCard[];
}) {
  const [state, action, pending] = useActionState(createTrip, initialState);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState(userName);
  const [copied, setCopied] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "created") router.push(`/trips/${state.tripId}`);
  }, [state, router]);

  function copyInvite(code: string) {
    const url = `${window.location.origin}/join?code=${code}`;
    void navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(code);
        setTimeout(() => setCopied((c) => (c === code ? null : c)), 3000);
      })
      .catch(() => setCopied(null));
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6 pb-16">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="rpg-ribbon mb-1">🧭 Party Kamu</span>
          <p className="text-[12px] font-medium tracking-[0.01em] text-ink-600">
            Halo, {name === "" ? "teman jalan" : name}! 👋
          </p>
          <h1 className="font-display truncate text-[26px] leading-8 font-extrabold text-action">
            Trip kamu
          </h1>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="rpg-btn flex h-11 shrink-0 items-center rounded-md border-2 border-border-strong px-3 text-[14px] font-semibold text-slate-700"
        >
          Keluar
        </button>
      </header>

      {trips.length === 0 ? (
        <section className="rpg-panel flex flex-col items-center gap-3 px-4 py-12 text-center">
          <p aria-hidden className="text-[40px] leading-none">
            🧳
          </p>
          <h2 className="font-display text-[20px] leading-[26px] font-semibold text-fg">
            Belum ada rencana. Yuk bikin trip pertama kita!
          </h2>
          <p className="max-w-xs text-[15px] leading-[22px] text-fg-muted">
            Buat trip di bawah, lalu undang temanmu lewat tautan undangan.
          </p>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {trips.map((trip) => (
            <li key={trip.id} className="rpg-panel p-4">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/trips/${trip.id}`} className="min-w-0 flex-1">
                  <h2 className="font-display truncate text-[20px] leading-[26px] font-semibold text-fg">
                    {trip.title}
                  </h2>
                  <p className="mt-1 flex items-center gap-1 text-[12px] leading-4 font-medium text-ink-600">
                    <span aria-hidden>📍</span>
                    <span className="truncate">
                      {trip.destination === null || trip.destination === ""
                        ? "Destinasi belum diisi"
                        : trip.destination}
                      {trip.dateLabel === "" ? "" : ` · ${trip.dateLabel}`}
                    </span>
                  </p>
                </Link>
                {trip.role === "owner" && (
                  <span className="flex h-6 shrink-0 items-center rounded-full bg-sunset-100 px-2.5 text-[11px] leading-[14px] font-bold tracking-[0.08em] text-sunset-700 uppercase">
                    👑 Owner
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Link
                  href={`/trips/${trip.id}`}
                  className="rpg-btn flex h-11 flex-1 items-center justify-center rounded-md bg-action px-4 text-[15px] font-semibold text-white transition-colors hover:bg-action-hover"
                >
                  Buka trip
                </Link>
                <button
                  type="button"
                  onClick={() => copyInvite(trip.inviteCode)}
                  className="rpg-btn flex h-11 shrink-0 items-center gap-1 rounded-md border-2 border-sky-600 px-3 text-[14px] font-bold text-action"
                  aria-label={`Salin tautan undangan ${trip.title}`}
                >
                  {copied === trip.inviteCode ? "✅ Tersalin!" : "🔗 Undang"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="rpg-panel p-4">
        {formOpen ? (
          <form action={action} className="flex flex-col gap-3">
            <h2 className="font-display text-[20px] leading-[26px] font-semibold text-fg">
              Bikin trip baru
            </h2>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
              Judul trip
              <input
                name="title"
                type="text"
                required
                maxLength={120}
                placeholder="Misalnya: Bali 3D2N"
                className="h-12 rounded-md border-2 border-border-strong bg-surface px-3.5 text-[16px] font-normal outline-none placeholder:text-parch-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
              Destinasi
              <input
                name="destination"
                type="text"
                maxLength={120}
                placeholder="Misalnya: Bali"
                className="h-12 rounded-md border-2 border-border-strong bg-surface px-3.5 text-[16px] font-normal outline-none placeholder:text-parch-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
                Mulai
                <input
                  name="startDate"
                  type="date"
                  required
                  className="h-12 rounded-md border border-border bg-surface px-3.5 text-[16px] font-normal outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
                Selesai
                <input
                  name="endDate"
                  type="date"
                  required
                  className="h-12 rounded-md border border-border bg-surface px-3.5 text-[16px] font-normal outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25"
                />
              </label>
            </div>
            {state.status === "error" && (
              <p role="alert" className="flex items-start gap-2 rounded-md bg-danger-bg px-3 py-2.5 text-[14px] text-danger">
                <span aria-hidden>⚠️</span>
                {state.message}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rpg-btn flex h-12 flex-1 items-center justify-center rounded-md border-2 border-border-strong px-4 text-[15px] font-semibold text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rpg-btn flex h-12 flex-1 items-center justify-center rounded-md bg-action px-4 text-[15px] font-semibold text-white transition-colors hover:bg-action-hover disabled:cursor-wait disabled:opacity-60"
              >
                {pending ? "Membuat…" : "Bikin trip"}
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="rpg-btn flex h-12 w-full items-center justify-center gap-2 rounded-md bg-action px-4 text-[15px] font-semibold text-white transition-colors hover:bg-action-hover"
          >
            <span aria-hidden>➕</span> Bikin trip baru
          </button>
        )}
      </section>

      <footer className="text-center text-[12px] leading-4 text-ink-600">
        Masuk sebagai {email}
        <span className="mx-2" aria-hidden>
          ·
        </span>
        Punya kode undangan?{" "}
        <Link href="/join" className="font-semibold text-action underline underline-offset-4">
          Gabung trip
        </Link>
        <label className="mt-3 flex items-center justify-center gap-2 text-[13px] text-ink-600">
          Nama tampilan:
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="Nama kamu"
            className="h-9 w-36 rounded-md border border-border bg-surface px-2 text-[14px] outline-none focus:border-lagoon-600"
          />
        </label>
      </footer>
    </main>
  );
}
