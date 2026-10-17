# NEXT_SESSION — handoff 4 Okt 2026

> Baca dulu saat kembali. Status terakhir ter-push ke `origin/main`.
> Sesi 4 Okt: belum ada kode baru; sesi ini menyiapkan todo + checkpoint 60 menit.

## Posisi terkini (terverifikasi 4 Okt 2026)
- HEAD = origin/main = `e170f6b` (handoff 3 Okt) → setelah sesi ini `SESUAI_COMMIT_BARU`.
- Tree bersih. Test: 147 pass, `tsc --noEmit` exit 0, `npm run lint` exit 0.
- Live: 6 tabel + RLS aktif (19 policy) + 5 migrasi ledger. Prod Ready
  (`https://kemanakita-flax.vercel.app`, HTTP 200, land `KemanaKita`).
- Advisor 0028/0029: tinggal `get_trip_by_invite` (publik disengaja).
  `auth_leaked_password_protection` masih OFF (toggle manual di dashboard).
- Data live: 3 user, 3 profil, 1 trip "Malay" (owner Zara,
  `invite_code=d91e73e6c52a`), 1 member, 0 item, 0 expense, 0 split.
  → Skenario E2E bisa jalan dari nol; 2 akun siap: owner + 1 akun lain.
- Harness: **tidak ada** Playwright/Puppeteer/jsdom terpasang; `npx playwright`
  belum terinstall. Uji browser/HP = gate manual.

## Rencana 60 menit (target 70%) — lihat `docs/SPRINT_60M.md`
- Baseline hitung ulang pada detik 0 (jangan asumsikan angka lama).
- Jalur: 45 menit = automated gate (berhenti bila build hijau), 15 menit = manual browser inti.

## Yang masih terbuka (murni gate manual)
1. **E2E 2 akun penuh** (P0-2/P0-3, M2 gate join, M4 gate 3-expense, M6 E2E §10.1).
   Login: email + PIN 6 digit. Owner trip = `nzamirza@gmail.com` (Zara),
   invite `d91e73e6c52a`; akun kedua = `andhikatrickster@gmail.com` /
   `andhikatrickster@outlook.com` (PIN user-admin reset manual bila lupa).
2. **Realtime 2 tab** + **browser M5** (modal Tab/Esc, toast 3 dtk, 360px).
3. **HP asli via preview Vercel** (Android + iPhone) + toggle **Leaked
   Password Protection** (dashboard Supabase → Auth → Password protection).

## Mulai sesi berikutnya
1. `git pull --ff-only; git log --oneline -3`
2. Buka `docs/SPRINT_60M.md`, hitung baseline detik 0, ikuti CP60-0 → CP60-5.
3. Jangan centang gate di `docs/TODO.md` tanpa bukti.

## Opsional (bila berubah pikiran)
- Backup: set `SUPABASE_ACCESS_TOKEN` + `SUPABASE_DB_PASSWORD` di terminal lokal,
  lalu `npx supabase db dump --linked --file backup.sql`. Jangan tempel secret di chat.
