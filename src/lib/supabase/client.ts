"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

// Client untuk Client Components (browser).
// Hanya anon key — session terbaca dari cookie. Rujukan: PRD §7.2.

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
