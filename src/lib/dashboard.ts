// Agregasi personal lintas trip untuk /dashboard (spec §4.3).
//
// Satu-satunya sumber angka adalah modul saldo bersama `split-bill.ts`, supaya
// /dashboard dan /trips/[id] tidak pernah menampilkan saldo yang berbeda.
// Modul ini murni (tanpa I/O) agar bisa diuji tanpa Supabase.

import {
  computeBalances,
  suggestSettlements,
  splitEvenly,
  type Expense,
  type Transfer,
} from "./split-bill.ts";

/** Data satu trip yang sudah dipetakan ke tipe domain split-bill. */
export interface TripData {
  tripId: string;
  title: string;
  expenses: Expense[];
  settlements: Transfer[];
}

/** Satu saran pelunasan yang melibatkan user, berlabel judul trip. */
export interface MySuggestion {
  tripId: string;
  tripTitle: string;
  from: string;
  to: string;
  amount: number;
}

export type PersonalStatus = "menerima" | "bayar" | "impas" | "lunas";

export interface PersonalSummary {
  /** Net lintas trip: > 0 menerima, < 0 membayar. */
  net: number;
  totalReceive: number;
  totalPay: number;
  /** Bagian user sendiri (bukan total trip) atas semua expense non-settlement. */
  totalSpent: number;
  status: PersonalStatus;
  /** Saran pelunasan yang melibatkan user (untuk kartu "Saran pelunasan"). */
  mySuggestions: MySuggestion[];
  /** Jumlah partner unik pada saran yang melibatkan user. */
  partnerCount: number;
}

/**
 * Ringkas posisi personal user terhadap seluruh trip-nya.
 *
 * `net` per trip dihitung dari `computeBalances` (settlement ikut dihitung),
 * lalu diagregasi: `net = Σ max(0, nᵢ) − Σ max(0, −nᵢ)`.
 */
export function summarizePersonal(
  userId: string,
  trips: readonly TripData[],
): PersonalSummary {
  let totalReceive = 0;
  let totalPay = 0;
  let totalSpent = 0;
  const mySuggestions: MySuggestion[] = [];

  for (const trip of trips) {
    const balances = computeBalances(trip.expenses, trip.settlements);
    const net = balances.get(userId) ?? 0;
    if (net > 0) totalReceive += net;
    else if (net < 0) totalPay += -net;

    for (const expense of trip.expenses) {
      totalSpent += splitEvenly(expense.amount, expense.participantIds).get(userId) ?? 0;
    }

    for (const suggestion of suggestSettlements(balances)) {
      if (suggestion.from !== userId && suggestion.to !== userId) continue;
      mySuggestions.push({
        tripId: trip.tripId,
        tripTitle: trip.title,
        from: suggestion.from,
        to: suggestion.to,
        amount: suggestion.amount,
      });
    }
  }

  const net = totalReceive - totalPay;

  const status: PersonalStatus =
    net > 0
      ? "menerima"
      : net < 0
        ? "bayar"
        : totalReceive > 0
          ? "impas"
          : "lunas";

  const partners = new Set<string>();
  for (const s of mySuggestions) {
    if (s.from === userId) partners.add(s.to);
    else if (s.to === userId) partners.add(s.from);
  }

  return {
    net,
    totalReceive,
    totalPay,
    totalSpent,
    status,
    mySuggestions,
    partnerCount: partners.size,
  };
}
