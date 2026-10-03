# NEXT_SESSION — handoff 3 Okt 2026 (user off)

> Baca ini dulu saat kembali. Status terakhir sudah ter-push ke `origin/main`.

## Posisi terakhir
- HEAD = origin/main = `b25088e` "docs: selaraskan TODO dengan kondisi live (M1/M6 terverifikasi)".
- Sebelumnya: `bfa363f` hardening SECURITY DEFINER (live), `230f21a` cleanup repo.
- Tree bersih. Test: 147 pass, `tsc --noEmit` exit 0, `npm run lint` exit 0.
- Live terverifikasi: 6 tabel + RLS aktif (19 policy) + 5 migrasi di ledger;
  simulasi peran hijau (owner lihat 1 trip, anon 0); prod Vercel Ready
  (`https://kemanakita-flax.vercel.app`); advisor 0028/0029 tinggal
  `get_trip_by_invite` (publik disengaja untuk preview /join).
- Keputusan user: backup SQL **DILEWATI** (kredensial tidak pernah sampai ke agen).

## Yang masih terbuka (murni gate manual, tidak ada kode menggantung)
1. **Uji 2 akun penuh** (menutup P0-2/P0-3 + gate E2E M4/M6 sekaligus):
   buat trip → invite → join → itinerary → 3 expense → saran benar → tandai lunas.
2. **Uji 2 tab realtime** (migrasi sudah live) + uji browser M5
   (modal Tab/Esc, toast 3 dtk) + render 360px.
3. **Uji HP asli via preview Vercel** (Android + iPhone) + toggle manual
   **Leaked Password Protection** (dashboard Supabase → Auth → Password protection).

## Mulai sesi berikutnya dengan
1. `git pull --ff-only; git log --oneline -3` (pastikan di `b25088e`).
2. Kerjakan nomor 1 di atas; catat hasil per langkah di `docs/CHECKPOINTS.md` CP4.
3. Jangan centang gate di `docs/TODO.md` tanpa bukti; bedakan "kode selesai" vs "gate manual".

## Opsional (bila berubah pikiran)
- Backup: set `SUPABASE_ACCESS_TOKEN` + `SUPABASE_DB_PASSWORD` di terminal lokal,
  lalu `npx supabase db dump --linked --file backup.sql`. Jangan tempel secret di chat.
