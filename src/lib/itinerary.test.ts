import { test } from "node:test";
import assert from "node:assert/strict";
import {
  eachDayInRange,
  groupItineraryByDay,
  formatTripDate,
  formatDayLabel,
  type ItineraryItem,
} from "./itinerary.ts";

// ---------- eachDayInRange ----------

test("eachDayInRange: rentang 3 hari inklusif", () => {
  assert.deepEqual(eachDayInRange("2026-10-12", "2026-10-14"), [
    "2026-10-12",
    "2026-10-13",
    "2026-10-14",
  ]);
});

test("eachDayInRange: satu hari menghasilkan satu tanggal", () => {
  assert.deepEqual(eachDayInRange("2026-10-12", "2026-10-12"), ["2026-10-12"]);
});

test("eachDayInRange: melewati batas bulan dengan benar", () => {
  assert.deepEqual(eachDayInRange("2026-10-30", "2026-11-02"), [
    "2026-10-30",
    "2026-10-31",
    "2026-11-01",
    "2026-11-02",
  ]);
});

test("eachDayInRange: melewati batas tahun dengan benar", () => {
  assert.deepEqual(eachDayInRange("2026-12-31", "2027-01-01"), [
    "2026-12-31",
    "2027-01-01",
  ]);
});

test("eachDayInRange: tanggal akhir sebelum mulai ditolak", () => {
  assert.throws(() => eachDayInRange("2026-10-14", "2026-10-12"), /rentang/i);
});

// ---------- groupItineraryByDay ----------

const items: ItineraryItem[] = [
  { id: "3", date: "2026-10-12", time: "18:00", title: "Makan malam", sortOrder: 0 },
  { id: "1", date: "2026-10-12", time: "09:00", title: "Sarapan", sortOrder: 0 },
  { id: "2", date: "2026-10-12", time: "09:00", title: "Jalan pagi", sortOrder: 1 },
  { id: "4", date: "2026-10-13", time: "07:00", title: "Sunrise", sortOrder: 0 },
];

test("groupItineraryByDay: mengelompokkan per hari", () => {
  const groups = groupItineraryByDay(items, "2026-10-12", "2026-10-13");
  assert.equal(groups.length, 2);
  assert.equal(groups[0].date, "2026-10-12");
  assert.equal(groups[1].date, "2026-10-13");
});

test("groupItineraryByDay: urut tanggal, lalu jam, lalu sortOrder", () => {
  const groups = groupItineraryByDay(items, "2026-10-12", "2026-10-13");
  assert.deepEqual(
    groups[0].items.map((i) => i.id),
    ["1", "2", "3"],
    "09:00 sortOrder 0 → 09:00 sortOrder 1 → 18:00",
  );
});

test("groupItineraryByDay: hari tanpa item tetap muncul (rentang trip)", () => {
  const groups = groupItineraryByDay(items, "2026-10-11", "2026-10-13");
  assert.equal(groups.length, 3);
  assert.equal(groups[0].date, "2026-10-11");
  assert.deepEqual(groups[0].items, []);
});

test("groupItineraryByDay: item tanpa jam ditaruh paling akhir di harinya", () => {
  const withUntimed: ItineraryItem[] = [
    { id: "b", date: "2026-10-12", time: null, title: "Belum dijadwalkan", sortOrder: 0 },
    { id: "a", date: "2026-10-12", time: "08:00", title: "Pagi", sortOrder: 5 },
  ];
  const groups = groupItineraryByDay(withUntimed, "2026-10-12", "2026-10-12");
  assert.deepEqual(groups[0].items.map((i) => i.id), ["a", "b"]);
});

test("groupItineraryByDay: urutan deterministik saat jam & sortOrder sama", () => {
  const tie: ItineraryItem[] = [
    { id: "z", date: "2026-10-12", time: "10:00", title: "Zeta", sortOrder: 0 },
    { id: "a", date: "2026-10-12", time: "10:00", title: "Alfa", sortOrder: 0 },
  ];
  const groups = groupItineraryByDay(tie, "2026-10-12", "2026-10-12");
  assert.deepEqual(groups[0].items.map((i) => i.title), ["Alfa", "Zeta"]);
});

test("groupItineraryByDay: item di luar rentang tetap muncul, tidak hilang", () => {
  const outside: ItineraryItem[] = [
    { id: "x", date: "2026-10-20", time: "10:00", title: "Di luar rentang", sortOrder: 0 },
  ];
  const groups = groupItineraryByDay(outside, "2026-10-12", "2026-10-13");
  const allIds = groups.flatMap((g) => g.items.map((i) => i.id));
  assert.ok(allIds.includes("x"), "item di luar rentang tidak boleh hilang");
});

test("groupItineraryByDay: daftar kosong tetap menghasilkan grup per hari", () => {
  const groups = groupItineraryByDay([], "2026-10-12", "2026-10-13");
  assert.equal(groups.length, 2);
  assert.ok(groups.every((g) => g.items.length === 0));
});

test("groupItineraryByDay: tidak mengubah array input", () => {
  const input = [...items];
  const snapshot = input.map((i) => i.id);
  groupItineraryByDay(input, "2026-10-12", "2026-10-13");
  assert.deepEqual(input.map((i) => i.id), snapshot);
});

// ---------- format tanggal ----------

test("formatTripDate memakai format `12 Okt 2026`", () => {
  assert.equal(formatTripDate("2026-10-12"), "12 Okt 2026");
  assert.equal(formatTripDate("2026-01-05"), "5 Jan 2026");
});

test("formatDayLabel memakai nama hari singkat Indonesia", () => {
  assert.equal(formatDayLabel("2026-10-12"), "Sen, 12 Okt");
});

test("formatTripDate aman dari pergeseran zona waktu", () => {
  // 2026-10-12 harus tetap 12, bukan 11, di zona mana pun.
  assert.equal(formatTripDate("2026-10-12").startsWith("12"), true);
});
