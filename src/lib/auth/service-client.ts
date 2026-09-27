// Client Supabase dengan SERVICE KEY (server-only).
//
// ⚠️  JANGAN PERNAH impor modul ini dari komponen klien.
// Service key melewati RLS — kalau bocor ke browser, seluruh data user bisa dibaca.
// Hanya dipakai untuk operasi admin Auth yang memang butuh privilege:
// `auth.admin.createUser`, `auth.admin.listUsers`.
//
// Rujukan: PRD §7.2 (RLS tetap utuh; service key hanya untuk administrasi auth).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

// Guard runtime: `server-only` belum jadi dependency proyek (nol dependency baru),
// jadi pengaman berikut gagal-cepat kalau modul ini sampai dibundel ke klien.
if (typeof window !== "undefined") {
  throw new Error(
    "service-client.ts hanya boleh dipakai di server (server action / route handler).",
  );
}

function serviceEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // SENGAJA tanpa prefix NEXT_PUBLIC_ agar tidak ikut ter-inline ke bundle klien.
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("Env Supabase service belum lengkap (lihat .env.example).");
  }
  return { url, key };
}

/**
 * Buat client admin Supabase.
 * `autoRefreshToken`/`persistSession` dimatikan karena client ini tanpa sesi user.
 */
export function createServiceClient(): SupabaseClient<Database> {
  const { url, key } = serviceEnv();
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
