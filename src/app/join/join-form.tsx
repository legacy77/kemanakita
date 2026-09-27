"use client";

import { useActionState } from "react";
import { joinTripByCode, type JoinState } from "@/lib/trips/join";

const initialState: JoinState = { status: "idle" };

// Tombol gabung (client) untuk halaman /join saat user sudah login.
// Server action memvalidasi ulang kode di server (validasi klien cuma UX).

export function JoinForm({ code }: { code: string }) {
  const [state, action, pending] = useActionState(joinTripByCode, initialState);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="code" value={code} />

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
        {pending ? "Bergabung…" : "Gabung trip ini"}
      </button>
    </form>
  );
}
