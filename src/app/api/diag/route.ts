// TEMPORARY DIAGNOSTIC — akan dihapus setelah dipakai.
// Gate: butuh header x-diag-token agar tidak bisa diakses publik.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TOKEN = "diag-8f3a91c2e7";

export async function GET(req: Request) {
  if (req.headers.get("x-diag-token") !== TOKEN) {
    return new NextResponse("not found", { status: 404 });
  }

  const names = [
    "SUPABASE_SERVICE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SECRET_KEY",
    "SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
  ];
  const presence = Object.fromEntries(
    names.map((n) => [n, { set: Boolean(process.env[n]), len: (process.env[n] ?? "").length }]),
  );

  const { createServiceClient } = await import("@/lib/auth/service-client");
  let probe = "n/a";
  try {
    const admin = createServiceClient();
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    probe = error ? `error: ${error.message}` : `ok, users=${data.users.length}`;
  } catch (e) {
    probe = `throw: ${(e as Error).message}`;
  }

  return NextResponse.json({ presence, probe });
}
