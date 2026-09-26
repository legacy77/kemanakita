import { test } from "node:test";
import assert from "node:assert/strict";
import {
  splitEvenly,
  computeBalances,
  suggestSettlements,
  formatRupiah,
  type Expense,
} from "./split-bill.ts";

// ---------- splitEvenly ----------

test("splitEvenly membagi rata saat habis dibagi", () => {
  const shares = splitEvenly(90_000, ["a", "b", "c"]);
  assert.equal(shares.get("a"), 30_000);
  assert.equal(shares.get("b"), 30_000);
  assert.equal(shares.get("c"), 30_000);
});

test("splitEvenly: jumlah share TEPAT sama dengan amount saat ada sisa", () => {
  const shares = splitEvenly(100, ["a", "b", "c"]);
  const total = [...shares.values()].reduce((s, v) => s + v, 0);
  assert.equal(total, 100);
});

test("splitEvenly: selisih antar orang maksimal 1 rupiah", () => {
  const shares = splitEvenly(100, ["a", "b", "c"]);
  const values = [...shares.values()];
  const max = Math.max(...values);
  const min = Math.min(...values);
  assert.ok(max - min <= 1, `selisih ${max - min} > 1`);
});

test("splitEvenly deterministik untuk input yang sama", () => {
  const a = splitEvenly(100, ["c", "a", "b"]);
  const b = splitEvenly(100, ["a", "b", "c"]);
  assert.deepEqual([...a.entries()].sort(), [...b.entries()].sort());
});

test("splitEvenly: satu peserta menerima seluruh nominal", () => {
  const shares = splitEvenly(50_000, ["a"]);
  assert.equal(shares.get("a"), 50_000);
  assert.equal(shares.size, 1);
});

test("splitEvenly menolak daftar peserta kosong", () => {
  assert.throws(() => splitEvenly(10_000, []), /peserta/i);
});

test("splitEvenly menolak nominal negatif", () => {
  assert.throws(() => splitEvenly(-1, ["a"]), /nominal/i);
});

// ---------- computeBalances ----------

test("computeBalances: contoh PRD (Andi, Budi, Cici)", () => {
  const expenses: Expense[] = [
    { amount: 300_000, paidBy: "andi", participantIds: ["andi", "budi", "cici"] },
    { amount: 150_000, paidBy: "budi", participantIds: ["andi", "budi", "cici"] },
    { amount: 60_000, paidBy: "cici", participantIds: ["andi", "budi", "cici"] },
  ];

  const balances = computeBalances(expenses);

  assert.equal(balances.get("andi"), 130_000); // bayar 300k, bagian 170k
  assert.equal(balances.get("budi"), -20_000); // bayar 150k, bagian 170k
  assert.equal(balances.get("cici"), -110_000); // bayar 60k, bagian 170k
});

test("computeBalances: total saldo selalu nol", () => {
  const expenses: Expense[] = [
    { amount: 100, paidBy: "a", participantIds: ["a", "b", "c"] },
    { amount: 7, paidBy: "b", participantIds: ["a", "b", "c"] },
  ];
  const balances = computeBalances(expenses);
  const total = [...balances.values()].reduce((s, v) => s + v, 0);
  assert.equal(total, 0, "total saldo harus nol agar konsisten");
});

test("computeBalances: split sebagian (bukan semua member)", () => {
  const expenses: Expense[] = [
    { amount: 100_000, paidBy: "a", participantIds: ["a", "b"] },
  ];
  const balances = computeBalances(expenses);
  assert.equal(balances.get("a"), 50_000);
  assert.equal(balances.get("b"), -50_000);
});

test("computeBalances: peserta di luar pembayar tetap dihitung", () => {
  const expenses: Expense[] = [
    { amount: 30_000, paidBy: "a", participantIds: ["a", "b", "c"] },
  ];
  const balances = computeBalances(expenses);
  assert.equal(balances.get("b"), -10_000);
  assert.equal(balances.get("c"), -10_000);
});

test("computeBalances: tanpa pengeluaran menghasilkan saldo kosong", () => {
  const balances = computeBalances([]);
  assert.equal(balances.size, 0);
});

// ---------- suggestSettlements ----------

test("suggestSettlements: contoh PRD menghasilkan 2 transfer minimal", () => {
  const balances = new Map([
    ["andi", 130_000],
    ["budi", -20_000],
    ["cici", -110_000],
  ]);

  const transfers = suggestSettlements(balances);

  assert.deepEqual(transfers, [
    { from: "cici", to: "andi", amount: 110_000 },
    { from: "budi", to: "andi", amount: 20_000 },
  ]);
});

test("suggestSettlements: nominal terbesar didahulukan (PRD §8 langkah 4)", () => {
  const balances = new Map([
    ["a", 50],
    ["b", -10],
    ["c", -40],
  ]);
  const transfers = suggestSettlements(balances);
  assert.equal(transfers[0].amount, 40);
  assert.equal(transfers[0].from, "c");
});

test("suggestSettlements: semua lunas menghasilkan daftar kosong", () => {
  const balances = new Map([
    ["a", 0],
    ["b", 0],
  ]);
  assert.deepEqual(suggestSettlements(balances), []);
});

test("suggestSettlements: transfer melunasi tepat, total sama dengan total piutang", () => {
  const balances = new Map([
    ["a", 33],
    ["b", -17],
    ["c", -16],
  ]);
  const transfers = suggestSettlements(balances);
  const total = transfers.reduce((s, t) => s + t.amount, 0);
  assert.equal(total, 33);

  // Terapkan transfer → semua saldo jadi nol.
  const after = new Map(balances);
  for (const t of transfers) {
    after.set(t.from, (after.get(t.from) ?? 0) + t.amount);
    after.set(t.to, (after.get(t.to) ?? 0) - t.amount);
  }
  for (const [, v] of after) assert.equal(v, 0);
});

test("suggestSettlements: jumlah transfer tidak lebih dari jumlah orang minus satu", () => {
  const balances = new Map([
    ["a", 70],
    ["b", 30],
    ["c", -50],
    ["d", -50],
  ]);
  const transfers = suggestSettlements(balances);
  assert.ok(transfers.length <= 3, `terlalu banyak transfer: ${transfers.length}`);
});

// ---------- settlement tercatat (PRD §8 langkah 5) ----------

test("settlement yang dibayar menggeser saldo ke nol", () => {
  const expenses: Expense[] = [
    { amount: 100_000, paidBy: "a", participantIds: ["a", "b"] },
  ];
  const before = computeBalances(expenses);
  assert.equal(before.get("b"), -50_000);

  const after = computeBalances(expenses, [
    { from: "b", to: "a", amount: 50_000 },
  ]);
  assert.equal(after.get("b"), 0);
  assert.equal(after.get("a"), 0);
});

test("settlement sebagian menyisakan sisa utang", () => {
  const expenses: Expense[] = [
    { amount: 100_000, paidBy: "a", participantIds: ["a", "b"] },
  ];
  const after = computeBalances(expenses, [{ from: "b", to: "a", amount: 20_000 }]);
  assert.equal(after.get("b"), -30_000);
  assert.equal(after.get("a"), 30_000);
});

// ---------- formatRupiah ----------

test("formatRupiah memakai pemisah ribuan titik dan awalan Rp", () => {
  assert.equal(formatRupiah(1_250_000), "Rp 1.250.000");
  assert.equal(formatRupiah(50_000), "Rp 50.000");
  assert.equal(formatRupiah(0), "Rp 0");
});

test("formatRupiah membulatkan nilai pecahan ke rupiah terdekat", () => {
  assert.equal(formatRupiah(33.4), "Rp 33");
  assert.equal(formatRupiah(33.6), "Rp 34");
});
