import { test } from "node:test";
import assert from "node:assert/strict";
import {
  splitEvenly,
  computeBalances,
  suggestSettlements,
  formatRupiah,
  toSplitExpenses,
  toSettlementTransfers,
  buildSplitRows,
  buildSettlementSplitRow,
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

// ---------- toSplitExpenses / toSettlementTransfers ----------
//
// Helper ini mengekstrak pemetaan inline di src/app/trips/[id]/page.tsx:161-173
// agar /dashboard dan /trips/[id] memakai logika identik.

const row = (
  overrides: Partial<{ id: string; amount: number; paid_by: string; kind: "expense" | "settlement" }> = {},
) => ({
  id: "e1",
  amount: 100_000,
  paid_by: "a",
  kind: "expense" as const,
  ...overrides,
});

const splits = (entries: Record<string, { user_id: string }[]>) =>
  new Map(Object.entries(entries));

test("toSplitExpenses: memetakan expense + participantIds dari splits", () => {
  const result = toSplitExpenses(
    [row({ id: "e1", paid_by: "a" })],
    splits({ e1: [{ user_id: "a" }, { user_id: "b" }] }),
  );
  assert.deepEqual(result, [
    { amount: 100_000, paidBy: "a", participantIds: ["a", "b"] },
  ]);
});

test("toSplitExpenses: membuang expense tanpa peserta", () => {
  const result = toSplitExpenses(
    [row({ id: "e1" }), row({ id: "e2", amount: 50_000, paid_by: "b" })],
    splits({ e1: [], e2: [{ user_id: "b" }] }),
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].paidBy, "b");
});

test("toSplitExpenses: membuang baris settlement", () => {
  const result = toSplitExpenses(
    [row({ id: "e1", kind: "settlement" })],
    splits({ e1: [{ user_id: "b" }] }),
  );
  assert.deepEqual(result, []);
});

test("toSplitExpenses: amount desimal dibulatkan ke rupiah", () => {
  const result = toSplitExpenses(
    [row({ id: "e1", amount: 33.33 })],
    splits({ e1: [{ user_id: "a" }] }),
  );
  assert.equal(result[0].amount, 33);
});

test("toSettlementTransfers: memetakan settlement ke {from: paid_by, to: split[0]}", () => {
  const result = toSettlementTransfers(
    [row({ id: "s1", kind: "settlement", paid_by: "b", amount: 50_000 })],
    splits({ s1: [{ user_id: "a" }] }),
  );
  assert.deepEqual(result, [{ from: "b", to: "a", amount: 50_000 }]);
});

test("toSettlementTransfers: membuang settlement tanpa split (to kosong)", () => {
  const result = toSettlementTransfers(
    [row({ id: "s1", kind: "settlement", paid_by: "b" })],
    splits({ s1: [] }),
  );
  assert.deepEqual(result, []);
});

test("toSettlementTransfers: membuang baris expense biasa", () => {
  const result = toSettlementTransfers(
    [row({ id: "e1", kind: "expense" })],
    splits({ e1: [{ user_id: "a" }] }),
  );
  assert.deepEqual(result, []);
});

test("paritas: helper menghasilkan output identik dengan pemetaan inline lama", () => {
  const rows = [
    row({ id: "e1", amount: 300_000, paid_by: "andi" }),
    row({ id: "e2", amount: 150_000, paid_by: "budi" }),
    row({ id: "s1", amount: 20_000, paid_by: "budi", kind: "settlement" }),
    row({ id: "e3", amount: 60_000, paid_by: "cici" }),
    row({ id: "e4", amount: 10_000, paid_by: "andi" }), // tanpa peserta → dibuang
    row({ id: "s2", amount: 5_000, paid_by: "cici", kind: "settlement" }), // tanpa split → dibuang
  ];
  const map = splits({
    e1: [{ user_id: "andi" }, { user_id: "budi" }, { user_id: "cici" }],
    e2: [{ user_id: "andi" }, { user_id: "budi" }, { user_id: "cici" }],
    s1: [{ user_id: "andi" }],
    e3: [{ user_id: "andi" }, { user_id: "budi" }, { user_id: "cici" }],
    e4: [],
    s2: [],
  });

  // Pemetaan inline lama (referensi perilaku sebelum refactor).
  const inlineExpenses: Expense[] = rows
    .filter((e) => e.kind !== "settlement")
    .map((e) => ({
      amount: Math.round(Number(e.amount)),
      paidBy: e.paid_by,
      participantIds: (map.get(e.id) ?? []).map((s) => s.user_id),
    }))
    .filter((e) => e.participantIds.length > 0);
  const inlineSettlements = rows
    .filter((e) => e.kind === "settlement")
    .map((e) => {
      const pair = map.get(e.id) ?? [];
      return { from: e.paid_by, to: pair[0]?.user_id ?? "", amount: Math.round(Number(e.amount)) };
    })
    .filter((s) => s.to !== "");

  assert.deepEqual(toSplitExpenses(rows, map), inlineExpenses);
  assert.deepEqual(toSettlementTransfers(rows, map), inlineSettlements);

  // Dan saldo akhirnya harus sama.
  assert.deepEqual(
    [...computeBalances(toSplitExpenses(rows, map), toSettlementTransfers(rows, map)).entries()].sort(),
    [...computeBalances(inlineExpenses, inlineSettlements).entries()].sort(),
  );
});

// ---------- buildSplitRows / buildSettlementSplitRow ----------
//
// Baris insert murni untuk expense-actions.ts & settlement-actions.ts:
// jumlah(share) === round(amount) agar saldo bisa benar-benar nol.

test("buildSplitRows: jumlah share sama dengan nominal, bentuk baris benar", () => {
  const rows = buildSplitRows("exp-1", 100_000, ["budi", "andi"]);
  assert.deepEqual(rows, [
    { expense_id: "exp-1", user_id: "andi", share_amount: 50_000 },
    { expense_id: "exp-1", user_id: "budi", share_amount: 50_000 },
  ]);
});

test("buildSplitRows: nominal tak habis dibagi tetap pas total (largest remainder)", () => {
  const rows = buildSplitRows("exp-2", 100_000, ["a", "b", "c"]);
  const total = rows.reduce((sum, r) => sum + r.share_amount, 0);
  assert.equal(total, 100_000);
  assert.equal(rows.length, 3);
});

test("buildSettlementSplitRow: satu pasangan dari → ke", () => {
  assert.deepEqual(buildSettlementSplitRow("s-1", "andi", 50_000), {
    expense_id: "s-1",
    user_id: "andi",
    share_amount: 50_000,
  });
});
