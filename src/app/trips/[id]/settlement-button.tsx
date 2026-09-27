"use client";

// Tombol "Tandai lunas" (client) — PRD §4.5, §8 langkah 5.
// Satu tombol per saran transfer; from/to/amount diisi otomatis dari saran.
// Memanggil server action `markSettled`; RLS di server yang memutuskan boleh/tidak.

import { useActionState } from "react";
import { markSettled, type SettlementFormState } from "@/lib/trips/settlement-actions";

const initialState: SettlementFormState = { status: "idle" };

export function SettlementButton({
  tripId,
  from,
  to,
  amount,
  label,
}: {
  tripId: string;
  from: string;
  to: string;
  amount: number;
  label: string;
}) {
  const [state, action, pending] = useActionState(markSettled, initialState);

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="from" value={from} />
      <input type="hidden" name="to" value={to} />
      <input type="hidden" name="amount" value={String(amount)} />
      <button
        type="submit"
        disabled={pending}
        aria-label={label}
        className="h-9 shrink-0 rounded-md border border-lagoon-600 px-3 text-[13px] font-semibold text-action transition-colors hover:bg-lagoon-50 disabled:opacity-60"
      >
        {pending ? "Menyimpan…" : "Tandai lunas"}
      </button>
      {state.status === "error" && (
        <p role="alert" className="text-[12px] leading-4 text-danger">
          {state.message}
        </p>
      )}
    </form>
  );
}
