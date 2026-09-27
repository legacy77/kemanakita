import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatTripDate } from "@/lib/itinerary";
import { TripsPageClient } from "./trips-client";

export const metadata = { title: "Trip saya — KemanaKita" };

// Daftar trip milik user (PRD §4.2). Terproteksi: tanpa sesi → /login.
// Server component agar data diambil dengan sesi user (RLS per member).

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/trips");

  const { data: memberships } = await supabase
    .from("trip_members")
    .select("trip_id, role, trips (id, title, destination, start_date, end_date, invite_code)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  const trips = (memberships ?? []).map((m) => {
    const t = Array.isArray(m.trips) ? m.trips[0] : m.trips;
    return {
      id: m.trip_id,
      title: t?.title ?? "(tanpa judul)",
      destination: t?.destination ?? null,
      startDate: t?.start_date ?? "",
      endDate: t?.end_date ?? "",
      dateLabel:
        t?.start_date && t?.end_date
          ? `${formatTripDate(t.start_date)} – ${formatTripDate(t.end_date)}`
          : "",
      inviteCode: t?.invite_code ?? "",
      role: m.role,
    };
  });

  return (
    <TripsPageClient
      userName={profile?.name ?? ""}
      email={user.email ?? ""}
      trips={trips}
      deleteError={params.flash === "delete-error"}
    />
  );
}
