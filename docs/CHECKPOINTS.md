# CHECKPOINTS — Sisa Task RESUME_NEXT (handoff 1 Okt 2026)

> Review dulu tiap checkpoint. Eksekusi hanya setelah user setuju checkpoint tsb.
> Keputusan user 3 Okt 2026: T2 = Opsi 2 admin manual. `docs/admin-reset-pin.md` sudah ada.
> Baseline CP0: `npm test` 127 pass, `tsc --noEmit` exit 0, `npm run lint` exit 0,
> `node scripts/check-contrast.mjs` exit 0. `npm run build` sedang berjalan.

## CP0 — Kunci baseline working tree [SELESAI VERIFIKASI, BELUM COMMIT]
- Diff: 7 file `src/app` (dashboard link bayar-di-trip + aria-label; layout PWA
  viewport+icons+appleWebApp; login tab h-12/tabpanel/arrow-key/aria-invalid;
  trips-client responsif 360px + title tooltip; trip [id] FAB gold + anchor
  #tambah-pengeluaran + details chevron + kontras header; display-name h-11
  text-16; landing h1 32px) + untracked `docs/RESUME_NEXT.md`,
  `public/icons/` (2 SVG), `src/app/manifest.ts`.
- Verifikasi: test 127 pass; tsc exit 0; lint exit 0; check-contrast exit 0;
  build menyusul.
- Aksi user: review diff di atas → setuju commit? Perintah:
  `git add -A && git commit -m "..." && git push`.
- Gate: build exit 0.

## CP1 — Realtime trip (T1) [MIGRASI LIVE SELESAI, MENUNGGU UJI MANUAL 2 TAB]
- Migrasi: `supabase/migrations/20261003074910_realtime_trip_members.sql` —
  DO block idempoten, tambah HANYA `public.trip_members` ke `supabase_realtime`.
  SUDAH dijalankan di DB live 2026-10-03 (via tool migrasi, tercatat di ledger
  sebagai `20261003074910_realtime_trip_members`); verifikasi via
  `pg_publication_tables`: publikasi kini berisi `expense_splits`, `expenses`,
  `itinerary_items`, `trip_members`. Nama file lokal diselaraskan dari
  `20260929000000_*` agar sama dengan versi ledger.
- Kode:
  - `src/lib/realtime.ts` — helper `debounce(fn, delayMs)` + `.cancel()`.
  - `src/lib/realtime.test.ts` — 3 test (coalesce jadi 1, terpisah jadi 2, cancel).
  - `src/app/trips/[id]/trip-realtime.tsx` — client, 1 channel `trip:${tripId}`,
    subscribe `itinerary_items`/`expenses`/`trip_members` (filter per-trip) +
    `expense_splits` (tanpa filter; tabel tak punya `trip_id`), `router.refresh()`
    debounce 400ms, cleanup `cancel()` + `removeChannel`.
  - `src/app/trips/[id]/page.tsx` — render `<TripRealtime tripId={tripId} />`.
- Verifikasi: test 130 pass (127 + 3 baru); tsc exit 0; lint/build menyusul.
- Aksi user: (a) jalankan migrasi di Supabase SQL Editor; (b) manual 2 tab browser:
  edit agenda di tab A → tab B auto-refresh.
- Review: file komponen + test di atas.

## CP2 — Reset PIN admin manual (T2, Opsi 2 — KEPUTUSAN FINAL) [SELESAI]
- Status: SELESAI. `docs/admin-reset-pin.md` ada (langkah dashboard Auth → Users
  → update password 6 digit, kirim via WhatsApp). `login-form.tsx:152` sudah
  copy "Hubungi admin lewat grup trip buat minta reset PIN".
- Tidak ada kode. Tidak ada tabel `pin_reset_tokens`, tidak ada `/reset-pin`,
  tidak butuh SERVICE_KEY / email provider.

## CP3 — Ikon PNG + polish render (T3) [KODE SELESAI, MENUNGGU REVIEW]
- Baru: `public/icons/icon-192.png` (192x192, 5058 B), `icon-512.png`
  (512x512, 16832 B), `maskable-512.png` (512x512, 21757 B) — diraster dari
  SVG via `sharp` (density 384); script temporer sudah dihapus.
- `src/app/manifest.ts` — tambah 3 entri PNG (SVG dipertahankan).
- Verifikasi: tsc exit 0; ikon dirender & diperiksa visual (tidak rusak).
- Sisa: render 360px + dark mode (bagian CP4 manual).
- Review: PNG di atas + diff manifest.


## CP5 — M5 primitives: skeleton, toast 3 dtk, modal konfirmasi (#8) [SELESAI, TER-PUSH]
- Logika murni + test: `src/lib/toast.ts` (add/cap 3/remove/prune TTL 3000ms),
  `src/lib/focus-trap.ts` (trapTabIndex, keyToFocusIndex) — 7+7 test baru.
- Komponen: `src/components/toast.tsx` (ToastProvider/useToast/ToastViewport,
  auto-dismiss 3 dtk), `src/components/confirm-dialog.tsx` (role=alertdialog,
  fokus trap, Esc, fokus kembali ke pemicu, scroll lock), `src/components/skeleton.tsx`.
- Skeleton `loading.tsx` untuk `/dashboard`, `/trips`, `/trips/[id]`.
- Integrasi hapus: trip (`delete-trip-button.tsx`), agenda + pengeluaran
  (`delete-buttons.tsx`) pakai ConfirmDialog. `deleteExpense` kini mengembalikan
  state + cek `count === 0` agar RLS no-op tidak diklaim sukses.
- Toast hasil aksi: form tambah/ubah agenda + pengeluaran, pelunasan,
  nama tampilan (`display-name-form.tsx`).
- Verifikasi: test 147 pass; tsc exit 0; lint exit 0 (0 warning); kontras exit 0;
  build exit 0. Commit `10c13f3` (`0b4dc53..10c13f3` di origin/main).
- Sisa: uji interaksi browser manual (buka modal, Tab/Esc, toast 3 dtk) — bagian CP4.

## CP5b — Hardening SECURITY DEFINER (advisor Supabase 0028/0029) [LIVE, TER-VERIFIKASI]
- Migrasi: `supabase/migrations/20261003081856_harden_security_definer.sql` —
  helper RLS (`is_trip_member`/`is_trip_owner`/`has_other_owner`) pindah ke schema
  `private` (tak diekspos PostgREST) + EXECUTE fungsi trigger
  (`handle_new_trip`/`handle_new_user`) dicabut. `get_trip_by_invite` tetap
  publik disengaja (dipakai `rpc()` halaman /join sebelum login).
  SUDAH dijalankan di DB live 2026-10-03 (tercatat di ledger).
- Fakta yang diuji sebelum eksekusi (schema scratch, sudah di-drop):
  revoke EXECUTE fungsi trigger aman (trigger tetap menyala); revoke helper RLS
  memutus RLS (`permission denied`) — makanya dipindah schema, bukan dicabut.
- Verifikasi live: advisor 0028/0029 tinggal 1 temuan tiap lint
  (hanya `get_trip_by_invite`, disengaja); owner lihat 1 trip; anon 0 trip;
  RPC preview undangan jalan. `database.types.ts` diselaraskan
  (3 helper privat dihapus dari tipe).
- Sisa: `auth_leaked_password_protection` (toggle dashboard Auth, aksi manual user).

## CP4 — E2E manual + commit/push + deploy (T4+T5)
- E2E 2 akun: buat trip → invite → join → itinerary → 3 expense → settlement
  → tandai lunas. Checklist deploy:
  `C:\Users\Dhika\.opencode\plan\deploy-vercel-checklist.md`
  (env Vercel, magic link legacy — catat: auth kini PIN, checklist §4/§6
  menyebut magic link yang sudah deprecated, sesuaikan saat eksekusi).
- Lalu commit + push + deploy Vercel.
- Verifikasi: semua langkah E2E centang; app production render.
- Review: laporan E2E per langkah + URL production.

## Urutan eksekusi
CP0 (commit baseline) → CP1 → CP2 (anggap selesai, tinggal baca) → CP3 → CP4.
CP1 dan CP3 bisa paralel (beda file). CP4 terakhir.
