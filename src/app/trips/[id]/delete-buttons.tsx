"use client";

// Tombol hapus kecil (client) — memanggil server action lewat form agar
// tidak perlu JS khusus; RLS di server yang memutuskan boleh/tidaknya.
//
// Itinerary: dua langkah (klik → konfirmasi) + tinggi ≥44px sesuai
// design_system §12, dan aksi mengembalikan state agar galat terlihat.

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { deleteExpense } from "@/lib/trips/expense-actions";
import {
  deleteItineraryItem,
  type ItineraryFormState,
} from "@/lib/trips/itinerary-actions";

const initialState: ItineraryFormState = { status: "idle" };

function PendingHapus() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Hapus"
      title="Hapus"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-2 border-border-strong bg-surface text-[15px] text-ink-600 transition-colors hover:text-danger disabled:opacity-50"
    >
      <span aria-hidden>{pending ? "…" : "🗑️"}</span>
    </button>
  );
}

export function DeleteItineraryButton({
  tripId,
  itemId,
  itemTitle,
}: {
  tripId: string;
  itemId: string;
  itemTitle: string;
}) {
  const [state, action, pending] = useActionState(deleteItineraryItem, initialState);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={`Hapus agenda ${itemTitle}`}
          title="Hapus agenda"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-2 border-border-strong bg-surface text-[15px] text-ink-600 transition-colors hover:text-danger"
        >
          <span aria-hidden>🗑️</span>
        </button>
        {state.status === "error" && (
          <p role="alert" className="max-w-[180px] text-right text-[12px] leading-4 text-danger">
            {state.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="itemId" value={itemId} />
      <p className="max-w-[180px] text-right text-[12px] leading-4 text-fg-muted">
        Hapus agenda ini?
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="h-11 rounded-md border-2 border-border-strong bg-surface px-3 text-[13px] font-semibold text-ink-700 disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={pending}
          aria-label={`Konfirmasi hapus agenda ${itemTitle}`}
          className="h-11 rounded-md border-2 border-danger bg-danger-bg px-3 text-[13px] font-semibold text-danger disabled:opacity-50"
        >
          {pending ? "Menghapus…" : "Hapus"}
        </button>
      </div>
      {state.status === "error" && (
        <p role="alert" className="max-w-[180px] text-right text-[12px] leading-4 text-danger">
          {state.message}
        </p>
      )}
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
