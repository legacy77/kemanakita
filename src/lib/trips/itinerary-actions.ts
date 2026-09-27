"use server";

// Server action itinerary — PRD §4.4. RLS adalah otoritas; semua anggota trip
// boleh tambah/ubah/hapus (policy `itinerary_*_member`). Service key TIDAK dipakai.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateItineraryInput } from "@/lib/validate";

export type ItineraryFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "ok" };

function inputFromForm(formData: FormData) {
  return {
    date: String(formData.get("date") ?? ""),
    time: String(formData.get("time") ?? ""),
    title: String(formData.get("title") ?? ""),
    location: String(formData.get("location") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    category: String(formData.get("category") ?? ""),
  };
}

/**
 * Ambil rentang tanggal trip untuk memastikan `date` item ada di dalamnya.
 * Mengembalikan `null` bila trip tak ketemu (RLS: non-member tak bisa baca).
 * Alasan server-side: `groupItineraryByDay` "menempel" item di luar rentang
 * ke hari terdekat secara diam-diam — jadi rentang WAHIB dicek di server, bukan
 * hanya `min`/`max` di input (yang bisa dilewati).
 */
async function getTripRange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tripId: string,
): Promise<{ start: string; end: string } | null> {
  const { data } = await supabase
    .from("trips")
    .select("start_date, end_date")
    .eq("id", tripId)
    .maybeSingle();
  if (!data) return null;
  return { start: data.start_date, end: data.end_date };
}

export async function addItineraryItem(
  _prev: ItineraryFormState,
  formData: FormData,
): Promise<ItineraryFormState> {
  const tripId = String(formData.get("tripId") ?? "");
  if (tripId === "") {
    return { status: "error", message: "Trip nggak dikenali. Muat ulang halamannya ya." };
  }

  const checked = validateItineraryInput(inputFromForm(formData));
  if (!checked.ok) return { status: "error", message: checked.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "Sesi kamu udah habis. Masuk lagi ya." };
  }

  const range = await getTripRange(supabase, tripId);
  if (!range) {
    return { status: "error", message: "Trip nggak ketemu. Muat ulang halamannya ya." };
  }
  if (checked.value.date < range.start || checked.value.date > range.end) {
    return { status: "error", message: "Tanggal agenda harus dalam rentang trip." };
  }

  // sort_order = max yang ada + 1 supaya item tanpa jam tetap urut sesuai input.
  // Best-effort: bukan operasi atomik, tapi cukup untuk pola pemakaian MVP.
  const { data: last } = await supabase
    .from("itinerary_items")
    .select("sort_order")
    .eq("trip_id", tripId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSortOrder = (last?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("itinerary_items").insert({
    trip_id: tripId,
    date: checked.value.date,
    time: checked.value.time,
    title: checked.value.title,
    location: checked.value.location === "" ? null : checked.value.location,
    notes: checked.value.notes === "" ? null : checked.value.notes,
    category: checked.value.category,
    sort_order: nextSortOrder,
  });

  if (error) {
    return { status: "error", message: "Gagal simpan agenda. Coba lagi sebentar ya." };
  }

  revalidatePath(`/trips/${tripId}`);
  return { status: "ok" };
}

export async function updateItineraryItem(
  _prev: ItineraryFormState,
  formData: FormData,
): Promise<ItineraryFormState> {
  const tripId = String(formData.get("tripId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  if (tripId === "" || itemId === "") {
    return { status: "error", message: "Agenda nggak dikenali. Muat ulang halamannya ya." };
  }

  const checked = validateItineraryInput(inputFromForm(formData));
  if (!checked.ok) return { status: "error", message: checked.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "Sesi kamu udah habis. Masuk lagi ya." };
  }

  const range = await getTripRange(supabase, tripId);
  if (!range) {
    return { status: "error", message: "Trip nggak ketemu. Muat ulang halamannya ya." };
  }
  if (checked.value.date < range.start || checked.value.date > range.end) {
    return { status: "error", message: "Tanggal agenda harus dalam rentang trip." };
  }

  // RLS `itinerary_update_member` menolak bila bukan anggota trip.
  const { error } = await supabase
    .from("itinerary_items")
    .update({
      date: checked.value.date,
      time: checked.value.time,
      title: checked.value.title,
      location: checked.value.location === "" ? null : checked.value.location,
      notes: checked.value.notes === "" ? null : checked.value.notes,
      category: checked.value.category,
    })
    .eq("id", itemId)
    .eq("trip_id", tripId);

  if (error) {
    return { status: "error", message: "Gagal ubah agenda. Coba lagi sebentar ya." };
  }

  revalidatePath(`/trips/${tripId}`);
  return { status: "ok" };
}

/**
 * Hapus item. Mengembalikan `ItineraryFormState` (dulu `void`) agar UI bisa
 * menampilkan galat; RLS `itinerary_delete_member` menolak bila bukan anggota.
 * Revalidate hanya saat sukses.
 */
export async function deleteItineraryItem(
  _prev: ItineraryFormState,
  formData: FormData,
): Promise<ItineraryFormState> {
  const tripId = String(formData.get("tripId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  if (tripId === "" || itemId === "") {
    return { status: "error", message: "Agenda nggak dikenali. Muat ulang halamannya ya." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "Sesi kamu udah habis. Masuk lagi ya." };
  }

  // RLS `itinerary_delete_member` menolak bila bukan anggota trip.
  const { error } = await supabase
    .from("itinerary_items")
    .delete()
    .eq("id", itemId)
    .eq("trip_id", tripId);

  if (error) {
    return { status: "error", message: "Gagal hapus agenda. Coba lagi sebentar ya." };
  }

  revalidatePath(`/trips/${tripId}`);
  return { status: "ok" };
}
