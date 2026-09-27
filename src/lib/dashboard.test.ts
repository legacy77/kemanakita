import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizePersonal, type TripData } from "./dashboard.ts";

// ---------- summarizePersonal ----------
//
// Ringkasan personal lintas trip untuk /dashboard (spec §4.3). Semua angka
// berasal dari modul saldo bersama (split-bill) agar identik dengan /trips/[id].

const trip = (
  tripId: string,
  title: string,
  expenses: TripData["expenses"],
  settlements: TripData["settlements"] = [],
): TripData => ({ tripId, title, expenses, settlements });

test("net > 0 → status 'menerima' + totalReceive", () => {
  // "aku" membayar 100k untuk aku+budi → budi berutang 50k ke aku.
  const summary = summarizePersonal("aku", [
    trip("t1", "Bali", [
      { amount: 100_000, paidBy: "aku", participantIds: ["aku", "budi"] },
    ]),
  ]);

  assert.equal(summary.net, 50_000);
  assert.equal(summary.totalReceive, 50_000);
  assert.equal(summary.totalPay, 0);
  assert.equal(summary.status, "menerima");
  assert.equal(summary.partnerCount, 1);
});

test("net < 0 → status 'bayar' + totalPay", () => {
  const summary = summarizePersonal("aku", [
    trip("t1", "Bali", [
      { amount: 100_000, paidBy: "budi", participantIds: ["aku", "budi"] },
    ]),
  ]);

  assert.equal(summary.net, -50_000);
  assert.equal(summary.totalReceive, 0);
  assert.equal(summary.totalPay, 50_000);
  assert.equal(summary.status, "bayar");
});

test("net == 0 tapi ada piutang & utang → status 'impas' (bukan dead code)", () => {
  // Trip A: aku menerima 50k. Trip B: aku membayar 50k. Net total = 0.
  const summary = summarizePersonal("aku", [
    trip("t1", "Bali", [
      { amount: 100_000, paidBy: "aku", participantIds: ["aku", "budi"] },
    ]),
    trip("t2", "Bandung", [
      { amount: 100_000, paidBy: "cici", participantIds: ["aku", "cici"] },
    ]),
  ]);

  assert.equal(summary.net, 0);
  assert.equal(summary.totalReceive, 50_000);
  assert.equal(summary.totalPay, 50_000);
  assert.equal(summary.status, "impas");
});

test("tanpa trip → status 'lunas' dan semua angka nol", () => {
  const summary = summarizePersonal("aku", []);

  assert.equal(summary.net, 0);
  assert.equal(summary.totalReceive, 0);
  assert.equal(summary.totalPay, 0);
  assert.equal(summary.totalSpent, 0);
  assert.equal(summary.partnerCount, 0);
  assert.deepEqual(summary.mySuggestions, []);
  assert.equal(summary.status, "lunas");
});

test("semua saldo nol → status 'lunas'", () => {
  const summary = summarizePersonal("aku", [
    trip("t1", "Bali", [
      { amount: 100_000, paidBy: "aku", participantIds: ["aku", "budi"] },
    ], [{ from: "budi", to: "aku", amount: 50_000 }]),
  ]);

  assert.equal(summary.net, 0);
  assert.equal(summary.totalReceive, 0);
  assert.equal(summary.status, "lunas");
});

test("totalSpent = bagian user sendiri, bukan total trip", () => {
  // Aku ikut 2 dari 3 bagian pada expense 90k → bagianku 30k.
  const summary = summarizePersonal("aku", [
    trip("t1", "Bali", [
      { amount: 90_000, paidBy: "budi", participantIds: ["aku", "budi", "cici"] },
    ]),
  ]);

  assert.equal(summary.totalSpent, 30_000);
});

test("totalSpent dijumlah lintas trip", () => {
  const summary = summarizePersonal("aku", [
    trip("t1", "Bali", [
      { amount: 90_000, paidBy: "budi", participantIds: ["aku", "budi", "cici"] },
    ]),
    trip("t2", "Bandung", [
      { amount: 40_000, paidBy: "aku", participantIds: ["aku", "budi"] },
    ]),
  ]);

  assert.equal(summary.totalSpent, 30_000 + 20_000);
});

test("settlement tercatat mengurangi net (konsisten dengan /trips/[id])", () => {
  const withoutSettlement = summarizePersonal("aku", [
    trip("t1", "Bali", [
      { amount: 100_000, paidBy: "budi", participantIds: ["aku", "budi"] },
    ]),
  ]);
  assert.equal(withoutSettlement.net, -50_000);

  const withSettlement = summarizePersonal("aku", [
    trip("t1", "Bali", [
      { amount: 100_000, paidBy: "budi", participantIds: ["aku", "budi"] },
    ], [{ from: "aku", to: "budi", amount: 50_000 }]),
  ]);
  assert.equal(withSettlement.net, 0);
  assert.equal(withSettlement.status, "lunas");
});

test("mySuggestions hanya baris yang melibatkan user + berlabel judul trip", () => {
  // Aku berutang ke budi; cici berutang ke budi juga (tidak melibatkan aku).
  const summary = summarizePersonal("aku", [
    trip("t1", "Bali", [
      { amount: 30_000, paidBy: "budi", participantIds: ["aku", "budi"] },
      { amount: 20_000, paidBy: "budi", participantIds: ["cici", "budi"] },
    ]),
  ]);

  assert.equal(summary.mySuggestions.length, 1);
  assert.deepEqual(summary.mySuggestions[0], {
    tripId: "t1",
    tripTitle: "Bali",
    from: "aku",
    to: "budi",
    amount: 15_000,
  });
});

test("partnerCount = partner unik dari saran yang melibatkan user", () => {
  const summary = summarizePersonal("aku", [
    trip("t1", "Bali", [
      { amount: 100_000, paidBy: "aku", participantIds: ["aku", "budi"] },
      { amount: 100_000, paidBy: "aku", participantIds: ["aku", "cici"] },
    ]),
  ]);

  assert.equal(summary.partnerCount, 2);
  assert.equal(summary.status, "menerima");
});
