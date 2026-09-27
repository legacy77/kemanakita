-- ============================================================
-- KemanaKita — M3 support: kategori/ikon item itinerary
-- Rujukan: docs/PRD.md §4.4
-- Catatan penerapan: sudah diterapkan ke DB live via Supabase MCP
-- `apply_migration` pada 2026-09-27 (dicatat sebagai versi 20260927140655)
-- dengan isi file ini. Snapshot SQL persis dijalankan:
--   (isi di bawah, idempotent — aman dijalankan ulang)
-- Idempoten: aman dijalankan ulang.
-- ============================================================
-- Kenapa file ini ada:
-- PRD §4.4 mengizinkan itinerary lebih kaya daripada judul+jam+Lokasi.
-- Kolom `category` memberi tiap agenda kategori tetap (6 nilai) supaya UI
-- bisa menampilkan ikon/label dan menyaring agenda tanpa tabel baru.
-- Nilai SENGAJA mirip `expense_category` tapi TIDAK identik: itinerary
-- memakai 'aktivitas' (bukan 'belanja') karena liburan bukan pengeluaran.
-- RLS tidak diubah: policy lama (`itinerary_*_member`) sudah mencakup
-- kolom baru karena berlaku per-baris, bukan per-kolom.
-- ============================================================

-- ---------- 1. Enum kategori itinerary (idempoten) ----------
do $$ begin
  create type public.itinerary_category as enum (
    'makan', 'transport', 'penginapan', 'tiket', 'aktivitas', 'lain-lain'
  );
exception when duplicate_object then null; end $$;

-- ---------- 2. Kolom category pada itinerary_items ----------
-- Default 'lain-lain' supaya baris lama & insert klien lama tetap sah.
alter table public.itinerary_items
  add column if not exists category public.itinerary_category
  not null default 'lain-lain';

comment on column public.itinerary_items.category is
  'Kategori agenda (6 nilai tetap) — dipakai UI untuk ikon/label. Default lain-lain.';
comment on type public.itinerary_category is
  'Kategori item itinerary KemanaKita (PRD §4.4): makan, transport, penginapan, tiket, aktivitas, lain-lain.';

-- ---------- 3. Index opsional ----------
-- Tidak wajib untuk MVP (halaman selalu filter per trip). Disediakan
-- idempoten bila nanti perlu saring per kategori.
create index if not exists itinerary_items_trip_category_idx
  on public.itinerary_items (trip_id, category);
