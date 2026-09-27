// Logika itinerary KemanaKita — rujukan docs/PRD.md §4.4.
//
// Urutan tampil: `tanggal` → `jam` → `sort_order` (PRD §4.4).
// Item tanpa jam ditaruh paling akhir di harinya, bukan dibuang.
// Tanggal selalu string `YYYY-MM-DD` agar tidak bergeser karena zona waktu.

/** 6 nilai enum tetap, sinkron dengan `public.itinerary_category` di migrasi. */
export type ItineraryCategoryKey =
  | "makan"
  | "transport"
  | "penginapan"
  | "tiket"
  | "aktivitas"
  | "lain-lain";

export interface ItineraryCategory {
  key: ItineraryCategoryKey;
  /** Label tampil Bahasa Indonesia. */
  label: string;
  /** Emoji sebagai ikon (tanpa dependensi Lucide di daftar agenda). */
  icon: string;
}

/**
 * Kategori itinerary (PRD §4.4). Urutan mengikuti enum migrasi.
 * Sengaja beda dari `EXPENSE_CATEGORIES`: itinerary punya 'aktivitas'
 * (bukan 'belanja') karena agenda liburan belum tentu pengeluaran.
 */
export const ITINERARY_CATEGORIES: readonly ItineraryCategory[] = [
  { key: "makan", label: "Makan", icon: "🍽️" },
  { key: "transport", label: "Transport", icon: "🚗" },
  { key: "penginapan", label: "Penginapan", icon: "🛏️" },
  { key: "tiket", label: "Tiket", icon: "🎟️" },
  { key: "aktivitas", label: "Aktivitas", icon: "🎯" },
  { key: "lain-lain", label: "Lain-lain", icon: "📌" },
] as const;

/** Default kategori bila tidak dipilih (sinkron default kolom DB). */
export const DEFAULT_ITINERARY_CATEGORY: ItineraryCategoryKey = "lain-lain";

const ITINERARY_CATEGORY_BY_KEY = new Map(
  ITINERARY_CATEGORIES.map((c) => [c.key, c]),
);

/** Metadata kategori, atau `null` bila kunci tidak dikenal. */
export function getItineraryCategory(key: string): ItineraryCategory | null {
  return ITINERARY_CATEGORY_BY_KEY.get(key as ItineraryCategoryKey) ?? null;
}

/** `true` bila kunci termasuk 6 kategori sah. */
export function isItineraryCategoryKey(value: string): value is ItineraryCategoryKey {
  return ITINERARY_CATEGORY_BY_KEY.has(value as ItineraryCategoryKey);
}

export interface ItineraryItem {
  id: string;
  /** `YYYY-MM-DD`. */
  date: string;
  /** `HH:MM` atau null bila belum dijadwalkan. */
  time: string | null;
  title: string;
  notes?: string | null;
  location?: string | null;
  sortOrder: number;
  category: ItineraryCategoryKey;
}

export interface ItineraryDay {
  /** `YYYY-MM-DD`. */
  date: string;
  items: ItineraryItem[];
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(date: string): Date {
  if (!DATE_PATTERN.test(date)) {
    throw new Error(`Tanggal harus format YYYY-MM-DD, dapat: ${date}`);
  }
  // Tengah hari UTC: hindari pergeseran hari saat dikonversi ke zona lokal.
  return new Date(`${date}T12:00:00Z`);
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Semua tanggal dari `start` sampai `end`, inklusif. */
export function eachDayInRange(start: string, end: string): string[] {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (endDate < startDate) {
    throw new Error(`Rentang tanggal terbalik: ${start} → ${end}`);
  }

  const days: string[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    days.push(toDateString(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

function compareItems(a: ItineraryItem, b: ItineraryItem): number {
  const aTime = a.time ?? "99:99"; // tanpa jam → paling akhir
  const bTime = b.time ?? "99:99";
  if (aTime !== bTime) return aTime < bTime ? -1 : 1;
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.title.localeCompare(b.title, "id");
}

/**
 * Kelompokkan item per hari dalam rentang trip (PRD §4.4).
 * Hari tanpa item tetap muncul agar UI bisa menampilkan empty state per hari.
 * Item di luar rentang tidak dibuang — ditempelkan ke hari terdekat agar
 * tidak ada data yang tak terlihat.
 */
export function groupItineraryByDay(
  items: ItineraryItem[],
  start: string,
  end: string,
): ItineraryDay[] {
  const days = eachDayInRange(start, end);
  const groups = new Map<string, ItineraryItem[]>();
  for (const date of days) groups.set(date, []);

  for (const item of items) {
    const bucket =
      item.date < days[0]
        ? days[0]
        : item.date > days[days.length - 1]
          ? days[days.length - 1]
          : item.date;
    const target = groups.get(bucket) ?? groups.get(days[0])!;
    target.push(item);
  }

  return days.map((date) => ({
    date,
    items: [...(groups.get(date) ?? [])].sort(compareItems),
  }));
}

const MONTHS_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

const DAYS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

/** `2026-10-12` → `12 Okt 2026` (design_system §8.2). */
export function formatTripDate(date: string): string {
  const parsed = parseDate(date);
  const day = parsed.getUTCDate();
  const month = MONTHS_ID[parsed.getUTCMonth()];
  return `${day} ${month} ${parsed.getUTCFullYear()}`;
}

/** `2026-10-12` → `Sen, 12 Okt`. */
export function formatDayLabel(date: string): string {
  const parsed = parseDate(date);
  const weekday = DAYS_ID[parsed.getUTCDay()];
  return `${weekday}, ${parsed.getUTCDate()} ${MONTHS_ID[parsed.getUTCMonth()]}`;
}
