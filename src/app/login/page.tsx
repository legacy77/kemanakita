import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const metadata = { title: "Masuk — KemanaKita" };

function safeNext(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/trips";
  return value;
}

// Halaman masuk (PRD §4.1). Server component: cek sesi dulu agar user yang
// sudah login tidak melihat form kosong.

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(next);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <div className="w-full max-w-sm space-y-2 text-center">
        <span className="rpg-ribbon mx-auto">🔑 Gerbang Masuk</span>
        <h1 className="font-display text-[28px] leading-9 font-extrabold text-action">
          Masuk
        </h1>
        <p className="text-[15px] leading-[22px] text-fg-muted">
          Daftar sekali dengan nama + email, dapat PIN 6 digit. Masuk berikutnya cukup email +
          PIN. Tanpa buka email.
        </p>
      </div>

      <LoginForm next={next} initialError={params.error} />

      <Link
        href="/"
        className="text-[15px] font-semibold text-action underline underline-offset-4"
      >
        Kembali
      </Link>
    </main>
  );
}
