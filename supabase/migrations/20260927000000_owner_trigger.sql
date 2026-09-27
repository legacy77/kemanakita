-- ============================================================
-- KemanaKita — M2 support: owner otomatis + preview undangan
-- Rujukan: docs/PRD.md §4.2–§4.3
-- CARA PAKAI: paste seluruh file ini di Supabase SQL Editor → Run.
-- Idempoten: aman dijalankan ulang.
-- ============================================================
-- Kenapa file ini ada:
-- 1. Policy `trip_members_join_self` (migrasi M1) hanya mengizinkan
--    INSERT dengan `role='member'`, dan tidak ada policy UPDATE di
--    `trip_members`. Akibatnya pembuat trip TIDAK BISA menjadi owner
--    lewat anon key — padahal PRD §4.2 mewajibkan "pembuat = owner".
--    Tanpa service key, satu-satunya jalan yang aman adalah trigger
--    SECURITY DEFINER: atomik, tak bisa di-bypass dari klien.
-- 2. RLS `trips_select_member` menyembunyikan trip dari non-member,
--    sehingga halaman `/join?code=` tidak bisa menampilkan judul trip
--    sebelum gabung. Fungsi `get_trip_by_invite` (SECURITY DEFINER)
--    mengembalikan kolom tampilan saja; kode 12-hex acak, tak tertebak.
-- ============================================================

-- ---------- 1. Pembuat trip otomatis jadi owner ----------
create or replace function public.handle_new_trip()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.trip_members (trip_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict (trip_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_trip_created on public.trips;
create trigger on_trip_created
  after insert on public.trips
  for each row execute function public.handle_new_trip();

-- ---------- 2. Preview undangan via kode ----------
create or replace function public.get_trip_by_invite(p_code text)
returns table (
  id uuid,
  title text,
  destination text,
  start_date date,
  end_date date
)
language sql
security definer
stable
set search_path = public
as $$
  select t.id, t.title, t.destination, t.start_date, t.end_date
  from public.trips t
  where t.invite_code = lower(trim(p_code))
  limit 1;
$$;

-- Pastikan fungsi helper bisa dipanggil anon/authenticated via PostgREST.
-- (Idempoten: GRANT boleh diulang.)
grant execute on function public.get_trip_by_invite(text) to anon, authenticated;
grant execute on function public.is_trip_member(uuid, uuid) to anon, authenticated;
grant execute on function public.is_trip_owner(uuid, uuid) to anon, authenticated;
grant execute on function public.has_other_owner(uuid, uuid) to anon, authenticated;
