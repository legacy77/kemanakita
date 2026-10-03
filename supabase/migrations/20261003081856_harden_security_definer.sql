-- ============================================================
-- KemanaKita — Hardening SECURITY DEFINER (advisor Supabase 0028/0029)
-- Rujukan: docs/TODO.md (tindak lanjut peringatan keamanan)
-- CARA PAKAI: paste seluruh file ini di Supabase SQL Editor → Run.
-- Idempoten: aman dijalankan ulang.
-- ============================================================
-- Masalah (advisor "Public Can Execute SECURITY DEFINER Function"):
-- Semua fungsi `SECURITY DEFINER` di schema `public` otomatis bisa
-- dipanggil `anon`/`authenticated` lewat PostgREST (`/rest/v1/rpc/...`),
-- karena Postgres memberi EXECUTE ke PUBLIC secara default.
--
-- Fakta yang sudah diuji di DB live (schema scratch, lalu di-drop):
-- 1. Fungsi trigger TETAP menyala walau EXECUTE-nya dicabut
--    (hak EXECUTE tidak dicek saat trigger berjalan).
-- 2. Fungsi helper yang dipanggil policy RLS WAJIB punya EXECUTE untuk
--    role penanya — mencabutnya membuat query gagal
--    ("permission denied for function ...") dan RLS mati.
-- 3. Fungsi di schema yang TIDAK diekspos PostgREST tidak ditandai
--    advisor, dan tetap bisa dipakai policy RLS.
--
-- Solusi:
-- - 3 helper RLS dipindah ke schema `private` (tidak diekspos) + EXECUTE
--   tetap diberikan ke anon/authenticated agar policy tetap dievaluasi.
-- - 2 fungsi trigger dicabut EXECUTE-nya (tidak dipakai sebagai RPC).
-- - `get_trip_by_invite` TETAP publik: dipanggil `rpc()` dari klien
--   (halaman /join sebelum login). Ini disengaja — kode invite 12-hex
--   acak adalah rahasianya. Diterima sebagai risiko yang terdokumentasi.
-- ============================================================

-- ---------- 1. Schema privat (tidak diekspos PostgREST) ----------
create schema if not exists private;

-- ---------- 2. Pindahkan helper RLS ke schema `private` ----------
-- search_path = '' + nama tabel fully-qualified: aman dari hijack search_path.
create or replace function private.is_trip_member(p_trip_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.trip_members m
    where m.trip_id = p_trip_id and m.user_id = p_user_id
  );
$$;

create or replace function private.is_trip_owner(p_trip_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.trip_members m
    where m.trip_id = p_trip_id
      and m.user_id = p_user_id
      and m.role = 'owner'
  );
$$;

create or replace function private.has_other_owner(p_trip_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.trip_members m
    where m.trip_id = p_trip_id
      and m.user_id <> p_user_id
      and m.role = 'owner'
  );
$$;

-- Policy RLS dievaluasi sebagai role penanya, jadi role itu butuh USAGE
-- pada schema + EXECUTE pada fungsi. Schema `private` tidak diekspos
-- PostgREST, sehingga fungsi tidak bisa dijangkau via /rest/v1/rpc.
grant usage on schema private to anon, authenticated;
grant execute on function private.is_trip_member(uuid, uuid) to anon, authenticated;
grant execute on function private.is_trip_owner(uuid, uuid) to anon, authenticated;
grant execute on function private.has_other_owner(uuid, uuid) to anon, authenticated;

-- ---------- 3. Arahkan ulang semua policy ke helper privat ----------
-- (profiles_select_own_or_comember tidak memakai helper — tidak diubah.)

-- trips
drop policy if exists trips_select_member on public.trips;
create policy trips_select_member on public.trips
  for select using (private.is_trip_member(id, auth.uid()));

drop policy if exists trips_update_member on public.trips;
create policy trips_update_member on public.trips
  for update using (private.is_trip_member(id, auth.uid()))
  with check (private.is_trip_member(id, auth.uid()));

drop policy if exists trips_delete_owner on public.trips;
create policy trips_delete_owner on public.trips
  for delete using (private.is_trip_owner(id, auth.uid()));

-- trip_members
drop policy if exists trip_members_select_comember on public.trip_members;
create policy trip_members_select_comember on public.trip_members
  for select using (private.is_trip_member(trip_id, auth.uid()));

drop policy if exists trip_members_delete_owner_or_self on public.trip_members;
create policy trip_members_delete_owner_or_self on public.trip_members
  for delete using (
    (user_id = auth.uid() and not private.is_trip_owner(trip_id, auth.uid()))
    or (user_id = auth.uid() and private.has_other_owner(trip_id, auth.uid()))
    or (private.is_trip_owner(trip_id, auth.uid()) and user_id <> auth.uid())
  );

-- itinerary_items
drop policy if exists itinerary_select_member on public.itinerary_items;
create policy itinerary_select_member on public.itinerary_items
  for select using (private.is_trip_member(trip_id, auth.uid()));

drop policy if exists itinerary_insert_member on public.itinerary_items;
create policy itinerary_insert_member on public.itinerary_items
  for insert with check (private.is_trip_member(trip_id, auth.uid()));

drop policy if exists itinerary_update_member on public.itinerary_items;
create policy itinerary_update_member on public.itinerary_items
  for update using (private.is_trip_member(trip_id, auth.uid()))
  with check (private.is_trip_member(trip_id, auth.uid()));

drop policy if exists itinerary_delete_member on public.itinerary_items;
create policy itinerary_delete_member on public.itinerary_items
  for delete using (private.is_trip_member(trip_id, auth.uid()));

-- expenses
drop policy if exists expenses_select_member on public.expenses;
create policy expenses_select_member on public.expenses
  for select using (private.is_trip_member(trip_id, auth.uid()));

drop policy if exists expenses_insert_member on public.expenses;
create policy expenses_insert_member on public.expenses
  for insert with check (
    private.is_trip_member(trip_id, auth.uid())
    and private.is_trip_member(trip_id, paid_by)
  );

drop policy if exists expenses_update_member on public.expenses;
create policy expenses_update_member on public.expenses
  for update using (private.is_trip_member(trip_id, auth.uid()))
  with check (private.is_trip_member(trip_id, auth.uid()));

drop policy if exists expenses_delete_owner_or_payer on public.expenses;
create policy expenses_delete_owner_or_payer on public.expenses
  for delete using (
    private.is_trip_owner(trip_id, auth.uid()) or paid_by = auth.uid()
  );

-- expense_splits
drop policy if exists splits_select_member on public.expense_splits;
create policy splits_select_member on public.expense_splits
  for select using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_splits.expense_id
        and private.is_trip_member(e.trip_id, auth.uid())
    )
  );

drop policy if exists splits_insert_member on public.expense_splits;
create policy splits_insert_member on public.expense_splits
  for insert with check (
    exists (
      select 1 from public.expenses e
      where e.id = expense_splits.expense_id
        and private.is_trip_member(e.trip_id, auth.uid())
    )
  );

drop policy if exists splits_update_member on public.expense_splits;
create policy splits_update_member on public.expense_splits
  for update using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_splits.expense_id
        and private.is_trip_member(e.trip_id, auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.expenses e
      where e.id = expense_splits.expense_id
        and private.is_trip_member(e.trip_id, auth.uid())
    )
  );

drop policy if exists splits_delete_member on public.expense_splits;
create policy splits_delete_member on public.expense_splits
  for delete using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_splits.expense_id
        and private.is_trip_member(e.trip_id, auth.uid())
    )
  );

-- ---------- 4. Hapus helper lama di schema public ----------
-- Semua policy sudah diarahkan ke `private`, jadi tidak ada dependensi lagi.
drop function if exists public.is_trip_member(uuid, uuid);
drop function if exists public.is_trip_owner(uuid, uuid);
drop function if exists public.has_other_owner(uuid, uuid);

-- ---------- 5. Cabut EXECUTE fungsi trigger ----------
-- Fungsi trigger tidak perlu EXECUTE (terbukti tetap menyala), dan tidak
-- boleh bisa dipanggil sebagai RPC.
revoke execute on function public.handle_new_trip() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------- 6. get_trip_by_invite tetap publik (disengaja) ----------
-- Tidak ada perubahan; dipanggil `rpc()` dari klien untuk preview undangan.
-- Advisor 0028/0029 akan tetap menandainya — ini diterima & terdokumentasi.
