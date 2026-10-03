"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { deleteExpense, type ExpenseFormState } from "@/lib/trips/expense-actions";
import { deleteItineraryItem, type ItineraryFormState } from "@/lib/trips/itinerary-actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast";

const itineraryInitialState: ItineraryFormState = { status: "idle" };
const expenseInitialState: ExpenseFormState = { status: "idle" };

function DeleteButton({
  onClick,
  disabled,
  pending,
}: {
  onClick: () => void;
  disabled?: boolean;
  pending?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
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
  const [state, action, pending] = useActionState(deleteItineraryItem, itineraryInitialState);
  const [confirming, setConfirming] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { pushToast } = useToast();

  useEffect(() => {
    if (state.status === "ok") pushToast("success", "Agenda dihapus.");
    else if (state.status === "error") pushToast("error", state.message);
  }, [state, pushToast]);

  const handleConfirm = () => {
    setConfirming(false);
    formRef.current?.requestSubmit();
  };

  return (
    <>
      <form ref={formRef} action={action} className="hidden">
        <input type="hidden" name="tripId" value={tripId} />
        <input type="hidden" name="itemId" value={itemId} />
      </form>
      <DeleteButton onClick={() => setConfirming(true)} disabled={pending} pending={pending} />
      <ConfirmDialog
        open={confirming}
        title="Hapus agenda?"
        description={`Hapus "${itemTitle}"?`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(false)}
        pending={pending}
      />
    </>
  );
}

export function DeleteExpenseButton({ tripId, expenseId }: { tripId: string; expenseId: string }) {
  const [state, formAction, pending] = useActionState(deleteExpense, expenseInitialState);
  const [confirming, setConfirming] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { pushToast } = useToast();

  useEffect(() => {
    if (state.status === "ok") pushToast("success", "Pengeluaran dihapus.");
    else if (state.status === "error") pushToast("error", state.message);
  }, [state, pushToast]);

  const handleConfirm = () => {
    setConfirming(false);
    formRef.current?.requestSubmit();
  };

  return (
    <>
      <form ref={formRef} action={formAction} className="hidden">
        <input type="hidden" name="tripId" value={tripId} />
        <input type="hidden" name="expenseId" value={expenseId} />
      </form>
      <DeleteButton onClick={() => setConfirming(true)} disabled={pending} pending={pending} />
      <ConfirmDialog
        open={confirming}
        title="Hapus pengeluaran?"
        description="Hapus pengeluaran ini? Aksi ini tidak bisa dibatalkan."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(false)}
        pending={pending}
      />
    </>
  );
}