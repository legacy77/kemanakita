-- ============================================================
-- KemanaKita — Skema awal (M1)
-- Rujukan: docs/PRD.md §7.3, §7.4
-- Jalankan di Supabase SQL Editor (atau via `supabase db push`).
-- ============================================================

-- ---------- 1. profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default 'Tanpa nama',
  created_at timestamptz not null default now()
);

-- ---------- 2. trips ----------
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) > 0),
  destination text,
  start_date date not null,
  end_date date not null,
  invite_code text not null unique default encode(gen_random_bytes(6), 'hex'),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists trips_created_by_idx on public.trips (created_by);
create index if not exists trips_invite_code_idx on public.trips (invite_code);

-- ---------- 3. trip_members ----------
-- Enum dibuat idempoten: `create type` polos gagal jika migrasi dijalankan ulang.
do $$ begin
  create type public.trip_role as enum ('owner', 'member');
exception when duplicate_object then null; end $$;

create table if not exists public.trip_members (
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.trip_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create index if not exists trip_members_user_idx on public.trip_members (user_id);

-- ---------- 4. itinerary_items ----------
create table if not exists public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  date date not null,
  time time,
  title text not null check (char_length(trim(title)) > 0),
  notes text,
  location text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists itinerary_items_trip_idx
  on public.itinerary_items (trip_id, date, time, sort_order);

-- ---------- 5. expenses ----------
-- Kategori enum tetap 6 nilai (keputusan PRD §12, ikut design_system §7).
do $$ begin
  create type public.expense_category as enum (
    'makan', 'transport', 'penginapan', 'tiket', 'belanja', 'lain-lain'
  );
exception when duplicate_object then null; end $$;

-- kind: 'expense' = pengeluaran biasa, 'settlement' = catatan "Tandai lunas".
do $$ begin
  create type public.expense_kind as enum ('expense', 'settlement');
exception when duplicate_object then null; end $$;

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  amount numeric(14, 2) not null check (amount > 0),
  paid_by uuid not null references auth.users (id),
  date date not null default current_date,
  category public.expense_category not null default 'lain-lain',
  kind public.expense_kind not null default 'expense',
  created_at timestamptz not null default now()
);

create index if not exists expenses_trip_idx on public.expenses (trip_id, date);
create index if not exists expenses_paid_by_idx on public.expenses (paid_by);

-- ---------- 6. expense_splits ----------
create table if not exists public.expense_splits (
  expense_id uuid not null references public.expenses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  share_amount numeric(14, 2) not null check (share_amount >= 0),
  primary key (expense_id, user_id)
);

create index if not exists expense_splits_user_idx on public.expense_splits (user_id);

-- ============================================================
-- Helper: cek keanggotaan tanpa memicu rekursi RLS.
-- SECURITY DEFINER agar bisa membaca trip_members melewati RLS.
-- ============================================================
create or replace function public.is_trip_member(p_trip_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.trip_members m
    where m.trip_id = p_trip_id and m.user_id = p_user_id
  );
$$;

create or replace function public.is_trip_owner(p_trip_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.trip_members m
    where m.trip_id = p_trip_id
      and m.user_id = p_user_id
      and m.role = 'owner'
  );
$$;

-- Dipakai policy DELETE trip_members. Wajib SECURITY DEFINER: query langsung
-- ke trip_members dari policy trip_members memicu infinite recursion.
create or replace function public.has_other_owner(p_trip_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.trip_members m
    where m.trip_id = p_trip_id
      and m.user_id <> p_user_id
      and m.role = 'owner'
  );
$$;

-- ============================================================
-- Profil otomatis saat user baru mendaftar.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', 'Tanpa nama'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- RLS
-- ============================================================
alter table public.profiles        enable row level security;
alter table public.trips           enable row level security;
alter table public.trip_members    enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.expenses        enable row level security;
alter table public.expense_splits  enable row level security;

-- ---------- profiles ----------
drop policy if exists profiles_select_own_or_comember on public.profiles;
create policy profiles_select_own_or_comember on public.profiles
  for select using (
    id = auth.uid()
    or exists (
      select 1
      from public.trip_members me
      join public.trip_members them on them.trip_id = me.trip_id
      where me.user_id = auth.uid() and them.user_id = public.profiles.id
    )
  );

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ---------- trips ----------
drop policy if exists trips_select_member on public.trips;
create policy trips_select_member on public.trips
  for select using (public.is_trip_member(id, auth.uid()));

drop policy if exists trips_insert_self_owner on public.trips;
create policy trips_insert_self_owner on public.trips
  for insert with check (created_by = auth.uid());

drop policy if exists trips_update_member on public.trips;
create policy trips_update_member on public.trips
  for update using (public.is_trip_member(id, auth.uid()))
  with check (public.is_trip_member(id, auth.uid()));

drop policy if exists trips_delete_owner on public.trips;
create policy trips_delete_owner on public.trips
  for delete using (public.is_trip_owner(id, auth.uid()));

-- ---------- trip_members ----------
-- Anggota boleh melihat daftar anggota trip-nya.
drop policy if exists trip_members_select_comember on public.trip_members;
create policy trip_members_select_comember on public.trip_members
  for select using (public.is_trip_member(trip_id, auth.uid()));

-- Bergabung: user menambahkan dirinya sendiri sebagai member.
-- Kode invite diverifikasi di server action sebelum insert (keputusan: opsi A).
-- `role = 'member'` menutup eskalasi: user tidak bisa mengangkat dirinya jadi owner.
drop policy if exists trip_members_join_self on public.trip_members;
create policy trip_members_join_self on public.trip_members
  for insert with check (user_id = auth.uid() and role = 'member');

-- Hapus: owner mengeluarkan anggota lain, ATAU member keluar sendiri.
-- Owner TIDAK boleh keluar jika dia owner terakhir (cegah trip yatim) — opsi A.
-- Catatan: pembuat trip (owner) wajib di-insert sebagai owner saat trip dibuat
-- (server action, M2); INSERT langsung dari client selalu member.
drop policy if exists trip_members_delete_owner_or_self on public.trip_members;
create policy trip_members_delete_owner_or_self on public.trip_members
  for delete using (
    (user_id = auth.uid() and not public.is_trip_owner(trip_id, auth.uid()))
    or (user_id = auth.uid() and public.has_other_owner(trip_id, auth.uid()))
    or (public.is_trip_owner(trip_id, auth.uid()) and user_id <> auth.uid())
  );

-- ---------- itinerary_items ----------
drop policy if exists itinerary_select_member on public.itinerary_items;
create policy itinerary_select_member on public.itinerary_items
  for select using (public.is_trip_member(trip_id, auth.uid()));

drop policy if exists itinerary_insert_member on public.itinerary_items;
create policy itinerary_insert_member on public.itinerary_items
  for insert with check (public.is_trip_member(trip_id, auth.uid()));

drop policy if exists itinerary_update_member on public.itinerary_items;
create policy itinerary_update_member on public.itinerary_items
  for update using (public.is_trip_member(trip_id, auth.uid()))
  with check (public.is_trip_member(trip_id, auth.uid()));

drop policy if exists itinerary_delete_member on public.itinerary_items;
create policy itinerary_delete_member on public.itinerary_items
  for delete using (public.is_trip_member(trip_id, auth.uid()));

-- ---------- expenses ----------
drop policy if exists expenses_select_member on public.expenses;
create policy expenses_select_member on public.expenses
  for select using (public.is_trip_member(trip_id, auth.uid()));

drop policy if exists expenses_insert_member on public.expenses;
create policy expenses_insert_member on public.expenses
  for insert with check (
    public.is_trip_member(trip_id, auth.uid())
    and public.is_trip_member(trip_id, paid_by)
  );

drop policy if exists expenses_update_member on public.expenses;
create policy expenses_update_member on public.expenses
  for update using (public.is_trip_member(trip_id, auth.uid()))
  with check (public.is_trip_member(trip_id, auth.uid()));

-- Hapus: owner trip ATAU orang yang membayar (PRD §4.5).
drop policy if exists expenses_delete_owner_or_payer on public.expenses;
create policy expenses_delete_owner_or_payer on public.expenses
  for delete using (
    public.is_trip_owner(trip_id, auth.uid()) or paid_by = auth.uid()
  );

-- ---------- expense_splits ----------
drop policy if exists splits_select_member on public.expense_splits;
create policy splits_select_member on public.expense_splits
  for select using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_splits.expense_id
        and public.is_trip_member(e.trip_id, auth.uid())
    )
  );

drop policy if exists splits_insert_member on public.expense_splits;
create policy splits_insert_member on public.expense_splits
  for insert with check (
    exists (
      select 1 from public.expenses e
      where e.id = expense_splits.expense_id
        and public.is_trip_member(e.trip_id, auth.uid())
    )
  );

-- UPDATE wajib ada: tanpa ini, mengubah peserta split gagal RLS padahal
-- tabel induk `expenses` boleh di-update (inkonsistensi).
drop policy if exists splits_update_member on public.expense_splits;
create policy splits_update_member on public.expense_splits
  for update using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_splits.expense_id
        and public.is_trip_member(e.trip_id, auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.expenses e
      where e.id = expense_splits.expense_id
        and public.is_trip_member(e.trip_id, auth.uid())
    )
  );

drop policy if exists splits_delete_member on public.expense_splits;
create policy splits_delete_member on public.expense_splits
  for delete using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_splits.expense_id
        and public.is_trip_member(e.trip_id, auth.uid())
    )
  );

-- ============================================================
-- Realtime untuk edit bareng (PRD §7.1).
-- Idempoten: lewati tabel yang sudah ada di publication.
-- ============================================================
do $$
declare
  t text;
begin
  foreach t in array array['itinerary_items', 'expenses', 'expense_splits'] loop
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
