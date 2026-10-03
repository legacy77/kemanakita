"use client";

// Tombol hapus trip (client) — PRD §4.2 "Owner dapat menghapus trip".
// Hanya dirender untuk owner (diputuskan di server component dari `role`).
// Klik "Hapus" → dialog konfirmasi (ConfirmDialog) supaya tidak terhapus
// karena salah sentuh di HP. Konfirmasi memicu submit form native via
// requestSubmit agar `deleteTrip` dan status pending tetap jalan.
// Otoritas tetap di RLS `trips_delete_owner`; tombol hanya menyembunyikan
// aksi yang pasti ditolak agar UI jujur.

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteTrip } from "@/lib/trips/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";

// Perlu komponen anak di dalam <form> agar useFormStatus baca pending.
function DeleteConfirm({
  open,
  tripTitle,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  tripTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { pending } = useFormStatus();
  return (
    <ConfirmDialog
      open={open}
      title={`Hapus trip "${tripTitle}"?`}
      description="Trip beserta semua itinerary, pengeluaran, dan data anggota di dalamnya ikut terhapus permanen dan tidak bisa dibatalkan."
      confirmLabel="Ya, hapus"
      cancelLabel="Batal"
      pending={pending}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}

export function DeleteTripButton({
  tripId,
  tripTitle,
}: {
  tripId: string;
  tripTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 min-h-[44px] shrink-0 items-center gap-1 rounded-md border-2 border-danger/40 px-3 text-[13px] font-semibold text-danger transition-colors hover:bg-danger-bg"
      >
        <span aria-hidden>🗑️</span> Hapus
      </button>
      <form ref={formRef} action={deleteTrip}>
        <input type="hidden" name="tripId" value={tripId} />
        <DeleteConfirm
          open={open}
          tripTitle={tripTitle}
          onCancel={() => setOpen(false)}
          onConfirm={() => formRef.current?.requestSubmit()}
        />
      </form>
    </>
  );
}
