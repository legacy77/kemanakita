# RESUME_NEXT — handoff 1 Okt 2026 (laptop dimatikan)

## Keputusan user (final)
- Schema tetap independen (tidak meniru Trippy); adopsi hanya pola UX terbukti.
- Tema JRPG, bukan AI-slop.

## Selesai & terverifikasi (di working tree, BELUM commit saat handoff ditulis)
1. Dashboard → link "Bayar di trip →" ke `/trips/[id]?tab=keuangan` + aria-label (`dashboard/page.tsx:253`).
2. PWA wiring: `layout.tsx` viewport + icons + appleWebApp; `src/app/manifest.ts` baru; `public/icons/icon.svg` + `maskable.svg` (dibuat lane desain).
3. Tab login aksesibel: h-12, tabpanel, arrow-key nav, aria-invalid/describedby (`login-form.tsx`).
4. Kartu trip responsif 360px + `title` tooltip (`trips-client.tsx`).
5. FAB "+ Pengeluaran" gold + anchor `#tambah-pengeluaran`, chevron `<details>`, perbaikan kontras header (`trips/[id]/page.tsx`).
6. `display-name-form` h-11 text-16; landing h1 32px (`page.tsx`).
- Verifikasi: `node --test` 127 pass; `tsc --noEmit` EXIT=0 (abaikan error kosmetik wrapper npm.ps1).

## Kajian oracle (strategi, TIDAK ada kode)
- Realtime pola: 1 channel/trip + `router.refresh()` debounce ~400ms, cleanup `removeChannel`; 3 tabel sudah di publikasi, `trip_members` BELUM → butuh migrasi `alter publication supabase_realtime add table public.trip_members;`
- Reset PIN: Opsi 1 (token email via service key) bila ada email provider; fallback Opsi 2 (admin manual, nol kode, target 20 user).

## Tugas berikut (urutan)
- T1 Realtime: migrasi trip_members + komponen `<TripRealtime>` (TDD: test debounce/coalesce dulu) + pasang di `trips/[id]/page.tsx`. Verifikasi: unit test + 2 tab browser manual.
- T2 Reset PIN: PUTUSKAN Opsi 1 vs 2. Opsi 1 butuh provider email + tabel `pin_reset_tokens` + halaman `/reset-pin`.
- T3 Ikon PNG 192/512 (SVG saja kurang untuk install prompt Android) + cek `scripts/check-contrast.mjs` + render 360px + dark mode.
- T4 E2E manual 2 akun: buat trip → invite → join → itinerary → 3 expense → settlement → tandai lunas.
- T5 Commit + push (perintah siap di bawah) lalu deploy Vercel per `C:\Users\Dhika\.opencode\plan\deploy-vercel-checklist.md`.

## Catatan sesi
- Lane des-2 dicancel user sebelum laporan akhir; file ikon sudah ada di disk, anggap selesai kecuali ikon terlihat rusak.
- Lane fixer/oracle sempat gagal "model unavailable" (gpt-6-luna/astra); dispatch ulang pakai `model: "9router/premium-code"`.
- `task_reply` untuk izin des-2 gagal (request kedaluwarsa) — tidak perlu apa-apa.
- Repo: main, HEAD b4a0cd5; perubahan di working tree saja.
