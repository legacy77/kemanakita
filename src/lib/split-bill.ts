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
