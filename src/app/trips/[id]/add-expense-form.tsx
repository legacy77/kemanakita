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
    <details className="rounded-lg border border-border bg-surface shadow-sm">
      <summary className="cursor-pointer list-none px-4 py-3 text-[15px] font-semibold text-action">
        + Catat pengeluaran
      </summary>
      <form action={action} className="flex flex-col gap-3 border-t border-border p-4">
        <input type="hidden" name="tripId" value={tripId} />

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
          Untuk apa
          <input name="title" required maxLength={160} placeholder="Makan siang" className="h-11 rounded-md border border-border bg-surface px-3 text-[16px] font-normal outline-none focus:border-lagoon-600 focus:ring-2 focus:ring-lagoon-600/20" />
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
            className="h-11 rounded-md border border-border bg-surface px-3 text-[16px] font-normal outline-none focus:border-lagoon-600 focus:ring-2 focus:ring-lagoon-600/20"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
            Dibayar oleh
            <select name="paidBy" defaultValue={currentUserId} className="h-11 rounded-md border border-border bg-surface px-3 text-[16px] font-normal outline-none focus:border-lagoon-600 focus:ring-2 focus:ring-lagoon-600/20">
              {memberIds.map((id) => (
                <option key={id} value={id}>
                  {displayNames[id] ?? id}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
            Kategori
            <select name="category" defaultValue={EXPENSE_CATEGORIES[0].key} className="h-11 rounded-md border border-border bg-surface px-3 text-[16px] font-normal outline-none focus:border-lagoon-600 focus:ring-2 focus:ring-lagoon-600/20">
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
          <input name="date" type="date" defaultValue={tripDate} required className="h-11 rounded-md border border-border bg-surface px-3 text-[16px] font-normal outline-none focus:border-lagoon-600 focus:ring-2 focus:ring-lagoon-600/20" />
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
                  className="h-5 w-5 accent-lagoon-700"
                />
                {displayNames[id] ?? id}
              </label>
            ))}
          </div>
        </fieldset>

        {state.status === "error" && <p role="alert" className="rounded-md bg-danger-bg px-3 py-2.5 text-[14px] text-danger">{state.message}</p>}
        {state.status === "ok" && <p role="status" className="rounded-md bg-lagoon-50 px-3 py-2.5 text-[14px] text-action">Pengeluaran tersimpan.</p>}

        <button type="submit" disabled={pending} className="h-11 rounded-md bg-action px-4 text-[15px] font-semibold text-white disabled:opacity-60">
          {pending ? "Menyimpan…" : "Simpan pengeluaran"}
        </button>
      </form>
    </details>
  );
}
