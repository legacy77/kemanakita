"use server";

// Server action undangan: gabung trip via kode.
// Rujukan: PRD §4.3. Aturan RLS: INSERT `trip_members` hanya `role='member'`.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateInviteCode } from "@/lib/validate";

export type JoinState =
  | { status: "idle" }
  | { status: "error"; message: string };

export async function joinTripByCode(
  _prev: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const checked = validateInviteCode(String(formData.get("code") ?? ""));
  if (!checked.ok) return { status: "error", message: checked.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/join?code=${checked.value}`);

  // Cari trip via fungsi aman (RLS menyembunyikan trip dari non-member).
  // Fallback: tebak `invite_code` langsung bila fungsi belum di-run.
  let tripId: string | null = null;
  const { data: rpc } = await supabase.rpc("get_trip_by_invite", {
    p_code: checked.value,
  });
  const preview = Array.isArray(rpc) ? rpc[0] : undefined;
  if (preview) {
    tripId = preview.id;
  } else {
    const { data: trip } = await supabase
      .from("trips")
      .select("id")
      .eq("invite_code", checked.value)
      .maybeSingle();
    tripId = trip?.id ?? null;
  }

  if (!tripId) {
    return { status: "error", message: "Kode nggak ketemu. Minta kode baru ke temanmu ya." };
  }

  const { data: existing } = await supabase
    .from("trip_members")
    .select("trip_id")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) redirect(`/trips/${tripId}`);

  const { error } = await supabase.from("trip_members").insert({
    trip_id: tripId,
    user_id: user.id,
    role: "member",
  });

  if (error) {
    return { status: "error", message: "Gagal gabung. Coba lagi sebentar ya." };
  }
  redirect(`/trips/${tripId}`);
}
