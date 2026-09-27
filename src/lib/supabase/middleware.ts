import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

// Middleware Supabase: menyegarkan sesi auth di tiap request.
// Rujukan: PRD §7.2. Hanya anon key — tidak ada service key di sini.

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Preview/build tanpa env tetap bisa membuka landing page.
  if (!url || !key) return response;

  const supabase = createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // WAJIB: panggil getUser() agar token disegarkan sebelum response dikirim.
  // Jangan hapus baris ini walau hasilnya tidak dipakai.
  await supabase.auth.getUser();

  return response;
}
