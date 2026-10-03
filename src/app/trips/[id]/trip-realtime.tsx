"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { debounce } from "@/lib/realtime";

// Berlangganan perubahan tabel trip → refresh server component agar data terbaru tampil.
export default function TripRealtime({ tripId }: { tripId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    // Coalesce burst event jadi 1x refresh.
    const debounced = debounce(() => router.refresh(), 400);
    const on = () => debounced();

    const channel = supabase
      .channel(`trip:${tripId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "itinerary_items", filter: `trip_id=eq.${tripId}` },
        on,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses", filter: `trip_id=eq.${tripId}` },
        on,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trip_members", filter: `trip_id=eq.${tripId}` },
        on,
      )
      // expense_splits tidak punya kolom trip_id jadi tidak bisa filter per-trip;
      // RLS membatasi sesuai hak user, refresh ekstra sesekali di-coalesce debounce — cukup untuk 20 user MVP.
      .on("postgres_changes", { event: "*", schema: "public", table: "expense_splits" }, on)
      .subscribe();

    return () => {
      debounced.cancel();
      supabase.removeChannel(channel);
    };
  }, [tripId, router]);

  return null;
}
