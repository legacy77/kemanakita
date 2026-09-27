"use server";

// Server action itinerary — PRD §4.4. RLS adalah otoritas; semua anggota trip
// boleh tambah/hapus (policy `itinerary_*_member`). Service key TIDAK dipakai.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateItineraryInput } from "@/lib/validate";

export type ItineraryFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "ok" };

export async function addItineraryItem(
  _prev: ItineraryFormState,
  formData: FormData,
): Promise<ItineraryFormState> {
  const tripId = String(formData.get("tripId") ?? "");
  if (tripId === "") {
    return { status: "error", message: "Trip nggak dikenali. Muat ulang halamannya ya." };
  }

  const checked = validateItineraryInput({
    date: String(formData.get("date") ?? ""),
    time: String(formData.get("time") ?? ""),
    title: String(formData.get("title") ?? ""),
    location: String(formData.get("location") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!checked.ok) return { status: "error", message: checked.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "Sesi kamu udah habis. Masuk lagi ya." };
  }

  // sort_order menaik supaya item tanpa jam tetap urut sesuai urutan input.
  const { count } = await supabase
    .from("itinerary_items")
    .select("id", { count: "exact", head: true })
    .eq("trip_id", tripId);

  const { error } = await supabase.from("itinerary_items").insert({
    trip_id: tripId,
    date: checked.value.date,
    time: checked.value.time,
    title: checked.value.title,
    location: checked.value.location === "" ? null : checked.value.location,
    notes: checked.value.notes === "" ? null : checked.value.notes,
    sort_order: count ?? 0,
  });

  if (error) {
    return { status: "error", message: "Gagal simpan agenda. Coba lagi sebentar ya." };
  }

  revalidatePath(`/trips/${tripId}`);
  return { status: "ok" };
}

export async function deleteItineraryItem(formData: FormData): Promise<void> {
  const tripId = String(formData.get("tripId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  if (tripId === "" || itemId === "") return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // RLS `itinerary_delete_member` menolak bila bukan anggota trip.
  await supabase.from("itinerary_items").delete().eq("id", itemId).eq("trip_id", tripId);
  revalidatePath(`/trips/${tripId}`);
}
