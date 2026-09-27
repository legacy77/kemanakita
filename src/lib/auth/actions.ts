"use server";

// Auth server actions — magic link (OTP email) + keluar.
// Rujukan: PRD §4.1, §7.2. Hanya anon key — service key TIDAK dipakai.

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type LoginState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "sent"; email: string };

/** Origin publik request (untuk `emailRedirectTo`). */
async function requestOrigin(): Promise<string | null> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return null;
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Hanya izinkan path internal relatif (cegah open redirect). */
function safeNext(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/trips";
  return value;
}

export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const next = safeNext(String(formData.get("next") ?? "/trips"));

  if (!EMAIL_PATTERN.test(email)) {
    return { status: "error", message: "Email-nya kayaknya typo. Cek lagi ya." };
  }
  if (name.length > 80) {
    return { status: "error", message: "Nama kepanjangan, maksimal 80 karakter." };
  }

  const origin = await requestOrigin();
  if (!origin) {
    return { status: "error", message: "Gagal kirim tautan. Coba lagi sebentar ya." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      data: name === "" ? undefined : { name },
    },
  });

  if (error) {
    return { status: "error", message: "Gagal kirim tautan. Coba lagi sebentar ya." };
  }
  return { status: "sent", email };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
