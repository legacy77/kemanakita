"use client";

import { useActionState } from "react";
import { addItineraryItem, type ItineraryFormState } from "@/lib/trips/itinerary-actions";
import { DEFAULT_ITINERARY_CATEGORY } from "@/lib/itinerary";
import { ItineraryCategoryField } from "./itinerary-category-field";

const initialState: ItineraryFormState = { status: "idle" };

export function AddItineraryForm({
  tripId,
  startDate,
  endDate,
  defaultDate,
}: {
  tripId: string;
  startDate: string;
  endDate: string;
  /** Tanggal terpilih (mis. tanggal kartu hari). Default: hari pertama trip. */
  defaultDate?: string;
}) {
  const [state, action, pending] = useActionState(addItineraryItem, initialState);
  const date = defaultDate ?? startDate;

  const form = (
    <form action={action} className="flex flex-col gap-3 border-t border-border p-4">
      <input type="hidden" name="tripId" value={tripId} />
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
        Judul agenda
        <input name="title" required maxLength={160} placeholder="Sarapan bareng" className="h-11 rounded-md border-2 border-border-strong bg-surface px-3 text-[16px] font-normal outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
          Tanggal
          <input name="date" type="date" min={startDate} max={endDate} defaultValue={date} required className="h-11 rounded-md border-2 border-border-strong bg-surface px-3 text-[16px] font-normal outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25" />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
          Jam (opsional)
          <input name="time" type="time" className="h-11 rounded-md border-2 border-border-strong bg-surface px-3 text-[16px] font-normal outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25" />
        </label>
      </div>
      <ItineraryCategoryField defaultValue={DEFAULT_ITINERARY_CATEGORY} />
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
        Lokasi (opsional)
        <input name="location" maxLength={160} placeholder="Kafe dekat hotel" className="h-11 rounded-md border-2 border-border-strong bg-surface px-3 text-[16px] font-normal outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25" />
      </label>
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
        Catatan (opsional)
        <textarea name="notes" maxLength={500} rows={2} placeholder="Bawa jaket" className="rounded-md border-2 border-border-strong bg-surface px-3 py-2 text-[16px] font-normal outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25" />
      </label>
      {state.status === "error" && <p role="alert" className="rounded-md border border-danger/30 bg-danger-bg px-3 py-2.5 text-[14px] text-danger">{state.message}</p>}
      {state.status === "ok" && <p role="status" className="rounded-md border border-success/30 bg-success-bg px-3 py-2.5 text-[14px] text-success">Agenda tersimpan.</p>}
      <button type="submit" disabled={pending} className="rpg-btn h-11 rounded-md bg-action px-4 text-[15px] font-semibold text-white disabled:opacity-60">
        {pending ? "Menyimpan…" : "Simpan agenda"}
      </button>
    </form>
  );

  return (
    <details className="mt-2 rounded-md border border-border">
      <summary className="flex min-h-11 cursor-pointer list-none items-center px-3 text-[14px] font-semibold text-action">
        + Tambah agenda di hari ini
      </summary>
      {form}
    </details>
  );
}
