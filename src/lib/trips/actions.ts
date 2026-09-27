"use server";

// Server actions trip: buat + list + hapus (owner).
// Rujukan: PRD §4.2, §7.4. RLS adalah otoritas — service key TIDAK dipakai.
// Semua input divalidasi server-side via `src/lib/validate.ts`.

import { revalidatePath } from "next/cache";
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

  // BLOCKER-1: jangan `.select().single()` setelah insert. `trips` hanya bisa
  // dibaca oleh member (RLS `trips_select_member`), dan keanggotaan owner dibuat
  // oleh trigger `on_trip_created` (migrasi 20260927) — pembacaan balik bisa
  // balik kosong / gagal. Jadi id di-generate di sini dan dipakai eksplisit.
  const tripId = crypto.randomUUID();

  const { error } = await supabase.from("trips").insert({
    id: tripId,
    title: checked.value.title,
    destination: checked.value.destination === "" ? null : checked.value.destination,
    start_date: checked.value.startDate,
    end_date: checked.value.endDate,
    created_by: user.id,
  });

  if (error) {
    return { status: "error", message: "Gagal bikin trip. Coba lagi sebentar ya." };
  }

  // Verifikasi baris keanggotaan owner. Trigger `on_trip_created` (migrasi
  // 20260927) yang membuatnya. Bila belum di-run, insert trip sukses tapi tak
  // ada baris member → beri tahu user dengan pesan actionable.
  const { data: membership } = await supabase
    .from("trip_members")
    .select("trip_id")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return {
      status: "error",
      message: "Trip kebuat tapi kamu belum tercatat sebagai anggota. Hubungi admin: migrasi 20260927 belum jalan.",
    };
  }

  return { status: "created", tripId };
}

export async function deleteTrip(formData: FormData): Promise<void> {
  const tripId = String(formData.get("tripId") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/trips");

  // RLS `trips_delete_owner` hanya lolos bila pemanggil = owner. Bila bukan
  // owner, delete tidak menghapus baris apa pun TANPA error — jadi sekadar
  // "tidak error" bukan bukti sukses. Bila PostgREST mengembalikan baris yang
  // terhapus, pastikan minimal 1 baris benar-benar terhapus.
  const { error, count } = await supabase
    .from("trips")
    .delete({ count: "exact" })
    .eq("id", tripId);

  if (error) {
    // Jangan klaim sukses; catat di server dan beri sinyal ke UI.
    console.error("deleteTrip gagal:", error.message);
    redirect("/trips?flash=delete-error");
  }

  // `count` hanya terisi bila header Content-Profile/Prefer dikembalikan;
  // `null` berarti tak tersedia (bukan bukti gagal) → tetap anggap sukses.
  if (count === 0) {
    console.error("deleteTrip: 0 baris terhapus (bukan owner?). tripId:", tripId);
    redirect("/trips?flash=delete-error");
  }

  redirect("/trips");
}

export async function removeMember(formData: FormData): Promise<void> {
  const tripId = String(formData.get("tripId") ?? "");
  const targetUserId = String(formData.get("targetUserId") ?? "");
  if (tripId === "" || targetUserId === "") return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // RLS `trip_members_delete_owner_or_self` yang memutuskan boleh/tidak:
  // owner boleh kick siapa pun, member boleh keluar sendiri. Bila tidak
  // berwenang, delete tidak menghapus baris apa pun (aman).
  await supabase
    .from("trip_members")
    .delete()
    .eq("trip_id", tripId)
    .eq("user_id", targetUserId);

  revalidatePath(`/trips/${tripId}`);
}
