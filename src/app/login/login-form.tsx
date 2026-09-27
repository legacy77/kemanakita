"use client";

import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "@/lib/auth/actions";

const initialState: LoginState = { status: "idle" };

// Form masuk (client) — design_system §8.2: input 16px agar iOS tak auto-zoom.
// Server action memvalidasi ulang di server (validasi klien hanya UX).

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, action, pending] = useActionState(sendMagicLink, initialState);

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
        Nama (opsional)
        <input
          name="name"
          type="text"
          autoComplete="name"
          maxLength={80}
          placeholder="Misalnya: Dhika"
          className="h-12 rounded-md border border-border bg-surface px-3.5 text-[16px] font-normal text-fg outline-none placeholder:text-sand-500 focus:border-lagoon-600 focus:ring-2 focus:ring-lagoon-600/20"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="kamu@email.com"
          className="h-12 rounded-md border border-border bg-surface px-3.5 text-[16px] font-normal text-fg outline-none placeholder:text-sand-500 focus:border-lagoon-600 focus:ring-2 focus:ring-lagoon-600/20"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-md bg-action px-4 text-[15px] font-semibold text-white transition-colors hover:bg-action-hover disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Mengirim…" : "Kirim tautan masuk"}
      </button>

      {initialError && state.status === "idle" && (
        <p role="alert" className="flex items-start gap-2 rounded-md bg-danger-bg px-3 py-3 text-[14px] text-danger">
          <span aria-hidden>⚠️</span>
          {initialError}
        </p>
      )}

      {state.status === "sent" && (
        <p role="status" className="flex items-start gap-2 rounded-md bg-lagoon-50 px-3 py-3 text-[14px] text-action">
          <span aria-hidden>✉️</span>
          <span>
            Tautan masuk sudah dikirim ke <strong>{state.email}</strong>. Cek inbox atau folder
            spam ya.
          </span>
        </p>
      )}

      {state.status === "error" && (
        <p role="alert" className="flex items-start gap-2 rounded-md bg-danger-bg px-3 py-3 text-[14px] text-danger">
          <span aria-hidden>⚠️</span>
          {state.message}
        </p>
      )}
    </form>
  );
}
