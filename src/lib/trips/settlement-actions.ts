"use server";

// Server action "Tandai lunas" — PRD §4.5, §8 langkah 5. RLS adalah otoritas.
// Service key TIDAK dipakai.
//
// Pemetaan skema (konsisten dengan cara `page.tsx` membaca settlement):
//   Transfer { from, to, amount } → expenses { paid_by: from, kind: 'settlement' }
//   + satu baris expense_splits { user_id: to, share_amount: amount }.
// Title otomatis "Pelunasan", category 'lain-lain' (enum wajib), date = hari ini.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateSettlementInput } from "@/lib/validate";

export type SettlementFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "ok" };

export async function markSettled(
  _prev: SettlementFormState,
  formData: FormData,
): Promise<SettlementFormState> {
  const tripId = String(formData.get("tripId") ?? "");
  if (tripId === "") {
    return { status: "error", message: "Trip nggak dikenali. Muat ulang halamannya ya." };
  }

  const checked = validateSettlementInput({
    from: String(formData.get("from") ?? ""),
    to: String(formData.get("to") ?? ""),
    amount: String(formData.get("amount") ?? ""),
  });
  if (!checked.ok) return { status: "error", message: checked.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "Sesi kamu udah habis. Masuk lagi ya." };
  }

  // Daftar anggota diambil dari DB (bukan dari form) — jangan percaya klien.
  const { data: members, error: membersError } = await supabase
    .from("trip_members")
    .select("user_id")
    .eq("trip_id", tripId);
  if (membersError || !members) {
    return { status: "error", message: "Gagal cek anggota trip. Coba lagi sebentar ya." };
  }
  const memberIds = members.map((m) => m.user_id);
  if (!memberIds.includes(checked.value.from) || !memberIds.includes(checked.value.to)) {
    return { status: "error", message: "Pihak pembayaran harus anggota trip." };
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      trip_id: tripId,
      title: "Pelunasan",
      amount: checked.value.amount,
      paid_by: checked.value.from,
      date: today,
      category: "lain-lain",
      kind: "settlement",
    })
    .select("id")
    .single();

  if (expenseError || !expense) {
    return { status: "error", message: "Gagal catat pelunasan. Coba lagi sebentar ya." };
  }

  const { error: splitsError } = await supabase.from("expense_splits").insert({
    expense_id: expense.id,
    user_id: checked.value.to,
    share_amount: checked.value.amount,
  });

  if (splitsError) {
    // Bersihkan header agar tidak ada settlement yatim tanpa pasangan split.
    await supabase.from("expenses").delete().eq("id", expense.id);
    return { status: "error", message: "Gagal catat rincian pelunasan. Coba lagi ya." };
  }

  revalidatePath(`/trips/${tripId}`);
  return { status: "ok" };
}
