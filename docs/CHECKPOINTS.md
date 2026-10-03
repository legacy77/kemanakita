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

## CP1 — Realtime trip (T1)
- Migrasi: `alter publication supabase_realtime add table public.trip_members;`
  (idempoten, pola DO block seperti migrasi awal). Jalankan via SQL Editor.
- Kode: komponen `<TripRealtime tripId>` client — 1 channel per trip
  (`trip:${tripId}`), subscribe postgres_changes ke `itinerary_items`,
  `expenses`, `expense_splits`, `trip_members` (filter `trip_id=eq.${tripId}`),
  `router.refresh()` debounce ~400ms, cleanup `removeChannel`.
  TDD: test debounce/coalesce dulu.
- Pasang di `src/app/trips/[id]/page.tsx` (server component → render
  `<TripRealtime>` client di dalam).
- Scope: tidak ubah RLS, tidak ubah skema selain publikasi.
- Verifikasi: unit test debounce; manual 2 tab browser (edit tab A → tab B refresh).
- Review: tunjukkan file komponen + test + screenshot/gif 2 tab.

## CP2 — Reset PIN admin manual (T2, Opsi 2 — KEPUTUSAN FINAL)
- Status: SELESAI. `docs/admin-reset-pin.md` ada (langkah dashboard Auth → Users
  → update password 6 digit, kirim via WhatsApp). `login-form.tsx:152` sudah
  copy "Hubungi admin lewat grup trip buat minta reset PIN".
- Tidak ada kode. Tidak ada tabel `pin_reset_tokens`, tidak ada `/reset-pin`,
  tidak butuh SERVICE_KEY / email provider.
- Verifikasi: baca ulang doc 1 menit.

## CP3 — Ikon PNG + polish render (T3)
- Buat `public/icons/icon-192.png` + `icon-512.png` (SVG saja kurang untuk
  install prompt Android), daftarkan di `src/app/manifest.ts`.
- Tool: tidak ada ImageMagick/Inkscape di mesin ini; `sharp` tersedia sebagai
  transitive dep (bukan direct). Opsi: script node sekali-pakai pakai `sharp`
  dari node_modules, atau generate via browser/canvas sekali lalu commit PNG.
- Lalu: `node scripts/check-contrast.mjs`, render 360px, dark mode.
- Verifikasi: manifest serve PNG; lighthouse/PWA installability; screenshot 360px.
- Review: tunjukkan PNG + manifest diff + screenshot.

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
