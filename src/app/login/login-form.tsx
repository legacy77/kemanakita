"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  createPinAccount,
  signInWithPin,
  type LoginState,
} from "@/lib/auth/actions";

const initialState: LoginState = { status: "idle" };

// Kelas input dipakai bersama agar styling konsisten (design_system §8.2:
// tinggi 48px & font 16px supaya iOS tidak auto-zoom saat fokus).
const INPUT_CLASS =
  "h-12 rounded-md border border-border bg-surface px-3.5 text-[16px] font-normal text-fg outline-none placeholder:text-sand-500 focus:border-lagoon-600 focus:ring-2 focus:ring-lagoon-600/20";
const LABEL_CLASS = "flex flex-col gap-1.5 text-[13px] font-semibold text-fg";
const BUTTON_CLASS =
  "h-12 rounded-md bg-action px-4 text-[15px] font-semibold text-white transition-colors hover:bg-action-hover disabled:cursor-wait disabled:opacity-60";

type Tab = "masuk" | "daftar";

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [tab, setTab] = useState<Tab>("masuk");

  // Dua action terpisah: "Masuk" pakai PIN, "Daftar" bikin akun + PIN.
  const [loginState, loginAction, loginPending] = useActionState(
    signInWithPin,
    initialState,
  );
  const [registerState, registerAction, registerPending] = useActionState(
    createPinAccount,
    initialState,
  );

  // Prefill email di tab Masuk setelah daftar / klik "Langsung masuk".
  const [prefillEmail, setPrefillEmail] = useState("");

  if (registerState.status === "created") {
    return (
      <PinCreated
        pin={registerState.pin}
        email={registerState.email}
        next={next}
        onGoToLogin={() => {
          setPrefillEmail(registerState.email);
          setTab("masuk");
        }}
      />
    );
  }

  const pending = tab === "masuk" ? loginPending : registerPending;
  const state = tab === "masuk" ? loginState : registerState;

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <div
        role="tablist"
        aria-label="Pilih masuk atau daftar"
        className="grid grid-cols-2 gap-1 rounded-md bg-sand-100 p-1"
      >
        {(["masuk", "daftar"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={
              "h-10 rounded-[6px] text-[14px] font-semibold transition-colors " +
              (tab === key ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg")
            }
          >
            {key === "masuk" ? "Masuk" : "Daftar"}
          </button>
        ))}
      </div>

      {tab === "masuk" ? (
        <form key="masuk" action={loginAction} className="flex flex-col gap-4">
          <input type="hidden" name="next" value={next} />

          <label className={LABEL_CLASS}>
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              defaultValue={prefillEmail}
              placeholder="kamu@email.com"
              className={INPUT_CLASS}
            />
          </label>

          <label className={LABEL_CLASS}>
            PIN (6 digit)
            <input
              name="pin"
              type="password"
              required
              autoComplete="current-password"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="••••••"
              className={INPUT_CLASS}
            />
          </label>

          <button type="submit" disabled={pending} className={BUTTON_CLASS}>
            {pending ? "Masuk…" : "Masuk"}
          </button>

          <p className="text-center text-[13px] text-fg-muted">
            Lupa PIN? Minta admin reset ya.
          </p>
        </form>
      ) : (
        <form key="daftar" action={registerAction} className="flex flex-col gap-4">
          <label className={LABEL_CLASS}>
            Nama
            <input
              name="name"
              type="text"
              required
              autoComplete="name"
              maxLength={80}
              placeholder="Misalnya: Dhika"
              className={INPUT_CLASS}
            />
          </label>

          <label className={LABEL_CLASS}>
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder="kamu@email.com"
              className={INPUT_CLASS}
            />
          </label>

          <button type="submit" disabled={pending} className={BUTTON_CLASS}>
            {pending ? "Membuat akun…" : "Daftar & dapat PIN"}
          </button>

          <p className="text-center text-[13px] text-fg-muted">
            Cukup sekali. Kamu langsung dapat PIN 6 digit.
          </p>
        </form>
      )}

      {tab === "masuk" && initialError && state.status === "idle" && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md bg-danger-bg px-3 py-3 text-[14px] text-danger"
        >
          <span aria-hidden>⚠️</span>
          {initialError}
        </p>
      )}

      {state.status === "error" && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md bg-danger-bg px-3 py-3 text-[14px] text-danger"
        >
          <span aria-hidden>⚠️</span>
          {state.message}
        </p>
      )}
    </div>
  );
}

/** Kartu PIN setelah akun dibuat: tampil sekali + tombol salin. */
function PinCreated({
  pin,
  email,
  next,
  onGoToLogin,
}: {
  pin: string;
  email: string;
  next: string;
  onGoToLogin: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <div className="rounded-md border border-border bg-surface p-4 text-center">
        <p className="text-[13px] font-semibold text-fg-muted">PIN kamu</p>
        <p className="mt-1 font-display text-[34px] leading-tight font-bold tracking-[0.2em] text-fg">
          {pin}
        </p>
        <button
          type="button"
          onClick={copy}
          className="mt-3 h-12 w-full rounded-md border border-border bg-surface px-4 text-[15px] font-semibold text-action transition-colors hover:bg-sand-100"
        >
          {copied ? "Tersalin ✓" : "Salin PIN"}
        </button>
      </div>

      <p
        role="alert"
        className="flex items-start gap-2 rounded-md bg-danger-bg px-3 py-3 text-[14px] text-danger"
      >
        <span aria-hidden>⚠️</span>
        <span>
          Catat PIN ini sekarang — <strong>nggak ditampilkan lagi</strong>. Simpan di catatan
          atau password manager.
        </span>
      </p>

      <Link
        href={`/login?next=${encodeURIComponent(next)}`}
        onClick={onGoToLogin}
        className="flex h-12 items-center justify-center rounded-md bg-action px-4 text-[15px] font-semibold text-white transition-colors hover:bg-action-hover"
      >
        Langsung masuk
      </Link>

      <p className="text-center text-[13px] text-fg-muted">
        Masuk berikutnya cukup <strong>{email}</strong> + PIN.
      </p>
    </div>
  );
}
