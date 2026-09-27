// Kontras warna token KemanaKita — modul murni (tanpa I/O, tanpa dependency).
// Dipakai oleh `scripts/check-contrast.mjs` dan diuji lewat `npm test`.
// Rujukan: docs/design_system.md §3.3 (rasio kontras) & §10 (token kanonik).
//
// Token kanonik = sky/gold/parch/ink (+ semantik mint/coral). Nama lama
// lagoon/sand/sunset/slate tetap tersedia sebagai ALAIS dengan nilai identik,
// jadi rasio tidak berubah saat dipakai dengan kelas lama.

/** Palet kanonik JRPG Bright. Sumber kebenaran: `src/app/globals.css`. */
export const TOKENS: Record<string, string> = {
  "sky-50": "#EFF7FF",
  "sky-100": "#D9EDFF",
  "sky-200": "#BCE0FF",
  "sky-300": "#8CCBFF",
  "sky-400": "#55AEFF",
  "sky-500": "#2B8FEF",
  "sky-600": "#1668D6",
  "sky-700": "#1250A8",
  "sky-800": "#14428A",
  "sky-900": "#163A72",
  "sky-950": "#0E2549",
  "gold-50": "#FFF9E8",
  "gold-100": "#FFF0C4",
  "gold-300": "#FFD666",
  "gold-500": "#F5A524",
  "gold-600": "#D08305",
  "gold-700": "#A16207",
  "parch-50": "#FFFCF4",
  "parch-100": "#FFF6E6",
  "parch-200": "#FBEACF",
  "parch-300": "#F1DCB6",
  "parch-400": "#E0C493",
  "parch-500": "#C0A470",
  "ink-900": "#22304D",
  "ink-700": "#3B4B6E",
  "ink-600": "#5A6A8C",
  "ink-500": "#808EA8",
  "ink-300": "#C6CFE0",
  "ink-100": "#EDF1F8",
  "mint-500": "#0E9F6E",
  "mint-100": "#D6F6E9",
  "coral-500": "#E5484D",
  "coral-100": "#FFE3E5",
  white: "#FFFFFF",
  // Alias nama lama → nilai kanonik (kompatibilitas)
  "lagoon-600": "#1668D6",
  "lagoon-700": "#1250A8",
  "sand-50": "#FFFCF4",
  "sunset-500": "#F5A524",
  "slate-900": "#22304D",
};

export interface ContrastCheck {
  /** Label manusiawi untuk output. */
  label: string;
  /** Nama token foreground. */
  fg: string;
  /** Nama token background. */
  bg: string;
  /** Rasio minimum WCAG yang ditargetkan. */
  min: number;
  /** true → kegagalan menggagalkan skrip; false → hanya dilaporkan (INFO). */
  required: boolean;
}

/**
 * Pasangan yang diperiksa. Yang `required: true` adalah kombinasi teks/permukaan
 * inti yang WAJIB lolos. Badge status (mint/coral/gold) hanya INFO karena pada
 * palet terang ini di bawah 4.5:1 — dan sesuai design_system §3.2 status selalu
 * disertai ikon + teks, bukan warna saja.
 */
export const CHECKS: ContrastCheck[] = [
  { label: "putih di sky-600 (tombol utama)", fg: "white", bg: "sky-600", min: 4.5, required: true },
  { label: "putih di sky-700 (tombol hover)", fg: "white", bg: "sky-700", min: 4.5, required: true },
  { label: "sky-700 di parch-50 (teks aksi)", fg: "sky-700", bg: "parch-50", min: 4.5, required: true },
  { label: "sky-600 di parch-50 (ikon/besar)", fg: "sky-600", bg: "parch-50", min: 4.5, required: true },
  { label: "ink-900 di parch-50 (body)", fg: "ink-900", bg: "parch-50", min: 4.5, required: true },
  { label: "ink-600 di parch-50 (metadata)", fg: "ink-600", bg: "parch-50", min: 4.5, required: true },
  { label: "ink-600 di parch-100 (metadata kartu)", fg: "ink-600", bg: "parch-100", min: 4.5, required: true },
  { label: "ink-900 di gold-500 (pita/badge)", fg: "ink-900", bg: "gold-500", min: 4.5, required: true },
  { label: "putih di ink-900 (teks panel gelap)", fg: "white", bg: "ink-900", min: 4.5, required: true },
  { label: "ink-500 di parch-50 (info, <4.5)", fg: "ink-500", bg: "parch-50", min: 3, required: false },
  { label: "mint-500 di mint-100 (badge lunas)", fg: "mint-500", bg: "mint-100", min: 3, required: false },
  { label: "coral-500 di coral-100 (badge utang)", fg: "coral-500", bg: "coral-100", min: 3, required: false },
  { label: "gold-700 di gold-100 (badge pending)", fg: "gold-700", bg: "gold-100", min: 3, required: false },
  { label: "putih di coral-500 (tombol hapus)", fg: "white", bg: "coral-500", min: 4.5, required: false },
];

const HEX = /^#[0-9a-fA-F]{6}$/;

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Luminans relatif WCAG untuk hex 6 digit. */
export function luminance(hex: string): number {
  if (!HEX.test(hex)) throw new Error(`Bukan hex 6 digit: ${hex}`);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

/** Rasio kontras WCAG antara dua hex (urutan tidak penting). */
export function contrastRatio(fg: string, bg: string): number {
  const a = luminance(fg);
  const b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

export interface ContrastResult extends ContrastCheck {
  ratio: number;
  ok: boolean;
}

/** Evaluasi semua CHECKS terhadap TOKENS. */
export function runChecks(tokens: Record<string, string> = TOKENS): ContrastResult[] {
  return CHECKS.map((check) => {
    const fg = tokens[check.fg];
    const bg = tokens[check.bg];
    if (!fg || !bg) throw new Error(`Token tak dikenal: ${check.fg} / ${check.bg}`);
    const ratio = contrastRatio(fg, bg);
    return { ...check, ratio, ok: ratio >= check.min };
  });
}

/** Jumlah kombinasi WAJIB yang gagal. */
export function countFailures(results: ContrastResult[] = runChecks()): number {
  return results.filter((r) => r.required && !r.ok).length;
}
