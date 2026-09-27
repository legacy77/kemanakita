"use client";

import { useActionState, useState } from "react";
import { addExpense, type ExpenseFormState } from "@/lib/trips/expense-actions";
import { EXPENSE_CATEGORIES, formatRupiahInput, parseRupiahInput } from "@/lib/validate";

const initialState: ExpenseFormState = { status: "idle" };

export function AddExpenseForm({
  tripId,
  tripDate,
  memberIds,
  displayNames,
  currentUserId,
}: {
  tripId: string;
  tripDate: string;
  memberIds: string[];
  displayNames: Record<string, string>;
  currentUserId: string;
}) {
  const [state, action, pending] = useActionState(addExpense, initialState);
  const [amountText, setAmountText] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(memberIds));

  return (
    <details className="rpg-panel">
      <summary className="cursor-pointer list-none px-4 py-3 font-display text-[15px] font-bold text-gold-700">
        + Catat pengeluaran
      </summary>
      <form action={action} className="flex flex-col gap-3 border-t border-border p-4">
        <input type="hidden" name="tripId" value={tripId} />

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
          Untuk apa
          <input name="title" required maxLength={160} placeholder="Makan siang" className="h-11 rounded-md border-2 border-border-strong bg-surface px-3 text-[16px] font-normal outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25" />
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
          Nominal (Rp)
          <input
            name="amount"
            inputMode="numeric"
            required
            placeholder="150.000"
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
            <select name="paidBy" defaultValue={currentUserId} className="h-11 rounded-md border-2 border-border-strong bg-surface px-3 text-[16px] font-normal outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25">
              {memberIds.map((id) => (
                <option key={id} value={id}>
                  {displayNames[id] ?? id}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
            Kategori
            <select name="category" defaultValue={EXPENSE_CATEGORIES[0].key} className="h-11 rounded-md border-2 border-border-strong bg-surface px-3 text-[16px] font-normal outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25">
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
          <input name="date" type="date" defaultValue={tripDate} required className="h-11 rounded-md border-2 border-border-strong bg-surface px-3 text-[16px] font-normal outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25" />
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

        {state.status === "error" && <p role="alert" className="rounded-md border border-danger/30 bg-danger-bg px-3 py-2.5 text-[14px] text-danger">{state.message}</p>}
        {state.status === "ok" && <p role="status" className="rounded-md border border-success/30 bg-success-bg px-3 py-2.5 text-[14px] text-success">Pengeluaran tersimpan.</p>}

        <button type="submit" disabled={pending} className="rpg-btn h-11 rounded-md bg-action px-4 text-[15px] font-semibold text-white disabled:opacity-60">
          {pending ? "Menyimpan…" : "Simpan pengeluaran"}
        </button>
      </form>
    </details>
  );
}
