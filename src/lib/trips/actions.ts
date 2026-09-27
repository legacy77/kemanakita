"use server";

// Server actions trip: buat + list + hapus (owner).
// Rujukan: PRD §4.2, §7.4. RLS adalah otoritas — service key TIDAK dipakai.
// Semua input divalidasi server-side via `src/lib/validate.ts`.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateTripInput } from "@/lib/validate";

export type CreateTripState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "created"; tripId: string };

export async function createTrip(
  _prev: CreateTripState,
  formData: FormData,
): Promise<CreateTripState> {
  const checked = validateTripInput({
    title: String(formData.get("title") ?? ""),
    destination: String(formData.get("destination") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
  });

  if (!checked.ok) return { status: "error", message: checked.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/trips");

  const { data, error } = await supabase
    .from("trips")
    .insert({
      title: checked.value.title,
      destination: checked.value.destination === "" ? null : checked.value.destination,
      start_date: checked.value.startDate,
      end_date: checked.value.endDate,
      created_by: user.id,
    })
    .select("id")
    .single();

  // Trigger `on_trip_created` (migrasi 20260927) menjadikan pembuat = owner.
  // Bila trigger belum di-run, insert trip boleh sukses tapi pembuat belum
  // member (RLS menolak baca) — beri tahu user untuk hubungi admin.
  if (error || !data) {
    return { status: "error", message: "Gagal bikin trip. Coba lagi sebentar ya." };
  }
  return { status: "created", tripId: data.id };
}

export async function deleteTrip(formData: FormData): Promise<void> {
  const tripId = String(formData.get("tripId") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/trips");

  // RLS `trips_delete_owner` hanya lolos bila pemanggil = owner.
  await supabase.from("trips").delete().eq("id", tripId);
  redirect("/trips");
}
