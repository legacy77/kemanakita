"use client";

// Tombol hapus kecil (client) — memanggil server action lewat form agar
// tidak perlu JS khusus; RLS di server yang memutuskan boleh/tidaknya.

import { useFormStatus } from "react-dom";
import { deleteExpense } from "@/lib/trips/expense-actions";
import { deleteItineraryItem } from "@/lib/trips/itinerary-actions";

function PendingHapus() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Hapus"
      title="Hapus"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-border-strong bg-surface text-[15px] text-ink-600 transition-colors hover:text-danger disabled:opacity-50"
    >
      <span aria-hidden>{pending ? "…" : "🗑️"}</span>
    </button>
  );
}

export function DeleteItineraryButton({ tripId, itemId }: { tripId: string; itemId: string }) {
  return (
    <form action={deleteItineraryItem}>
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="itemId" value={itemId} />
      <PendingHapus />
    </form>
  );
}

export function DeleteExpenseButton({ tripId, expenseId }: { tripId: string; expenseId: string }) {
  return (
    <form action={deleteExpense}>
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="expenseId" value={expenseId} />
      <PendingHapus />
    </form>
  );
}
