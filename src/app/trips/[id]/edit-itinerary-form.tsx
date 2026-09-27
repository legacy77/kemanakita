"use client";

// Form ubah item itinerary (client) — PRD §4.4. Pola sama dengan AddItineraryForm
// (pakai <details> sederhana), nilai terisi dari item yang ada.

import { useActionState } from "react";
import {
  updateItineraryItem,
  type ItineraryFormState,
} from "@/lib/trips/itinerary-actions";

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
  };
}) {
  const [state, action, pending] = useActionState(updateItineraryItem, initialState);

  return (
    <details className="rounded-md border border-border">
      <summary
        className="cursor-pointer list-none px-3 py-2 text-[13px] font-semibold text-action"
        aria-label={`Ubah agenda ${defaultValues.title}`}
      >
        ✏️ Ubah
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
            className="h-11 rounded-md border border-border bg-surface px-3 text-[16px] font-normal outline-none focus:border-lagoon-600 focus:ring-2 focus:ring-lagoon-600/20"
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
              className="h-11 rounded-md border border-border bg-surface px-3 text-[16px] font-normal outline-none focus:border-lagoon-600 focus:ring-2 focus:ring-lagoon-600/20"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
            Jam (opsional)
            <input
              name="time"
              type="time"
              defaultValue={defaultValues.time}
              className="h-11 rounded-md border border-border bg-surface px-3 text-[16px] font-normal outline-none focus:border-lagoon-600 focus:ring-2 focus:ring-lagoon-600/20"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
          Lokasi (opsional)
          <input
            name="location"
            maxLength={160}
            defaultValue={defaultValues.location}
            className="h-11 rounded-md border border-border bg-surface px-3 text-[16px] font-normal outline-none focus:border-lagoon-600 focus:ring-2 focus:ring-lagoon-600/20"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
          Catatan (opsional)
          <textarea
            name="notes"
            maxLength={500}
            rows={2}
            defaultValue={defaultValues.notes}
            className="rounded-md border border-border bg-surface px-3 py-2 text-[16px] font-normal outline-none focus:border-lagoon-600 focus:ring-2 focus:ring-lagoon-600/20"
          />
        </label>

        {state.status === "error" && (
          <p role="alert" className="rounded-md bg-danger-bg px-3 py-2.5 text-[14px] text-danger">
            {state.message}
          </p>
        )}
        {state.status === "ok" && (
          <p role="status" className="rounded-md bg-lagoon-50 px-3 py-2.5 text-[14px] text-action">
            Perubahan tersimpan.
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-md bg-action px-4 text-[15px] font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Menyimpan…" : "Simpan perubahan"}
        </button>
      </form>
    </details>
  );
}
