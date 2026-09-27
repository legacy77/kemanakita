"use server";

// Auth server actions — login tanpa email: daftar sekali (nama + email) lalu masuk
// pakai email + PIN 6 digit. Service key HANYA dipakai lewat service-client.ts
// (server-only) untuk admin.createUser/listUsers; RLS tetap utuh.
// Rujukan: PRD §4.1, §7.2.

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "./service-client";
import {
  EMAIL_PATTERN,
  normalizeEmail,
  validateNameInput,
  validatePin,
} from "@/lib/validate";
import { generatePin } from "./pin";

export type LoginState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "sent"; email: string }
  | { status: "created"; pin: string; email: string };

// ---------- Lockout in-memory (anti brute-force PIN) ----------
//
// CEILING yang disadari: peta ini hidup di memori proses Node, jadi (a) reset saat
// server restart / cold start, dan (b) tidak dibagi antar instance serverless.
// Untuk skala 20 user ini cukup sebagai penghambat kasar, bukan jaminan keamanan.
// Upgrade path bila perlu: tabel `login_attempts` di Postgres + hitung via SQL.
const MAX_FAILS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const failedAttempts = new Map<string, { fails: number; firstFailAt: number }>();

function isLockedOut(email: string, now = Date.now()): boolean {
  const entry = failedAttempts.get(email);
  if (!entry) return false;
  if (now - entry.firstFailAt > LOCKOUT_MS) {
    failedAttempts.delete(email);
    return false;
  }
  return entry.fails >= MAX_FAILS;
}

function noteFailure(email: string, now = Date.now()): void {
  const entry = failedAttempts.get(email);
  if (!entry || now - entry.firstFailAt > LOCKOUT_MS) {
    failedAttempts.set(email, { fails: 1, firstFailAt: now });
    return;
  }
  entry.fails += 1;
}

const GENERIC_LOGIN_ERROR = "Email atau PIN salah.";
const LOCKED_ERROR = "Terlalu banyak percobaan. Tunggu 15 menit ya.";

/** Origin publik request (untuk `emailRedirectTo` magic link legacy). */
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

/** Cari user by email lewat Admin API (case-insensitive). `null` bila tak ada. */
async function findUserByEmail(
  admin: ReturnType<typeof createServiceClient>,
  email: string,
): Promise<{ id: string; email?: string } | null> {
  // Skala 20 user: satu halaman (perPage default 50) sudah menampung semua.
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw new Error(error.message);
  const match = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
  return match ? { id: match.id, email: match.email ?? undefined } : null;
}

/**
 * Daftar akun baru: nama + email → user Supabase dengan PIN sebagai password.
 * Sukses mengembalikan `{ status: "created", pin, email }` untuk ditampilkan sekali.
 */
export async function createPinAccount(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const nameResult = validateNameInput(String(formData.get("name") ?? ""));

  if (!nameResult.ok) {
    return { status: "error", message: nameResult.error };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { status: "error", message: "Email-nya kayaknya typo. Cek lagi ya." };
  }

  const admin = createServiceClient();

  let existing: { id: string } | null = null;
  try {
    existing = await findUserByEmail(admin, email);
  } catch {
    return { status: "error", message: "Gagal cek akun. Coba lagi sebentar ya." };
  }

  if (existing) {
    // Di form DAFTAR pesan spesifik boleh (user memang berniat mendaftar).
    // Di form MASUK pesan wajib generik — lihat `signInWithPin`.
    return { status: "error", message: "Email sudah terdaftar. Coba masuk dengan PIN kamu." };
  }

  const pin = generatePin();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: pin,
    email_confirm: true,
    user_metadata: { name: nameResult.value },
  });

  if (error || !data.user) {
    return { status: "error", message: "Gagal bikin akun. Coba lagi sebentar ya." };
  }

  // Profil TIDAK di-upsert manual: trigger `on_auth_user_created`
  // (`handle_new_user`) sudah meng-insert `profiles` dari `user_metadata.name`.
  // Menghindari jalur rollback yang bisa meninggalkan akun tanpa PIN terlihat:
  // kalau pembuatan profil gagal, trigger sendiri yang menggagalkan transaksi
  // pembuatan user, sehingga `createUser` di atas ikut error dan tidak ada akun
  // orphan. PIN hanya pernah ditampilkan pada jalur sukses ini.

  return { status: "created", pin, email };
}

/**
 * Masuk dengan email + PIN. Memakai ANON client (bukan service) agar sesi
 * cookie di-set normal; RLS tetap berlaku untuk semua query berikutnya.
 * Semua pesan gagal generik (anti-enumeration).
 */
export async function signInWithPin(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const pinResult = validatePin(String(formData.get("pin") ?? ""));
  const next = safeNext(String(formData.get("next") ?? "/trips"));

  if (!EMAIL_PATTERN.test(email) || !pinResult.ok) {
    return { status: "error", message: GENERIC_LOGIN_ERROR };
  }

  if (isLockedOut(email)) {
    return { status: "error", message: LOCKED_ERROR };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: pinResult.value });

  if (error) {
    noteFailure(email);
    // Kalau percobaan ini menembus batas, sampaikan pesan lockout sekalian.
    if (isLockedOut(email)) {
      return { status: "error", message: LOCKED_ERROR };
    }
    return { status: "error", message: GENERIC_LOGIN_ERROR };
  }

  failedAttempts.delete(email);
  redirect(next);
}

// ---------- Legacy: magic link (DEPRECATED, tidak dipakai UI) ----------
//
// Dipertahankan hanya sebagai jalur cadangan/rujukan. UI login sekarang memakai
// `createPinAccount` + `signInWithPin`; email tetap tidak dikirim sama sekali.

/** @deprecated Login via OTP email sudah digantikan PIN 6 digit. */
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
