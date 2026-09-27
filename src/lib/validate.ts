// Validasi input form KemanaKita — rujukan docs/PRD.md §4.2, §4.4, §4.5
// dan docs/design_system.md §7 (kategori + ikon) & §8.2 (input nominal).
//
// Modul ini PURE LOGIC: tidak menyentuh Supabase, tidak menyentuh DOM.
// Semua nominal dalam RUPIAH BULAT (integer), semua tanggal string `YYYY-MM-DD`,
// semua pesan error Bahasa Indonesia santai. Fungsi mengembalikan hasil
// deterministik tanpa efek samping agar bisa dipakai server action maupun
// komponen klien (validasi inline tanpa reload — PRD §5.2).

// ---------- Kategori pengeluaran (design_system §7) ----------

/** 6 nilai enum tetap, sinkron dengan `public.expense_category` di migrasi. */
export type ExpenseCategoryKey =
  | "makan"
  | "transport"
  | "penginapan"
  | "tiket"
  | "belanja"
  | "lain-lain";

export interface ExpenseCategory {
  key: ExpenseCategoryKey;
  /** Label tampil Bahasa Indonesia. */
  label: string;
  /** Nama ikon Lucide (design_system §7). */
  icon: string;
}

/** Urutan mengikuti enum migrasi; label & ikon mengikuti design_system §7. */
export const EXPENSE_CATEGORIES: readonly ExpenseCategory[] = [
  { key: "makan", label: "Makan & Minum", icon: "utensils" },
  { key: "transport", label: "Transport", icon: "car" },
  { key: "penginapan", label: "Penginapan", icon: "bed" },
  { key: "tiket", label: "Tiket & Wisata", icon: "ticket" },
  { key: "belanja", label: "Belanja", icon: "shopping-bag" },
  { key: "lain-lain", label: "Lain-lain", icon: "receipt" },
] as const;

const CATEGORY_BY_KEY = new Map(EXPENSE_CATEGORIES.map((c) => [c.key, c]));

/** Metadata kategori, atau `null` bila kunci tidak dikenal. */
export function getExpenseCategory(key: string): ExpenseCategory | null {
  return CATEGORY_BY_KEY.get(key as ExpenseCategoryKey) ?? null;
}

function isExpenseCategoryKey(value: string): value is ExpenseCategoryKey {
  return CATEGORY_BY_KEY.has(value as ExpenseCategoryKey);
}

// ---------- Nominal rupiah (design_system §8.2) ----------

/**
 * Parse teks input nominal menjadi rupiah bulat.
 * Menerima prefix "Rp", pemisah ribuan titik/koma/spasi (design_system §8.2:
 * "format ribuan otomatis"). Mengembalikan `null` bila tidak bisa di-parse,
 * kosong, bernilai negatif, atau AMBIGU.
 *
 * Aturan anti-salah-baca: pemisah hanya sah sebagai pemisah RIBUAN, yaitu grup
 * setelah grup pertama wajib tepat 3 digit. Campuran "." dan "," ditolak karena
 * tidak jelas mana desimal (di locale id-ID "," = desimal, jadi "12,50" akan
 * salah dibaca 100x bila diterima sebagai ribuan).
 */
export function parseRupiahInput(input: string): number | null {
  if (typeof input !== "string") return null;

  const cleaned = input
    .trim()
    .replace(/^rp\s*/i, "")
    .replace(/\s+/g, "");
  if (cleaned === "") return null;

  const hasDot = cleaned.includes(".");
  const hasComma = cleaned.includes(",");
  if (hasDot && hasComma) return null; // ambigu: campur pemisah

  const separator = hasDot ? "." : hasComma ? "," : null;
  const groups = separator ? cleaned.split(separator) : [cleaned];
  if (groups.some((group) => !/^\d+$/.test(group))) return null;

  if (groups.length > 1) {
    if (groups[0].length > 3) return null;
    if (groups.slice(1).some((group) => group.length !== 3)) return null;
  }

  const value = Number(groups.join(""));
  return Number.isSafeInteger(value) ? value : null;
}

/**
 * Format angka rupiah bulat tanpa prefix "Rp" (prefix ditampilkan sebagai teks
 * tetap di kiri input). Contoh: `1250000` → `1.250.000`.
 */
export function formatRupiahInput(amount: number): string {
  return new Intl.NumberFormat("id-ID").format(Math.round(amount));
}

// ---------- Tanggal ----------

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * `true` bila string adalah tanggal kalender sah `YYYY-MM-DD`.
 * Memvalidasi nilai nyata (mis. `2026-02-30` ditolak), bukan sekadar format.
 */
export function isValidDate(date: string): boolean {
  const match = DATE_PATTERN.exec(date);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  // Tengah hari UTC: cek komponen tanpa terpengaruh zona waktu.
  const parsed = new Date(Date.UTC(year, month - 1, day, 12));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

// ---------- Hasil validasi ----------

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

// ---------- Trip (PRD §4.2) ----------

export interface TripInput {
  title: string;
  destination?: string | null;
  startDate: string;
  endDate: string;
}

export interface TripInputValid {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
}

export function validateTripInput(input: TripInput): ValidationResult<TripInputValid> {
  const title = input.title.trim();
  if (title === "") return { ok: false, error: "Judul trip wajib diisi." };

  if (!isValidDate(input.startDate)) {
    return { ok: false, error: "Tanggal mulai tidak valid." };
  }
  if (!isValidDate(input.endDate)) {
    return { ok: false, error: "Tanggal selesai tidak valid." };
  }
  if (input.endDate < input.startDate) {
    return { ok: false, error: "Tanggal selesai tidak boleh sebelum tanggal mulai." };
  }

  return {
    ok: true,
    value: {
      title,
      destination: (input.destination ?? "").trim(),
      startDate: input.startDate,
      endDate: input.endDate,
    },
  };
}

// ---------- Pengeluaran (PRD §4.5) ----------

export interface ExpenseInput {
  title: string;
  /** Teks nominal mentah dari form (mis. "1.250.000"). */
  amount: string;
  paidBy: string;
  date: string;
  category: ExpenseCategoryKey;
  participantIds: string[];
}

export interface ExpenseInputValid {
  title: string;
  amount: number;
  paidBy: string;
  date: string;
  category: ExpenseCategoryKey;
  participantIds: string[];
}

/**
 * Validasi pengeluaran (PRD §4.5): nominal > 0; `paid_by` harus member;
 * minimal 1 peserta split; kategori harus salah satu dari 6 nilai tetap.
 */
export function validateExpenseInput(
  input: ExpenseInput,
  memberIds: string[],
): ValidationResult<ExpenseInputValid> {
  const title = input.title.trim();
  if (title === "") return { ok: false, error: "Judul pengeluaran wajib diisi." };

  const amount = parseRupiahInput(input.amount);
  if (amount === null || amount <= 0) {
    return { ok: false, error: "Nominal harus lebih dari 0." };
  }

  if (!memberIds.includes(input.paidBy)) {
    return { ok: false, error: "Pembayar harus anggota trip." };
  }

  if (!isExpenseCategoryKey(input.category)) {
    return { ok: false, error: "Kategori tidak dikenal." };
  }

  if (!isValidDate(input.date)) {
    return { ok: false, error: "Tanggal pengeluaran tidak valid." };
  }

  const participants = [...new Set(input.participantIds)].sort();
  if (participants.length === 0) {
    return { ok: false, error: "Minimal pilih 1 peserta split." };
  }
  if (!participants.every((id) => memberIds.includes(id))) {
    return { ok: false, error: "Peserta split harus anggota trip." };
  }

  return {
    ok: true,
    value: {
      title,
      amount,
      paidBy: input.paidBy,
      date: input.date,
      category: input.category,
      participantIds: participants,
    },
  };
}

// ---------- Itinerary (PRD §4.4) ----------

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface ItineraryInput {
  date: string;
  /** `HH:MM` atau kosong/null bila belum dijadwalkan. */
  time?: string | null;
  title: string;
  location?: string | null;
  notes?: string | null;
}

export interface ItineraryInputValid {
  date: string;
  time: string | null;
  title: string;
  location: string;
  notes: string;
}

/**
 * Validasi item itinerary (PRD §4.4). Tanggal sengaja TIDAK dibatasi ke rentang
 * trip — konsisten dengan ruling `itinerary.ts`: item di luar rentang tetap
 * ditampilkan (ditempel ke hari terdekat), bukan dibuang.
 */
export function validateItineraryInput(
  input: ItineraryInput,
): ValidationResult<ItineraryInputValid> {
  if (!isValidDate(input.date)) {
    return { ok: false, error: "Tanggal agenda tidak valid." };
  }

  const title = input.title.trim();
  if (title === "") return { ok: false, error: "Judul agenda wajib diisi." };

  const time = input.time?.trim() ?? "";
  if (time !== "" && !TIME_PATTERN.test(time)) {
    return { ok: false, error: "Jam harus format HH:MM." };
  }

  return {
    ok: true,
    value: {
      date: input.date,
      time: time === "" ? null : time,
      title,
      location: (input.location ?? "").trim(),
      notes: (input.notes ?? "").trim(),
    },
  };
}

// ---------- Kode undangan (PRD §4.3) ----------

// `trips.invite_code` di migrasi: `encode(gen_random_bytes(6), 'hex')` → 12 hex char.
const INVITE_CODE_PATTERN = /^[0-9a-f]{12}$/;

export function validateInviteCode(code: string): ValidationResult<string> {
  const normalized = code.trim().toLowerCase();
  if (!INVITE_CODE_PATTERN.test(normalized)) {
    return { ok: false, error: "Kode undangan tidak valid." };
  }
  return { ok: true, value: normalized };
}
