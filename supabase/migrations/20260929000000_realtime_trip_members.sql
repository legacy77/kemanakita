-- ============================================================
-- KemanaKita — Realtime: masukkan trip_members ke publikasi
-- Rujukan: docs/PRD.md §7.1, docs/RESUME_NEXT.md (kajian oracle T1)
-- CARA PAKAI: paste di SQL Editor → Run.
-- Idempoten: aman dijalankan ulang.
-- ============================================================
-- Kenapa file ini ada:
-- `20260926000000_init.sql` sudah memasukkan `itinerary_items`, `expenses`,
-- dan `expense_splits` ke publikasi `supabase_realtime`, tetapi
-- `trip_members` TERLEWAT. Akibatnya perubahan daftar anggota trip
-- (join / keluar / dikeluarkan owner) tidak ter-broadcast realtime.
-- Migrasi ini menambahkan HANYA `public.trip_members` — tanpa tabel,
-- kolom, atau policy baru — memakai pola idempoten yang sama persis
-- dengan init (cek `pg_publication_tables` lebih dulu).
-- ============================================================

do $$
declare
  t text;
begin
  foreach t in array array['trip_members'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
