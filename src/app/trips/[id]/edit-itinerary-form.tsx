"use client";

// Form ubah item itinerary (client) — PRD §4.4. Pola sama dengan AddItineraryForm
// (pakai <details> sederhana), nilai terisi dari item yang ada.

import { useActionState } from "react";
import {
  updateItineraryItem,
  type ItineraryFormState,
} from "@/lib/trips/itinerary-actions";
import { ItineraryCategoryField } from "./itinerary-category-field";

const initialState: ItineraryFormState = { status: "idle" };

export function EditItineraryForm({
  tripId,
  itemId,
  startDate,
  endDate,
  defaultValues,
}: {
  tripId: string;
  itemId: string;
  startDate: string;
  endDate: string;
  defaultValues: {
    date: string;
    time: string;
    title: string;
    location: string;
    notes: string;
    category: string;
  };
}) {
  const [state, action, pending] = useActionState(updateItineraryItem, initialState);

  return (
    <details className="rounded-md border border-border">
      <summary
        className="flex min-h-11 cursor-pointer list-none items-center px-3 text-[14px] font-semibold text-action"
        aria-label={`Ubah agenda ${defaultValues.title}`}
      >
        ✏️ Ubah agenda
      </summary>
      <form action={action} className="flex flex-col gap-3 border-t border-border p-3">
        <input type="hidden" name="tripId" value={tripId} />
        <input type="hidden" name="itemId" value={itemId} />

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
          Judul agenda
          <input
            name="title"
            required
            maxLength={160}
            defaultValue={defaultValues.title}
            className="h-11 rounded-md border-2 border-border-strong bg-surface px-3 text-[16px] font-normal outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
            Tanggal
            <input
              name="date"
              type="date"
              min={startDate}
              max={endDate}
              defaultValue={defaultValues.date}
              required
              className="h-11 rounded-md border-2 border-border-strong bg-surface px-3 text-[16px] font-normal outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
            Jam (opsional)
            <input
              name="time"
              type="time"
              defaultValue={defaultValues.time}
              className="h-11 rounded-md border-2 border-border-strong bg-surface px-3 text-[16px] font-normal outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25"
            />
          </label>
        </div>

        <ItineraryCategoryField defaultValue={defaultValues.category} />

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
          Lokasi (opsional)
          <input
            name="location"
            maxLength={160}
            defaultValue={defaultValues.location}
            className="h-11 rounded-md border-2 border-border-strong bg-surface px-3 text-[16px] font-normal outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
          Catatan (opsional)
          <textarea
            name="notes"
            maxLength={500}
            rows={2}
            defaultValue={defaultValues.notes}
            className="rounded-md border-2 border-border-strong bg-surface px-3 py-2 text-[16px] font-normal outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25"
          />
        </label>

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
