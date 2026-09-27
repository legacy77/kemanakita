"use server";

// Server action pengeluaran — PRD §4.5, §8. RLS adalah otoritas.
// Pembagian pakai `splitEvenly` (largest remainder) agar
// jumlah(share) === amount, jadi saldo bisa benar-benar nol.
// Service key TIDAK dipakai.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateExpenseInput } from "@/lib/validate";
import { buildSplitRows } from "@/lib/split-bill";

export type ExpenseFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "ok" };

export async function addExpense(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const tripId = String(formData.get("tripId") ?? "");
  if (tripId === "") {
    return { status: "error", message: "Trip nggak dikenali. Muat ulang halamannya ya." };
  }

  // Peserta split dikirim sebagai beberapa field bernama `participants`.
  const participantIds = formData
    .getAll("participants")
    .map((value) => String(value))
    .filter((value) => value !== "");

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

  const checked = validateExpenseInput(
    {
      title: String(formData.get("title") ?? ""),
      amount: String(formData.get("amount") ?? ""),
      paidBy: String(formData.get("paidBy") ?? ""),
      date: String(formData.get("date") ?? ""),
      category: String(formData.get("category") ?? "") as never,
      participantIds,
    },
    memberIds,
  );
  if (!checked.ok) return { status: "error", message: checked.error };

  // Pre-generate id: jangan `.insert().select().single()`. `expenses` bisa
  // dibaca member, tapi INSERT ... RETURNING bisa tampak gagal bila ada
  // interaksi RLS/trigger; id eksplisit membuat operasi deterministik dan
  // rollback tetap mengacu id yang sama.
  const expenseId = crypto.randomUUID();
  const { error: expenseError } = await supabase.from("expenses").insert({
    id: expenseId,
    trip_id: tripId,
    title: checked.value.title,
    amount: checked.value.amount,
    paid_by: checked.value.paidBy,
    date: checked.value.date,
    category: checked.value.category,
    kind: "expense",
  });

  if (expenseError) {
    return { status: "error", message: "Gagal simpan pengeluaran. Coba lagi sebentar ya." };
  }

  const { error: splitsError } = await supabase
    .from("expense_splits")
    .insert(buildSplitRows(expenseId, checked.value.amount, checked.value.participantIds));

  if (splitsError) {
    // Bersihkan header agar tidak ada pengeluaran tanpa rincian bagi hasil.
    await supabase.from("expenses").delete().eq("id", expenseId);
    return { status: "error", message: "Gagal simpan rincian bagi hasil. Coba lagi ya." };
  }

  revalidatePath(`/trips/${tripId}`);
  return { status: "ok" };
}

export async function updateExpense(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const tripId = String(formData.get("tripId") ?? "");
  const expenseId = String(formData.get("expenseId") ?? "");
  if (tripId === "" || expenseId === "") {
    return { status: "error", message: "Pengeluaran nggak dikenali. Muat ulang halamannya ya." };
  }

  const participantIds = formData
    .getAll("participants")
    .map((value) => String(value))
    .filter((value) => value !== "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "Sesi kamu udah habis. Masuk lagi ya." };
  }

  // Daftar anggota diambil dari DB (bukan dari form).
  const { data: members, error: membersError } = await supabase
    .from("trip_members")
    .select("user_id")
    .eq("trip_id", tripId);
  if (membersError || !members) {
    return { status: "error", message: "Gagal cek anggota trip. Coba lagi sebentar ya." };
  }
  const memberIds = members.map((m) => m.user_id);

  const checked = validateExpenseInput(
    {
      title: String(formData.get("title") ?? ""),
      amount: String(formData.get("amount") ?? ""),
      paidBy: String(formData.get("paidBy") ?? ""),
      date: String(formData.get("date") ?? ""),
      category: String(formData.get("category") ?? "") as never,
      participantIds,
    },
    memberIds,
  );
  if (!checked.ok) return { status: "error", message: checked.error };

  // Fetch old splits untuk rollback bila perlu.
  const { data: oldSplits, error: fetchError } = await supabase
    .from("expense_splits")
    .select("user_id, share_amount")
    .eq("expense_id", expenseId);
  if (fetchError) {
    return { status: "error", message: "Gagal baca rincian lama. Coba lagi ya." };
  }

  // Sequential manual transaction:
  // 1. delete old splits
  const { error: deleteSplitsError } = await supabase
    .from("expense_splits")
    .delete()
    .eq("expense_id", expenseId);
  if (deleteSplitsError) {
    return { status: "error", message: "Gagal ubah pengeluaran. Coba lagi ya." };
  }

  // 2. update expense header
  const { error: updateError } = await supabase
    .from("expenses")
    .update({
      title: checked.value.title,
      amount: checked.value.amount,
      paid_by: checked.value.paidBy,
      date: checked.value.date,
      category: checked.value.category,
    })
    .eq("id", expenseId)
    .eq("trip_id", tripId);

  if (updateError) {
    // rollback: re-insert old splits
    if (oldSplits && oldSplits.length > 0) {
      await supabase.from("expense_splits").insert(
        oldSplits.map((s) => ({
          expense_id: expenseId,
          user_id: s.user_id,
          share_amount: s.share_amount,
        })),
      );
    }
    return { status: "error", message: "Gagal ubah pengeluaran. Coba lagi ya." };
  }

  // 3. insert new splits
  const { error: splitsError } = await supabase
    .from("expense_splits")
    .insert(buildSplitRows(expenseId, checked.value.amount, checked.value.participantIds));

  if (splitsError) {
    // rollback: delete header + restore old splits
    await supabase.from("expenses").delete().eq("id", expenseId);
    if (oldSplits && oldSplits.length > 0) {
      await supabase.from("expense_splits").insert(
        oldSplits.map((s) => ({
          expense_id: expenseId,
          user_id: s.user_id,
          share_amount: s.share_amount,
        })),
      );
    }
    return { status: "error", message: "Gagal simpan rincian bagi hasil. Coba lagi ya." };
  }

  revalidatePath(`/trips/${tripId}`);
  return { status: "ok" };
}

export async function deleteExpense(formData: FormData): Promise<void> {
  const tripId = String(formData.get("tripId") ?? "");
  const expenseId = String(formData.get("expenseId") ?? "");
  if (tripId === "" || expenseId === "") return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // RLS `expenses_delete_owner_or_payer`: owner trip atau yang membayar.
  await supabase.from("expenses").delete().eq("id", expenseId).eq("trip_id", tripId);
  revalidatePath(`/trips/${tripId}`);
}