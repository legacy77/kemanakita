// Logika split-bill KemanaKita — rujukan docs/PRD.md §8.
//
// Semua nominal dalam RUPIAH BULAT (integer). Pembagian yang tidak habis
// dibagi memakai metode "largest remainder": sisa 1 rupiah dibagikan ke
// peserta teratas secara deterministik, sehingga:
//   jumlah(share) === amount  dan  selisih antar peserta <= 1 rupiah.
// Tanpa ini, total bagian tidak akan pernah sama dengan total bayar dan
// saldo tidak akan pernah nol (PRD §8 langkah 3).

export interface Expense {
  /** Nominal rupiah bulat, > 0. */
  amount: number;
  /** id user yang membayar. */
  paidBy: string;
  /** id peserta yang ikut menanggung (minimal 1). */
  participantIds: string[];
}

export interface Transfer {
  /** id user yang berutang (membayar). */
  from: string;
  /** id user yang menerima. */
  to: string;
  /** Nominal rupiah bulat, > 0. */
  amount: number;
}

/**
 * Bagi `amount` rata ke `participantIds`.
 * Jaminan: jumlah hasil === amount, selisih antar peserta <= 1 rupiah.
 */
export function splitEvenly(
  amount: number,
  participantIds: string[],
): Map<string, number> {
  if (participantIds.length === 0) {
    throw new Error("Minimal harus ada 1 peserta split.");
  }
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Nominal harus angka >= 0.");
  }

  const total = Math.round(amount);
  const ids = [...participantIds].sort();
  const base = Math.floor(total / ids.length);
  const remainder = total - base * ids.length;

  const shares = new Map<string, number>();
  ids.forEach((id, index) => {
    shares.set(id, base + (index < remainder ? 1 : 0));
  });
  return shares;
}

/**
 * Hitung saldo bersih per user (PRD §8 langkah 2-3).
 * `saldo = total_dibayar − total_bagian` (+ = harus menerima).
 * `settlements` (PRD §8 langkah 5) adalah pelunasan yang sudah tercatat:
 * uang mengalir dari `from` ke `to`, jadi saldo `from` naik dan `to` turun.
 * User yang pernah muncul tetap ada di hasil dengan saldo 0 (bukan dihapus).
 */
export function computeBalances(
  expenses: Expense[],
  settlements: Transfer[] = [],
): Map<string, number> {
  const balances = new Map<string, number>();
  const add = (id: string, delta: number) => {
    balances.set(id, (balances.get(id) ?? 0) + delta);
  };

  for (const expense of expenses) {
    add(expense.paidBy, Math.round(expense.amount));
    for (const [userId, share] of splitEvenly(expense.amount, expense.participantIds)) {
      add(userId, -share);
    }
  }

  for (const settlement of settlements) {
    add(settlement.from, Math.round(settlement.amount));
    add(settlement.to, -Math.round(settlement.amount));
  }

  return balances;
}

/**
 * Saran pelunasan minimal (PRD §8 langkah 4): cocokkan yang berutang
 * dengan yang berpiutang, dari nominal terbesar. Hasilnya selalu <= n-1
 * transfer dan melunasi semua saldo jadi nol.
 */
export function suggestSettlements(balances: Map<string, number>): Transfer[] {
  const creditors = [...balances.entries()]
    .filter(([, v]) => v > 0)
    .map(([id, v]) => ({ id, amount: Math.round(v) }))
    .sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id));

  const debtors = [...balances.entries()]
    .filter(([, v]) => v < 0)
    .map(([id, v]) => ({ id, amount: Math.round(-v) }))
    .sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id));

  const transfers: Transfer[] = [];
  let creditorIndex = 0;

  for (const debtor of debtors) {
    let remaining = debtor.amount;
    while (remaining > 0 && creditorIndex < creditors.length) {
      const creditor = creditors[creditorIndex];
      const amount = Math.min(remaining, creditor.amount);
      if (amount > 0) {
        transfers.push({ from: debtor.id, to: creditor.id, amount });
      }
      remaining -= amount;
      creditor.amount -= amount;
      if (creditor.amount === 0) creditorIndex += 1;
    }
  }

  return transfers;
}

/** Format nominal rupiah: `Rp 1.250.000`. */
export function formatRupiah(amount: number): string {
  return `Rp ${new Intl.NumberFormat("id-ID").format(Math.round(amount))}`;
}

/**
 * Baris `expenses` yang dibutuhkan mapper (subset `database.types.ts`).
 * `amount` diparse supabase-js sebagai `number`; `Number(...)` tetap dipakai
 * di mapper agar defensif bila runtime memberi string.
 */
export interface ExpenseRow {
  id: string;
  amount: number;
  paid_by: string;
  kind: "expense" | "settlement";
}

/** Splits dikelompokkan per `expense_id`; cukup `user_id` untuk saldo. */
export type SplitsByExpense = ReadonlyMap<string, { user_id: string }[]>;

/**
 * Petakan baris `expenses` (kind != settlement) ke `Expense[]`.
 * Semantik identik dengan pemetaan inline lama di
 * `src/app/trips/[id]/page.tsx:161-165`: peserta kosong dibuang.
 */
export function toSplitExpenses(
  rows: readonly ExpenseRow[],
  splitsByExpense: SplitsByExpense,
): Expense[] {
  return rows
    .filter((row) => row.kind !== "settlement")
    .map((row) => ({
      amount: Math.round(Number(row.amount)),
      paidBy: row.paid_by,
      participantIds: (splitsByExpense.get(row.id) ?? []).map((s) => s.user_id),
    }))
    .filter((expense) => expense.participantIds.length > 0);
}

/**
 * Petakan baris `expenses` (kind == settlement) ke `Transfer[]`.
 * Semantik identik dengan pemetaan inline lama di
 * `src/app/trips/[id]/page.tsx:167-173`: **map dulu, baru filter** — baris
 * tanpa split (`to` kosong) dibuang setelah dipetakan.
 */
export function toSettlementTransfers(
  rows: readonly ExpenseRow[],
  splitsByExpense: SplitsByExpense,
): Transfer[] {
  return rows
    .filter((row) => row.kind === "settlement")
    .map((row) => {
      const pair = splitsByExpense.get(row.id) ?? [];
      return {
        from: row.paid_by,
        to: pair[0]?.user_id ?? "",
        amount: Math.round(Number(row.amount)),
      };
    })
    .filter((transfer) => transfer.to !== "");
}

// ---------- Pembentuk baris untuk insert (dipakai server actions) ----------

/** Baris `expense_splits` siap-insert. */
export interface SplitRow {
  expense_id: string;
  user_id: string;
  share_amount: number;
}

/**
 * Bangun baris `expense_splits` untuk pengeluaran biasa. Jaminan
 * `sum(share_amount) === round(amount)` diwarisi dari `splitEvenly`, sehingga
 * saldo bisa benar-benar nol. Dipakai `addExpense`/`updateExpense`.
 */
export function buildSplitRows(
  expenseId: string,
  amount: number,
  participantIds: string[],
): SplitRow[] {
  return [...splitEvenly(amount, participantIds).entries()].map(
    ([userId, shareAmount]) => ({
      expense_id: expenseId,
      user_id: userId,
      share_amount: shareAmount,
    }),
  );
}

/**
 * Baris split untuk settlement ("Tandai lunas"): satu pasangan dari → ke.
 * Dipakai `markSettled`.
 */
export function buildSettlementSplitRow(
  expenseId: string,
  toUserId: string,
  amount: number,
): SplitRow {
  return { expense_id: expenseId, user_id: toUserId, share_amount: amount };
}
