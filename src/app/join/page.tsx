import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { validateInviteCode } from "@/lib/validate";
import { formatTripDate } from "@/lib/itinerary";
import type { ReactNode } from "react";
import { JoinForm } from "./join-form";
import { JoinCodeForm } from "./join-code-form";

export const metadata = { title: "Gabung trip — KemanaKita" };

// Halaman undangan (PRD §4.3, §5.2).
// Alur: buka /join?code=… → (belum login) masuk dulu → balik ke sini → auto-join.
// Non-member boleh melihat judul/tanggal trip lewat RPC aman `get_trip_by_invite`
// (SECURITY DEFINER, kode 12-hex acak) — RLS tetap menyembunyikan isi trip.

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  const rawCode = (params.code ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belum ada kode sama sekali → tampilkan form isi kode manual.
  if (rawCode.trim() === "") {
    return (
      <Shell>
        <h1 className="font-display text-[26px] leading-8 font-bold text-fg">
          Gabung trip
        </h1>
        <p className="text-[15px] leading-[22px] text-fg-muted">
          Punya kode undangan dari temanmu? Tempel di bawah, ya.
        </p>
        {user ? (
          <JoinCodeForm />
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-[15px] leading-[22px] text-fg-muted">
              Masuk dulu baru bisa gabung trip.
            </p>
            <Link
              href={`/login?next=${encodeURIComponent("/join")}`}
              className="rpg-btn flex h-12 items-center justify-center rounded-md bg-action px-4 text-[15px] font-semibold text-white transition-colors hover:bg-action-hover"
            >
              Masuk dulu
            </Link>
          </div>
        )}
      </Shell>
    );
  }

  const checked = validateInviteCode(rawCode);

  // Kode tidak valid → pesan jelas + tombol minta kode baru (PRD §5.2).
  if (!checked.ok) {
    return (
      <Shell>
        <h1 className="font-display text-[26px] leading-8 font-bold text-fg">
          Kode tidak valid
        </h1>
        <p className="text-[15px] leading-[22px] text-fg-muted">
          Kode undangannya kelihatan salah atau sudah kedaluwarsa. Minta kode baru ke
          temanmu ya.
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href="/join"
            className="rpg-btn flex h-12 items-center justify-center rounded-md bg-action px-4 text-[15px] font-semibold text-white transition-colors hover:bg-action-hover"
          >
            Masukkan kode manual
          </Link>
          <Link
            href="/trips"
            className="flex h-12 items-center justify-center rounded-md border-2 border-border-strong bg-surface px-4 text-[15px] font-semibold text-ink-700"
          >
            Ke trip saya
          </Link>
        </div>
      </Shell>
    );
  }

  const code = checked.value;

  // Preview trip (judul/destinasi/tanggal) tanpa membocorkan isi trip.
  const { data: rpc } = await supabase.rpc("get_trip_by_invite", { p_code: code });
  const preview = Array.isArray(rpc) ? rpc[0] : undefined;

  if (!preview) {
    return (
      <Shell>
        <h1 className="font-display text-[26px] leading-8 font-bold text-fg">
          Kode nggak ketemu
        </h1>
        <p className="text-[15px] leading-[22px] text-fg-muted">
          Kode <span className="font-semibold">{code}</span> belum terdaftar. Cek lagi
          huruf-hurufnya, atau minta kode baru.
        </p>
        <Link
          href="/join"
          className="rpg-btn flex h-12 items-center justify-center rounded-md bg-action px-4 text-[15px] font-semibold text-white transition-colors hover:bg-action-hover"
        >
          Coba kode lain
        </Link>
      </Shell>
    );
  }

  const dateLabel =
    preview.start_date && preview.end_date
      ? `${formatTripDate(preview.start_date)} – ${formatTripDate(preview.end_date)}`
      : "";

  return (
    <Shell>
      <p className="text-[13px] leading-5 font-medium tracking-[0.01em] text-slate-500">
        Kamu diundang ke
      </p>
      <h1 className="font-display text-[26px] leading-8 font-bold text-fg">
        {preview.title}
      </h1>
      <p className="flex items-center gap-1 text-[15px] leading-[22px] text-fg-muted">
        <span aria-hidden>📍</span>
        <span>
          {preview.destination && preview.destination !== ""
            ? preview.destination
            : "Destinasi belum diisi"}
          {dateLabel === "" ? "" : ` · ${dateLabel}`}
        </span>
      </p>

      {user ? (
        <JoinForm code={code} />
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-[15px] leading-[22px] text-fg-muted">
            Masuk dulu buat gabung, ya. Setelah masuk kamu langsung masuk ke trip ini.
          </p>
          <Link
            href={`/login?next=${encodeURIComponent(`/join?code=${code}`)}`}
            className="rpg-btn flex h-12 items-center justify-center rounded-md bg-action px-4 text-[15px] font-semibold text-white transition-colors hover:bg-action-hover"
          >
            Masuk buat gabung
          </Link>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <div className="rpg-panel flex flex-col gap-4 p-5">{children}</div>
    </main>
  );
}
