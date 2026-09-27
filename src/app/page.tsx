import Link from "next/link";

// Halaman utama: belum login → ajak masuk; sudah login → terus ke /trips.
// Rujukan: PRD §7.5 (`/` → landing / redirect).
// Gaya: layar judul game RPG — panel langit, judul membulat, satu tombol besar.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/trips");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="rpg-panel relative w-full max-w-md overflow-hidden p-6 text-center">
        <span className="rpg-ribbon mx-auto mb-3">⚔️ Petualangan Bareng</span>
        <h1 className="font-display text-[34px] leading-[40px] font-extrabold tracking-[-0.01em] text-action drop-shadow-[0_2px_0_rgba(255,255,255,0.6)]">
          KemanaKita
        </h1>
        <p className="mt-2 text-[15px] leading-[22px] text-fg-muted">
          Susun itinerary dan bagi biaya trip bareng teman — seperti party di game
          petualangan. 🗺️
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <Link
          href="/login"
          className="rpg-btn flex h-14 w-full items-center justify-center gap-2 rounded-md bg-action px-4 text-[16px] font-bold text-white shadow-md hover:bg-action-hover"
        >
          ▶ Mulai Petualangan
        </Link>
        <p className="text-center text-[12px] leading-4 text-ink-600">
          Daftar sekali dengan nama + email, langsung dapat PIN 6 digit.
        </p>
      </div>
    </main>
  );
}
