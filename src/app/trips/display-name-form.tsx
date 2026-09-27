"use client";

// Form "Nama tampilan" (client) — PRD §4.1 "Profil sederhana: nama tampilan".
// Menggantikan input lokal sebelumnya: sekarang persist ke `profiles.name`
// lewat server action `updateDisplayName` (validasi server + feedback).
// Pola sama dengan form lain: `useActionState` + pesan error/sukses inline.

import { useActionState } from "react";
import { updateDisplayName, type UpdateNameState } from "@/lib/profile/actions";

const initialState: UpdateNameState = { status: "idle" };

export function DisplayNameForm({ initialName }: { initialName: string }) {
  const [state, action, pending] = useActionState(updateDisplayName, initialState);

  return (
    <form action={action} className="flex flex-col items-center gap-2">
      <label className="flex items-center justify-center gap-2 text-[13px] text-ink-600">
        Nama tampilan:
        <input
          name="name"
          defaultValue={initialName}
          maxLength={80}
          required
          placeholder="Nama kamu"
          className="h-9 w-40 rounded-md border border-border bg-surface px-2 text-[14px] text-fg outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-9 shrink-0 rounded-md border-2 border-action px-3 text-[13px] font-semibold text-action transition-colors hover:bg-sky-100 disabled:opacity-60"
        >
          {pending ? "Menyimpan…" : "Simpan"}
        </button>
      </label>
      {state.status === "error" && (
        <p role="alert" className="text-[13px] text-danger">
          {state.message}
        </p>
      )}
      {state.status === "ok" && (
        <p role="status" className="text-[13px] font-semibold text-success">
          Nama tersimpan.
        </p>
      )}
    </form>
  );
}
