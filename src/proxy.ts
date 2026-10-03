import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Proxy root Next.js (wajib di src/ karena repo pakai folder src/).
// Tugasnya hanya menyegarkan sesi Supabase. Logika auth/redirect ada di
// halaman & server action masing-masing (PRD §7.2).
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Lewati aset statis & gambar agar tidak boros; sisanya disegarkan sesinya.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
