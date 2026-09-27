import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EXPENSE_CATEGORIES,
  getExpenseCategory,
  isValidDate,
  parseRupiahInput,
  formatRupiahInput,
  validateTripInput,
  validateExpenseInput,
  validateItineraryInput,
  validateSettlementInput,
  validateInviteCode,
} from "./validate.ts";

// ---------- kategori pengeluaran (design_system §7) ----------

test("EXPENSE_CATEGORIES: 6 kategori tetap, urut sesuai enum migrasi", () => {
  assert.deepEqual(
    EXPENSE_CATEGORIES.map((c) => c.key),
    ["makan", "transport", "penginapan", "tiket", "belanja", "lain-lain"],
  );
});

test("EXPENSE_CATEGORIES: label & ikon sesuai design_system §7", () => {
  assert.deepEqual(EXPENSE_CATEGORIES, [
    { key: "makan", label: "Makan & Minum", icon: "utensils" },
    { key: "transport", label: "Transport", icon: "car" },
    { key: "penginapan", label: "Penginapan", icon: "bed" },
    { key: "tiket", label: "Tiket & Wisata", icon: "ticket" },
    { key: "belanja", label: "Belanja", icon: "shopping-bag" },
    { key: "lain-lain", label: "Lain-lain", icon: "receipt" },
  ]);
});

test("getExpenseCategory mengembalikan metadata; null untuk kunci asing", () => {
  assert.equal(getExpenseCategory("makan")?.icon, "utensils");
  assert.equal(getExpenseCategory("transport")?.label, "Transport");
  assert.equal(getExpenseCategory("ngawur"), null);
});

// ---------- parse & format nominal rupiah (design_system §8.2) ----------

test("parseRupiahInput menerima digit polos", () => {
  assert.equal(parseRupiahInput("1250000"), 1_250_000);
  assert.equal(parseRupiahInput("0"), 0);
});

test("parseRupiahInput menerima pemisah ribuan titik/koma/spasi", () => {
  assert.equal(parseRupiahInput("1.250.000"), 1_250_000);
  assert.equal(parseRupiahInput("1,250,000"), 1_250_000);
  assert.equal(parseRupiahInput("1 250 000"), 1_250_000);
});

test("parseRupiahInput mengabaikan prefix Rp dan spasi pinggir", () => {
  assert.equal(parseRupiahInput("Rp 1.250.000"), 1_250_000);
  assert.equal(parseRupiahInput("  Rp75.000  "), 75_000);
});

test("parseRupiahInput mengembalikan null untuk input tidak valid", () => {
  assert.equal(parseRupiahInput(""), null);
  assert.equal(parseRupiahInput("   "), null);
  assert.equal(parseRupiahInput("abc"), null);
  assert.equal(parseRupiahInput("12rb"), null);
  assert.equal(parseRupiahInput("1.2.3x"), null);
});

test("parseRupiahInput menolak pola koma desimal (IDR bulat, bukan pecahan)", () => {
  // Di locale id-ID koma bisa jadi desimal ("12,50") — ambigu dengan pemisah
  // ribuan. Karena nominal selalu rupiah bulat, pola semacam ini ditolak.
  for (const input of ["12,50", "1.234,56", "1.250,000", "1,250.000", "0,5"]) {
    assert.equal(parseRupiahInput(input), null, `input: ${input}`);
  }
});

test("parseRupiahInput menolak tanda negatif (nominal IDR selalu >= 0)", () => {
  assert.equal(parseRupiahInput("-5000"), null);
});

test("formatRupiahInput memberi pemisah ribuan titik tanpa prefix Rp", () => {
  assert.equal(formatRupiahInput(1_250_000), "1.250.000");
  assert.equal(formatRupiahInput(75_000), "75.000");
  assert.equal(formatRupiahInput(0), "0");
});

test("formatRupiahInput membulatkan nilai pecahan ke rupiah terdekat", () => {
  assert.equal(formatRupiahInput(33.6), "34");
});

test("parseRupiahInput ↔ formatRupiahInput round-trip stabil", () => {
  for (const value of [0, 1, 999, 1_000, 75_000, 1_250_000, 999_999_999]) {
    assert.equal(parseRupiahInput(formatRupiahInput(value)), value);
  }
});

// ---------- isValidDate ----------

test("isValidDate menerima tanggal kalender yang sah", () => {
  assert.equal(isValidDate("2026-10-12"), true);
  assert.equal(isValidDate("2026-02-28"), true);
  assert.equal(isValidDate("2028-02-29"), true); // kabisat
});

test("isValidDate menolak format salah & tanggal mustahil", () => {
  assert.equal(isValidDate("12-10-2026"), false);
  assert.equal(isValidDate("2026-1-2"), false);
  assert.equal(isValidDate("2026-02-30"), false);
  assert.equal(isValidDate("2026-13-01"), false);
  assert.equal(isValidDate(""), false);
});

// ---------- validasi trip (PRD §4.2) ----------

test("validateTripInput: input valid dinormalisasi (trim)", () => {
  const result = validateTripInput({
    title: "  Bali 3D2N  ",
    destination: "  Bali ",
    startDate: "2026-10-12",
    endDate: "2026-10-14",
  });
  assert.deepEqual(result, {
    ok: true,
    value: {
      title: "Bali 3D2N",
      destination: "Bali",
      startDate: "2026-10-12",
      endDate: "2026-10-14",
    },
  });
});

test("validateTripInput: destinasi opsional → string kosong", () => {
  const result = validateTripInput({
    title: "Trip",
    startDate: "2026-10-12",
    endDate: "2026-10-12",
  });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.destination, "");
});

test("validateTripInput: satu hari (start == end) boleh", () => {
  const result = validateTripInput({
    title: "Day trip",
    startDate: "2026-10-12",
    endDate: "2026-10-12",
  });
  assert.equal(result.ok, true);
});

test("validateTripInput: judul kosong ditolak", () => {
  const result = validateTripInput({
    title: "   ",
    startDate: "2026-10-12",
    endDate: "2026-10-12",
  });
  assert.deepEqual(result, { ok: false, error: "Judul trip wajib diisi." });
});

test("validateTripInput: tanggal mulai tidak valid ditolak", () => {
  const result = validateTripInput({
    title: "Trip",
    startDate: "2026-13-40",
    endDate: "2026-10-14",
  });
  assert.deepEqual(result, { ok: false, error: "Tanggal mulai tidak valid." });
});

test("validateTripInput: tanggal selesai tidak valid ditolak", () => {
  const result = validateTripInput({
    title: "Trip",
    startDate: "2026-10-12",
    endDate: "bukan-tanggal",
  });
  assert.deepEqual(result, { ok: false, error: "Tanggal selesai tidak valid." });
});

test("validateTripInput: selesai sebelum mulai ditolak", () => {
  const result = validateTripInput({
    title: "Trip",
    startDate: "2026-10-14",
    endDate: "2026-10-12",
  });
  assert.deepEqual(result, {
    ok: false,
    error: "Tanggal selesai tidak boleh sebelum tanggal mulai.",
  });
});

// ---------- validasi pengeluaran (PRD §4.5) ----------

const MEMBERS = ["andi", "budi", "cici"];

test("validateExpenseInput: input valid dinormalisasi ke rupiah bulat", () => {
  const result = validateExpenseInput(
    {
      title: "  Hotel  ",
      amount: "1.250.000",
      paidBy: "budi",
      date: "2026-10-13",
      category: "penginapan",
      participantIds: ["andi", "budi", "cici"],
    },
    MEMBERS,
  );
  assert.deepEqual(result, {
    ok: true,
    value: {
      title: "Hotel",
      amount: 1_250_000,
      paidBy: "budi",
      date: "2026-10-13",
      category: "penginapan",
      participantIds: ["andi", "budi", "cici"],
    },
  });
});

test("validateExpenseInput: peserta split duplikat di-dedupe & urut deterministik", () => {
  const result = validateExpenseInput(
    {
      title: "Makan",
      amount: "90.000",
      paidBy: "andi",
      date: "2026-10-13",
      category: "makan",
      participantIds: ["cici", "andi", "andi", "budi"],
    },
    MEMBERS,
  );
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.value.participantIds, ["andi", "budi", "cici"]);
});

test("validateExpenseInput: judul kosong ditolak", () => {
  const result = validateExpenseInput(
    {
      title: " ",
      amount: "1000",
      paidBy: "andi",
      date: "2026-10-13",
      category: "makan",
      participantIds: ["andi"],
    },
    MEMBERS,
  );
  assert.deepEqual(result, { ok: false, error: "Judul pengeluaran wajib diisi." });
});

test("validateExpenseInput: nominal 0 ditolak", () => {
  const result = validateExpenseInput(
    {
      title: "Makan",
      amount: "0",
      paidBy: "andi",
      date: "2026-10-13",
      category: "makan",
      participantIds: ["andi"],
    },
    MEMBERS,
  );
  assert.deepEqual(result, { ok: false, error: "Nominal harus lebih dari 0." });
});

test("validateExpenseInput: nominal tidak valid ditolak", () => {
  const result = validateExpenseInput(
    {
      title: "Makan",
      amount: "seribu",
      paidBy: "andi",
      date: "2026-10-13",
      category: "makan",
      participantIds: ["andi"],
    },
    MEMBERS,
  );
  assert.deepEqual(result, { ok: false, error: "Nominal harus lebih dari 0." });
});

test("validateExpenseInput: paid_by bukan member ditolak", () => {
  const result = validateExpenseInput(
    {
      title: "Makan",
      amount: "10.000",
      paidBy: "orang-luar",
      date: "2026-10-13",
      category: "makan",
      participantIds: ["andi"],
    },
    MEMBERS,
  );
  assert.deepEqual(result, { ok: false, error: "Pembayar harus anggota trip." });
});

test("validateExpenseInput: tanpa peserta split ditolak", () => {
  const result = validateExpenseInput(
    {
      title: "Makan",
      amount: "10.000",
      paidBy: "andi",
      date: "2026-10-13",
      category: "makan",
      participantIds: [],
    },
    MEMBERS,
  );
  assert.deepEqual(result, { ok: false, error: "Minimal pilih 1 peserta split." });
});

test("validateExpenseInput: peserta di luar member ditolak", () => {
  const result = validateExpenseInput(
    {
      title: "Makan",
      amount: "10.000",
      paidBy: "andi",
      date: "2026-10-13",
      category: "makan",
      participantIds: ["andi", "orang-luar"],
    },
    MEMBERS,
  );
  assert.deepEqual(result, { ok: false, error: "Peserta split harus anggota trip." });
});

test("validateExpenseInput: kategori asing ditolak", () => {
  const result = validateExpenseInput(
    {
      title: "Makan",
      amount: "10.000",
      paidBy: "andi",
      date: "2026-10-13",
      category: "ngawur" as never,
      participantIds: ["andi"],
    },
    MEMBERS,
  );
  assert.deepEqual(result, { ok: false, error: "Kategori tidak dikenal." });
});

test("validateExpenseInput: tanggal tidak valid ditolak", () => {
  const result = validateExpenseInput(
    {
      title: "Makan",
      amount: "10.000",
      paidBy: "andi",
      date: "31-10-2026",
      category: "makan",
      participantIds: ["andi"],
    },
    MEMBERS,
  );
  assert.deepEqual(result, { ok: false, error: "Tanggal pengeluaran tidak valid." });
});

// ---------- validasi itinerary (PRD §4.4) ----------

test("validateItineraryInput: input valid dinormalisasi", () => {
  const result = validateItineraryInput({
    date: "2026-10-12",
    time: "08:30",
    title: "  Sarapan  ",
    location: " Warung ",
    notes: "  jangan pedes  ",
  });
  assert.deepEqual(result, {
    ok: true,
    value: {
      date: "2026-10-12",
      time: "08:30",
      title: "Sarapan",
      location: "Warung",
      notes: "jangan pedes",
    },
  });
});

test("validateItineraryInput: jam opsional → null", () => {
  const result = validateItineraryInput({ date: "2026-10-12", title: "Bebas" });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.time, null);
});

test("validateItineraryInput: lokasi & catatan opsional → string kosong", () => {
  const result = validateItineraryInput({ date: "2026-10-12", title: "Bebas" });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.location, "");
    assert.equal(result.value.notes, "");
  }
});

test("validateItineraryInput: judul kosong ditolak", () => {
  const result = validateItineraryInput({ date: "2026-10-12", title: "  " });
  assert.deepEqual(result, { ok: false, error: "Judul agenda wajib diisi." });
});

test("validateItineraryInput: tanggal tidak valid ditolak", () => {
  const result = validateItineraryInput({ date: "12/10/2026", title: "Sarapan" });
  assert.deepEqual(result, { ok: false, error: "Tanggal agenda tidak valid." });
});

test("validateItineraryInput: jam di luar format HH:MM ditolak", () => {
  for (const time of ["8:30", "24:00", "08:60", "0830", "ab:cd"]) {
    const result = validateItineraryInput({
      date: "2026-10-12",
      time,
      title: "Sarapan",
    });
    assert.deepEqual(result, { ok: false, error: "Jam harus format HH:MM." });
  }
});

test("validateItineraryInput: tanggal di luar rentang trip TETAP diterima", () => {
  // Ruling itinerary.ts: item di luar rentang tidak dibuang, ditempel ke hari terdekat.
  const result = validateItineraryInput({ date: "2026-11-01", title: "Bonus" });
  assert.equal(result.ok, true);
});

// ---------- validasi kode undangan (PRD §4.3) ----------

test("validateInviteCode: 12 hex char dinormalisasi ke huruf kecil", () => {
  assert.deepEqual(validateInviteCode("  A1B2C3D4E5F6 "), {
    ok: true,
    value: "a1b2c3d4e5f6",
  });
});

test("validateInviteCode: format salah ditolak", () => {
  for (const code of ["", "abc", "a1b2c3d4e5f6a", "zzzzzzzzzzzz", "a1b2-c3d4-e5f6"]) {
    assert.deepEqual(validateInviteCode(code), {
      ok: false,
      error: "Kode undangan tidak valid.",
    });
  }
});

// ---------- validasi settlement (PRD §4.5, §8) ----------

test("validateSettlementInput menerima transfer positif antar user berbeda", () => {
  assert.deepEqual(validateSettlementInput({ from: "a", to: "b", amount: "Rp 50.000" }), {
    ok: true,
    value: { from: "a", to: "b", amount: 50_000 },
  });
});

test("validateSettlementInput menolak user sama, nominal invalid, dan ID kosong", () => {
  for (const input of [
    { from: "a", to: "a", amount: "1000" },
    { from: "", to: "b", amount: "1000" },
    { from: "a", to: "b", amount: "0" },
    { from: "a", to: "b", amount: "abc" },
  ]) {
    assert.equal(validateSettlementInput(input).ok, false);
  }
});
