"use client";

// Form ubah pengeluaran (client) — PRD §4.5. Pola sama dengan AddExpenseForm
// (pakai <details> sederhana), nilai terisi dari pengeluaran yang dipilih.
// Bagi hasil dihitung ulang di server (`updateExpense` → `splitEvenly`).

import { useActionState, useState } from "react";
import { updateExpense, type ExpenseFormState } from "@/lib/trips/expense-actions";
import {
  EXPENSE_CATEGORIES,
  formatRupiahInput,
  parseRupiahInput,
  type ExpenseCategoryKey,
} from "@/lib/validate";

const initialState: ExpenseFormState = { status: "idle" };

export function EditExpenseForm({
  tripId,
  expenseId,
  memberIds,
  displayNames,
  defaultValues,
}: {
  tripId: string;
  expenseId: string;
  memberIds: string[];
  displayNames: Record<string, string>;
  defaultValues: {
    title: string;
    amount: number;
    paidBy: string;
    date: string;
    category: ExpenseCategoryKey;
    participantIds: string[];
  };
}) {
  const [state, action, pending] = useActionState(updateExpense, initialState);
  const [amountText, setAmountText] = useState(
    formatRupiahInput(defaultValues.amount),
  );
  // Peserta terpilih dari split lama, dibatasi ke anggota yang masih ada.
  const [selected, setSelected] = useState<Set<string>>(
    new Set(defaultValues.participantIds.filter((id) => memberIds.includes(id))),
  );

  return (
    <details className="rpg-panel">
      <summary
        className="cursor-pointer list-none px-3 py-2 font-display text-[13px] font-bold text-gold-700"
        aria-label={`Ubah pengeluaran ${defaultValues.title}`}
      >
        ✏️ Ubah
      </summary>
      <form action={action} className="flex flex-col gap-3 border-t border-border p-3">
        <input type="hidden" name="tripId" value={tripId} />
        <input type="hidden" name="expenseId" value={expenseId} />

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
          Untuk apa
          <input
            name="title"
            required
            maxLength={160}
            defaultValue={defaultValues.title}
            className="h-11 rounded-md border-2 border-border-strong bg-surface px-3 text-[16px] font-normal outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
          Nominal (Rp)
          <input
            name="amount"
            inputMode="numeric"
            required
            value={amountText}
            onChange={(e) => {
              const parsed = parseRupiahInput(e.target.value);
              setAmountText(parsed === null ? e.target.value : formatRupiahInput(parsed));
            }}
            className="h-11 rounded-md border-2 border-border-strong bg-surface px-3 text-[16px] font-normal outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
            Dibayar oleh
            <select
              name="paidBy"
              defaultValue={defaultValues.paidBy}
              className="h-11 rounded-md border-2 border-border-strong bg-surface px-3 text-[16px] font-normal outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25"
            >
              {memberIds.map((id) => (
                <option key={id} value={id}>
                  {displayNames[id] ?? id}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
            Kategori
            <select
              name="category"
              defaultValue={defaultValues.category}
              className="h-11 rounded-md border-2 border-border-strong bg-surface px-3 text-[16px] font-normal outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
          Tanggal
          <input
            name="date"
            type="date"
            defaultValue={defaultValues.date}
            required
            className="h-11 rounded-md border-2 border-border-strong bg-surface px-3 text-[16px] font-normal outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25"
          />
        </label>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-[13px] font-semibold text-fg">Dibagi ke</legend>
          <div className="flex flex-col gap-1.5">
            {memberIds.map((id) => (
              <label key={id} className="flex items-center gap-2 text-[15px] text-fg">
                <input
                  type="checkbox"
                  name="participants"
                  value={id}
                  checked={selected.has(id)}
                  onChange={(e) => {
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(id);
                      else next.delete(id);
                      return next;
                    });
                  }}
                  className="h-5 w-5 accent-sky-600"
                />
                {displayNames[id] ?? id}
              </label>
            ))}
          </div>
        </fieldset>

        {state.status === "error" && (
          <p role="alert" className="rounded-md border border-danger/30 bg-danger-bg px-3 py-2.5 text-[14px] text-danger">
            {state.message}
          </p>
        )}
        {state.status === "ok" && (
          <p role="status" className="rounded-md border border-success/30 bg-success-bg px-3 py-2.5 text-[14px] text-success">
            Perubahan tersimpan.
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rpg-btn h-11 rounded-md bg-action px-4 text-[15px] font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Menyimpan…" : "Simpan perubahan"}
        </button>
      </form>
    </details>
  );
}