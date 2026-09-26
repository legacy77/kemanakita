# TODO — KemanaKita MVP

> Spec: `docs/PRD.md` · Visual: `docs/design_system.md` · Plot agen: `docs/AGENT_PLOT.md`
> Bahasa UI: Indonesia santai. Mata uang: IDR saja. Biaya: $0 (Supabase Free + Vercel Hobby).

## M0 — Keputusan & setup

- [x] Jawab PRD §12: guest-mode MVP atau tunda? → **Tunda ke v1.1** (2026-09-26)
- [x] Jawab PRD §12: kategori fixed atau free-form? → **Enum tetap 6** (2026-09-26): `makan`, `transport`, `penginapan`, `tiket`, `belanja`, `lain-lain` — ikut design_system §7 + ikon Lucide
- [x] `git init` + commit awal (2026-09-26)
- [x] Scaffold Next.js App Router + TS + Tailwind + fonts (Gabarito + Plus Jakarta Sans) + `lang="id"` (2026-09-26)
- [x] Token design_system §10 jadi CSS variables + `@theme`; cek kontras tombol `lagoon-700` (2026-09-26: 5.47:1 PASS via `scripts/check-contrast.mjs`)

## M1 — DB & Supabase (PRD §7)

- [ ] Project Supabase Free + env (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` server-only)
- [ ] 6 tabel (§7.3): `profiles`, `trips`, `trip_members`, `itinerary_items`, `expenses`, `expense_splits`
- [ ] RLS: hanya member baca/tulis trip-nya; owner hapus trip / kick (§7.4)
- [ ] Test RLS: member vs non-member
- [ ] Gate: migrasi bersih + RLS test hijau

## M2 — Auth + trip + undangan (PRD §4.1–4.3, §5)

- [ ] `/login` magic link/OTP Supabase; `profiles.name`
- [ ] `/trips`: buat trip (judul, destinasi, start/end), list trip user; pembuat = owner
- [ ] Invite link `/join?code=`: buka → login → auto-join member
- [ ] Owner hapus trip / kick; non-member buka trip → redirect + "Kamu belum jadi anggota trip ini"
- [ ] Kode invite salah → "Kode tidak valid" + tombol minta kode baru
- [ ] Gate: 2 akun uji join via link berhasil

## M3 — Itinerary (PRD §4.4)

- [ ] `/trips/[id]` tab Itinerary: grup per hari dari rentang tanggal, urut `tanggal + jam + sort_order`
- [ ] CRUD item (jam, judul, lokasi, catatan); semua member bisa edit
- [ ] Bottom-sheet form di HP, modal tengah di desktop; validasi inline tanpa reload
- [ ] Realtime Supabase untuk edit bareng
- [ ] Empty state: "Belum ada rencana. Yuk bikin trip pertama kita!"
- [ ] Gate: tambah/ubah/hapus tanpa error, urutan benar

## M4 — Keuangan & split-bill (PRD §4.5, §8)

- [x] Hitung: `share = amount / n`; `saldo = dibayar − bagian`; saran pelunasan minimal (§8 langkah 4) — **2026-09-26** `src/lib/split-bill.ts` (`splitEvenly`, `computeBalances`, `suggestSettlements`, `formatRupiah`)
- [x] Unit test: saldo + settlement minimal + settlement tercatat (PRD §8 wajib) — **21 test hijau** `src/lib/split-bill.test.ts` via `npm test`
- [ ] CRUD expense (butuh Supabase)
- [ ] Hapus hanya owner / yang bayar (butuh Supabase)
- [ ] Tab Keuangan: total bayar vs bagian, saldo/orang, saran "Budi → Andi Rp50.000", tombol "Tandai lunas" (butuh M2/M3)
- [ ] FAB "+ Pengeluaran"; baris lunas → seksi "Sudah diselesaikan" (collapsed)
- [ ] Gate: 3 expense uji → saldo & saran benar, unit test hijau

## M5 — Polish mobile-first (PRD §6, design_system §12)

- [ ] Bottom tabs `Trip | Itinerary | Keuangan | Anggota`; konten max 640px; safe-area inset
- [ ] Skeleton loading, toast 3 dtk, modal konfirmasi hapus (fokus trap, `Esc`)
- [ ] Checklist §12: 360px no scroll-x, tombol ≥44px, `tabular-nums` Rp, ikon+teks status, reduced-motion
- [ ] Uji HP asli via preview Vercel (Android + iPhone)
- [ ] Gate: checklist §12 semua centang

## M6 — Deploy (PRD §11 tahap 6)

- [ ] Env lengkap di Vercel; service key server-only
- [ ] Preview per PR, production per merge `main`
- [ ] E2E manual §10.1: buat → undang 2 akun → itinerary → 3 expense → saran benar → tandai lunas
- [ ] Backup manual SQL dump pertama (Free tanpa auto-backup)
- [ ] Gate: E2E hijau di production
