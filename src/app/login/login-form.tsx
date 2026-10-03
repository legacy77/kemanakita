"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import {
  createPinAccount,
  signInWithPin,
  type LoginState,
} from "@/lib/auth/actions";

const initialState: LoginState = { status: "idle" };

// Kelas input dipakai bersama agar styling konsisten (design_system §8.2:
// tinggi 48px & font 16px supaya iOS tidak auto-zoom saat fokus).
// Gaya RPG: border tebal 2px, permukaan kertas, fokus ring biru langit.
const INPUT_CLASS =
  "h-12 rounded-md border-2 border-border-strong bg-surface px-3.5 text-[16px] font-normal text-fg outline-none placeholder:text-parch-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25";
const LABEL_CLASS = "flex flex-col gap-1.5 text-[13px] font-bold text-fg";
const BUTTON_CLASS =
  "rpg-btn h-12 rounded-md bg-action px-4 text-[15px] font-bold text-white shadow-md hover:bg-action-hover disabled:cursor-wait disabled:opacity-60";

type Tab = "masuk" | "daftar";

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [tab, setTab] = useState<Tab>("masuk");
  const order: Tab[] = ["masuk", "daftar"];
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function focusTab(index: number) {
    tabRefs.current[((index % order.length) + order.length) % order.length]?.focus();
  }

  function onTabKeyDown(key: string, index: number) {
    if (key === "ArrowRight") focusTab(index + 1);
    else if (key === "ArrowLeft") focusTab(index - 1);
    else if (key === "Home") focusTab(0);
    else if (key === "End") focusTab(order.length - 1);
  }

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
    <div className="rpg-panel flex w-full max-w-sm flex-col gap-4 p-4">
      <div
        role="tablist"
        aria-label="Pilih masuk atau daftar"
        className="grid grid-cols-2 gap-1 rounded-md border-2 border-border-strong bg-parch-200 p-1"
      >
        {order.map((key, index) => (
          <button
            key={key}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            id={`tab-${key}`}
            type="button"
            role="tab"
            aria-selected={tab === key}
            aria-controls={`panel-${key}`}
            tabIndex={tab === key ? 0 : -1}
            onClick={() => setTab(key)}
            onKeyDown={(e) => onTabKeyDown(e.key, index)}
            className={
              "h-12 rounded-[8px] text-[14px] font-bold transition-colors " +
              (tab === key
                ? "bg-action text-white shadow-sm"
                : "text-ink-600 hover:text-ink-900")
            }
          >
            {key === "masuk" ? "🔑 Masuk" : "✨ Daftar"}
          </button>
        ))}
      </div>

      {tab === "masuk" ? (
        <form
          key="masuk"
          id="panel-masuk"
          role="tabpanel"
          aria-labelledby="tab-masuk"
          action={loginAction}
          className="flex flex-col gap-4"
        >
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
              aria-invalid={state.status === "error"}
              aria-describedby={state.status === "error" ? "login-error" : undefined}
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
              aria-invalid={state.status === "error"}
              aria-describedby={state.status === "error" ? "login-error" : undefined}
              className={INPUT_CLASS}
            />
          </label>

          <button type="submit" disabled={pending} className={BUTTON_CLASS}>
            {pending ? "Masuk…" : "▶ Masuk"}
          </button>

          <p className="text-center text-[13px] text-fg-muted">
            Lupa PIN? Hubungi admin lewat grup trip buat minta reset PIN, ya.
          </p>
        </form>
      ) : (
        <form
          key="daftar"
          id="panel-daftar"
          role="tabpanel"
          aria-labelledby="tab-daftar"
          action={registerAction}
          className="flex flex-col gap-4"
        >
          <label className={LABEL_CLASS}>
            Nama
            <input
              name="name"
              type="text"
              required
              autoComplete="name"
              maxLength={80}
              placeholder="Misalnya: Dhika"
              aria-invalid={state.status === "error"}
              aria-describedby={state.status === "error" ? "login-error" : undefined}
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
              aria-invalid={state.status === "error"}
              aria-describedby={state.status === "error" ? "login-error" : undefined}
              className={INPUT_CLASS}
            />
          </label>

          <button type="submit" disabled={pending} className={BUTTON_CLASS}>
            {pending ? "Membuat akun…" : "✨ Daftar & dapat PIN"}
          </button>

          <p className="text-center text-[13px] text-fg-muted">
            Cukup sekali. Kamu langsung dapat PIN 6 digit.
          </p>
        </form>
      )}

      {tab === "masuk" && initialError && state.status === "idle" && (
        <p
          id="login-error"
          role="alert"
          className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger-bg px-3 py-3 text-[14px] text-danger"
        >
          <span aria-hidden>⚠️</span>
          {initialError}
        </p>
      )}

      {state.status === "error" && (
        <p
          id="login-error"
          role="alert"
          className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger-bg px-3 py-3 text-[14px] text-danger"
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
  const [copyFailed, setCopyFailed] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      setCopied(false);
      setCopyFailed(true);
    }
  }

  return (
    <div className="rpg-panel flex w-full max-w-sm flex-col gap-4 p-4">
      <div className="rpg-panel-sky relative rounded-lg p-4 text-center">
        <p className="text-[12px] font-bold tracking-[0.08em] text-white/90 uppercase">
          🎁 PIN Kamu
        </p>
        <p className="mt-1 font-display text-[38px] leading-tight font-extrabold tracking-[0.22em] text-white drop-shadow-[0_2px_0_rgba(14,37,73,0.35)]">
          {pin}
        </p>
        <button
          type="button"
          onClick={copy}
          className="rpg-btn mt-3 h-12 w-full rounded-md border-2 border-white/70 bg-white/15 px-4 text-[15px] font-bold text-white hover:bg-white/25"
        >
          {copied ? "✓ Tersalin" : "📋 Salin PIN"}
        </button>
      </div>

      <p
        role="alert"
        className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger-bg px-3 py-3 text-[14px] text-danger"
      >
        <span aria-hidden>⚠️</span>
        <span>
          Catat PIN ini sekarang — <strong>nggak ditampilkan lagi</strong>. Simpan di catatan
          atau password manager.
        </span>
      </p>

      {copyFailed && (
        <p className="text-center text-[12px] leading-4 text-fg-muted">
          Gagal menyalin otomatis — tekan lama PIN di atas buat menyalin manual.
        </p>
      )}

      <Link
        href={`/login?next=${encodeURIComponent(next)}`}
        onClick={onGoToLogin}
        className="rpg-btn flex h-12 items-center justify-center rounded-md bg-action px-4 text-[15px] font-bold text-white shadow-md hover:bg-action-hover"
      >
        ▶ Langsung masuk
      </Link>

      <p className="text-center text-[13px] text-fg-muted">
        Masuk berikutnya cukup <strong>{email}</strong> + PIN.
      </p>
    </div>
  );
}
