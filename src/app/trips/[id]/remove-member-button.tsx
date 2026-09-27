"use client";

// Tombol kelola anggota (client) — PRD §7.4.
// Owner boleh mengeluarkan anggota lain; anggota boleh keluar sendiri.
// Otoritas tetap di RLS `trip_members_delete_owner_or_self`; tombol hanya
// menyembunyikan aksi yang pasti ditolak agar UI jujur.

import { useFormStatus } from "react-dom";
import { removeMember } from "@/lib/trips/actions";

function SubmitButton({ label, danger }: { label: string; danger: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`h-8 shrink-0 rounded-md px-3 text-[13px] font-semibold disabled:opacity-60 ${
        danger
          ? "border-2 border-danger/50 text-danger hover:bg-danger-bg"
          : "border-2 border-border-strong text-fg-muted hover:bg-sky-100"
      }`}
    >
      {pending ? "…" : label}
    </button>
  );
}

export function RemoveMemberButton({
  tripId,
  targetUserId,
  targetName,
  isSelf,
}: {
  tripId: string;
  targetUserId: string;
  targetName: string;
  isSelf: boolean;
}) {
  return (
    <form action={removeMember}>
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="targetUserId" value={targetUserId} />
      {isSelf ? (
        <SubmitButton label="Keluar" danger={false} />
      ) : (
        <SubmitButton label={`Keluarkan ${targetName}`} danger />
      )}
    </form>
  );
}
