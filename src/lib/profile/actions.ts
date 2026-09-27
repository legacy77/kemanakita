"use server";

// Server action profil: simpan nama tampilan (PRD §4.1 "Profil sederhana:
// nama tampilan"). RLS `profiles_update_own` adalah otoritas — hanya baris
// milik pemanggil yang bisa diubah. Service key TIDAK dipakai.
// Semua input divalidasi server-side via `validateNameInput`.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateNameInput } from "@/lib/validate";

export type UpdateNameState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "ok"; name: string };

export async function updateDisplayName(
  _prev: UpdateNameState,
  formData: FormData,
): Promise<UpdateNameState> {
  const checked = validateNameInput(String(formData.get("name") ?? ""));
  if (!checked.ok) return { status: "error", message: checked.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "Sesi kamu udah habis. Masuk lagi ya." };
  }

  // `.eq("id", user.id)` + RLS `profiles_update_own` → tak bisa mengubah nama
  // orang lain meski id dikirim dari klien.
  const { error } = await supabase
    .from("profiles")
    .update({ name: checked.value })
    .eq("id", user.id);

  if (error) {
    return { status: "error", message: "Gagal simpan nama. Coba lagi sebentar ya." };
  }

  // Nama tampil muncul di /trips (sapaan) dan nama anggota di /trips/[id].
  revalidatePath("/trips");
  revalidatePath("/dashboard");
  return { status: "ok", name: checked.value };
}
