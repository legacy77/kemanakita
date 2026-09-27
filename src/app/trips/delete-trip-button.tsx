"use client";

// Tombol hapus trip (client) — PRD §4.2 "Owner dapat menghapus trip".
// Hanya dirender untuk owner (diputuskan di server component dari `role`).
// Konfirmasi dua langkah: klik "Hapus trip" → tampil ringkasan + tombol
// konfirmasi/batal, supaya tidak terhapus karena salah sentuh di HP.
// Otoritas tetap di RLS `trips_delete_owner`; tombol hanya menyembunyikan
// aksi yang pasti ditolak agar UI jujur.

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteTrip } from "@/lib/trips/actions";

function ConfirmButtons({ tripTitle }: { tripTitle: string }) {
  const { pending } = useFormStatus();
  return (
    <div className="mt-2 flex flex-col gap-2 rounded-md border-2 border-danger/40 bg-danger-bg p-3">
      <p className="text-[13px] leading-5 text-danger">
        Hapus trip <span className="font-bold">{tripTitle}</span>? Semua itinerary,
        pengeluaran, dan anggota di dalamnya ikut terhapus.
      </p>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex h-11 flex-1 items-center justify-center rounded-md bg-danger px-4 text-[14px] font-bold text-white disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Menghapus…" : "Ya, hapus"}
        </button>
      </div>
    </div>
  );
}

export function DeleteTripButton({
  tripId,
  tripTitle,
}: {
  tripId: string;
  tripTitle: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex h-9 shrink-0 items-center gap-1 rounded-md border-2 border-danger/40 px-3 text-[13px] font-semibold text-danger transition-colors hover:bg-danger-bg"
      >
        <span aria-hidden>🗑️</span> Hapus
      </button>
    );
  }

  return (
    <form action={deleteTrip}>
      <input type="hidden" name="tripId" value={tripId} />
      <ConfirmButtons tripTitle={tripTitle} />
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="mt-2 h-9 w-full rounded-md border-2 border-border-strong bg-surface px-3 text-[13px] font-semibold text-ink-700"
      >
        Batal
      </button>
    </form>
  );
}
