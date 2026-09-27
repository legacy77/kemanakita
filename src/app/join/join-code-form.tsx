"use client";

import { useActionState } from "react";
import { joinTripByCode, type JoinState } from "@/lib/trips/join";

const initialState: JoinState = { status: "idle" };

// Form kode manual buat halaman /join tanpa `?code=`.
// Mengirim field `code` ke server action yang sama seperti tombol gabung.

export function JoinCodeForm() {
  const [state, action, pending] = useActionState(joinTripByCode, initialState);

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
        Kode undangan
        <input
          name="code"
          type="text"
          required
          autoCapitalize="none"
          autoCorrect="off"
          inputMode="text"
          placeholder="Misalnya: a1b2c3d4e5f6"
          className="h-12 rounded-md border border-border bg-surface px-3.5 text-[16px] font-normal outline-none placeholder:text-sand-500 focus:border-lagoon-600 focus:ring-2 focus:ring-lagoon-600/20"
        />
      </label>

      {state.status === "error" && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md bg-danger-bg px-3 py-2.5 text-[14px] text-danger"
        >
          <span aria-hidden>⚠️</span>
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 items-center justify-center rounded-md bg-action px-4 text-[15px] font-semibold text-white transition-colors hover:bg-action-hover disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Ngecek kode…" : "Cek & gabung"}
      </button>
    </form>
  );
}
