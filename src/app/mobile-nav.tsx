"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth/actions";

// Nav bawah khusus mobile (design_system §8.4) + padding bawah konten.
// Client karena visibilitas & active state bergantung `usePathname()`, dan
// padding bawah harus HANYA ada saat nav tampil (spec §6).
//
// - `md:hidden`: di tablet/desktop tetap tanpa nav bawah (design_system §9).
// - Sembunyi di `/` (landing) dan `/login*` (gerbang masuk) — tanpa route group,
//   cukup cek pathname di sini.
// - Aksesibilitas: `<nav aria-label>`, `aria-current="page"` saat aktif,
//   target sentuh >= 44px, fokus terlihat (global `:focus-visible`).
// - "Keluar" = <form action={signOut}> + <button> (bukan Link, tanpa active).
//   Ini satu-satunya tombol Keluar; "Gabung" satu-satunya tautan /join.

interface NavItem {
  href: string;
  label: string;
  icon: string;
  /** Aktif saat pathname punya prefix ini. */
  match: (pathname: string) => boolean;
}

const ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "🏠",
    match: (p) => p === "/dashboard" || p.startsWith("/dashboard/"),
  },
  {
    href: "/trips",
    label: "Trip",
    icon: "🧭",
    match: (p) => p === "/trips" || p.startsWith("/trips/"),
  },
  {
    href: "/join",
    label: "Gabung",
    icon: "🎟️",
    match: (p) => p === "/join" || p.startsWith("/join/"),
  },
];

/** True bila nav bawah disembunyikan untuk pathname ini. */
export function isNavHidden(pathname: string): boolean {
  return pathname === "/" || pathname === "/login" || pathname.startsWith("/login/");
}

export function MobileNavShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const hidden = isNavHidden(pathname);

  return (
    <>
      {/* Padding bawah hanya saat nav tampil; `md:` dinolkan. */}
      <div className={`flex flex-1 flex-col ${hidden ? "" : "pb-[72px] md:pb-0"}`}>
        {children}
      </div>

      {!hidden && (
        <nav
          aria-label="Navigasi utama"
          className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink-900 bg-parch-100 md:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <ul className="mx-auto flex w-full max-w-2xl items-stretch">
            {ITEMS.map((item) => {
              const active = item.match(pathname);
              return (
                <li key={item.href} className="flex-1">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[12px] leading-4 font-semibold transition-colors ${
                      active
                        ? "bg-gradient-to-b from-sky-500 to-sky-600 text-white"
                        : "text-ink-600 hover:bg-parch-200"
                    }`}
                  >
                    <span aria-hidden className="text-[20px] leading-none">
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}

            <li className="flex-1">
              <form action={signOut} className="h-full">
                <button
                  type="submit"
                  className="flex h-full min-h-[56px] w-full flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[12px] leading-4 font-semibold text-ink-600 transition-colors hover:bg-parch-200"
                >
                  <span aria-hidden className="text-[20px] leading-none">
                    🚪
                  </span>
                  Keluar
                </button>
              </form>
            </li>
          </ul>
        </nav>
      )}
    </>
  );
}

// Alias nama lama (jika ada kode yang mengimpor `MobileNav`).
export const MobileNav = MobileNavShell;
