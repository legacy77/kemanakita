import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Callback auth: menukar kode/OTP dari tautan email menjadi sesi cookie.
// Rujukan: PRD §4.1. Hanya anon key.
//
// Mendukung dua bentuk tautan Supabase:
//  1. PKCE  → `?code=...` (default @supabase/ssr) → exchangeCodeForSession
//  2. OTP   → `?token_hash=...&type=magiclink` → verifyOtp

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const rawNext = searchParams.get("next") ?? "/trips";

  // Hanya path internal relatif (cegah open redirect).
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/trips";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Tautan masuknya nggak valid atau udah kedaluwarsa. Coba minta lagi ya.")}`,
  );
}
