# TODO — KemanaKita MVP

> Spec: `docs/PRD.md` · Visual: `docs/design_system.md` · Plot agen: `docs/AGENT_PLOT.md`
> Bahasa UI: Indonesia santai. Mata uang: IDR saja. Biaya: $0 (Supabase Free + Vercel Hobby).

## Prioritas — 2026-09-27 (PM)

> State: M0 100%. Logika M3/M4 + validasi M2/M3/M4 selesai + halaman `/dashboard` (agregasi personal) selesai. **104 test hijau, HEAD `30c9f9a`.** Auth produksi: email + PIN 6 digit (kanonik; magic link/OTP legacy deprecated). M1 migrasi ada tapi belum pernah jalan — belum ada project Supabase / `.env.local`. Guest-mode tunda (PRD §4.6).
> Aturan gate: M1 gate gagal → M2–M6 yang butuh DB parkir. Yang UNBLOCKED boleh maju paralel selama beda file.

### Arti label

- **BLOCKED** = butuh project Supabase + `.env.local` + migrasi jalan. Tanpa ini nggak bisa mulai.
- **UNBLOCKED** = bisa jalan hari ini tanpa Supabase (mock / data dummy / halaman yang sudah ada).

### P0 — Blocker (buka gembok dulu)

| # | Item TODO | Status | Alasan |
|---|-----------|--------|--------|
| P0-1 | M1: project Supabase Free + env + 6 tabel + RLS + migrasi jalan | BLOCKED — aksi user | Root blocker: semua M2–M6 nunggu ini |
| P0-2 | M1: test RLS member vs non-member + gate migrasi bersih | BLOCKED (nunggu P0-1) | Gate M1; keamanan PRD §7.4, syarat lanjut |
| P0-3 | M2: `/login` + `/trips` + invite `/join?code=` + gate 2 akun join | BLOCKED (nunggu M1 gate) | Happy path PRD §5.1 langkah 1–4; unlock M3/M4 |

### P1 — Nilai inti (setelah gembok buka)

| # | Item TODO | Status | Alasan |
|---|-----------|--------|--------|
| P1-1 | M3: tab Itinerary + CRUD + validasi inline + empty state | BLOCKED (nunggu P0-3) | Goal PRD §1.2 #1; dependensi: halaman trip M2 |
| P1-2 | M4: CRUD expense + aturan hapus + tab Keuangan + "Tandai lunas" + FAB | BLOCKED (nunggu P0-3) | Goal PRD §1.2 #2; core value app |
| P1-3 | M2 error states: kode salah + non-member redirect | BLOCKED (nunggu P0-3) | PRD §5.2; kecil, kerjakan bareng P0-3 |
| P1-4 | M3: realtime edit bareng | BLOCKED (nunggu P1-1) | Kolaborasi PRD §4.3; stabilkan CRUD dulu |

### P2 — Polish & rilis (terakhir)

| # | Item TODO | Status | Alasan |
|---|-----------|--------|--------|
| P2-1 | M5: primitives (skeleton, toast 3 dtk, modal konfirmasi) + bottom tabs + layout 640px | UNBLOCKED (mock/dummy; integrasi akhir BLOCKED) | Bisa maju tanpa DB; jangan buka tab baru sebelum M2–M4 |
| P2-2 | M5: checklist §12 + uji HP asli via preview Vercel | BLOCKED (nunggu P1-1/P1-2 + deploy) | Gate polish; butuh app hidup + data |
| P2-3 | M6: env Vercel + preview/prod + E2E §10.1 + backup dump + gate prod | BLOCKED (nunggu semua) | Paling akhir; E2E butuh alur penuh hidup |

### 3 langkah berikutnya (paling bernilai)

1. **User: bikin project Supabase Free + isi `.env.local` + run migrasi** (`supabase/migrations/20260926000000_init.sql` via SQL Editor). Tanpa ini semua implementer DB parkir. (P0-1)
2. **Dispatch tester → developer: test RLS member vs non-member (gate M1), lalu auth + trips + invite** sampai 2 akun join via link. (P0-2 → P0-3)
3. **Sambil nunggu user (paralel, file beda): frontend bikin primitives M5** (skeleton/toast/modal) + audit §12 ke halaman yang sudah ada. Jangan sentuh CRUD Supabase sebelum M1 gate. (P2-1, UNBLOCKED)

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

- [ ] `/login` email + PIN 6 digit; `profiles.name`
- [ ] `/trips`: buat trip (judul, destinasi, start/end), list trip user; pembuat = owner
- [ ] Invite link `/join?code=`: buka → login → auto-join member
- [ ] Owner hapus trip / kick; non-member buka trip → redirect + "Kamu belum jadi anggota trip ini"
- [ ] Kode invite salah → "Kode tidak valid" + tombol minta kode baru
- [x] Validasi form trip (judul wajib, tanggal selesai ≥ mulai) — **2026-09-27** `src/lib/validate.ts` (`validateTripInput`); **7 test hijau**, + format kode invite (12 hex, `validateInviteCode`) — **2 test**
- [ ] Gate: 2 akun uji join via link berhasil

## M3 — Itinerary (PRD §4.4)

- [x] Grup per hari dari rentang tanggal, urut `tanggal + jam + sort_order` — **2026-09-26** `src/lib/itinerary.ts` (`eachDayInRange`, `groupItineraryByDay`, `formatTripDate`, `formatDayLabel`); **16 test hijau** `src/lib/itinerary.test.ts`
- [ ] Tab Itinerary UI di `/trips/[id]` (butuh M2)
- [ ] CRUD item (jam, judul, lokasi, catatan); semua member bisa edit (butuh Supabase)
- [ ] Bottom-sheet form di HP, modal tengah di desktop; validasi inline tanpa reload
- [x] Validasi input itinerary (judul wajib, tanggal kalender sah, jam format HH:MM) — **2026-09-27** `src/lib/validate.ts` (`validateItineraryInput`); **7 test hijau**
- [ ] Realtime Supabase untuk edit bareng
- [ ] Empty state: "Belum ada rencana. Yuk bikin trip pertama kita!"
- [ ] Gate: tambah/ubah/hapus tanpa error, urutan benar

## M4 — Keuangan & split-bill (PRD §4.5, §8)

- [x] Hitung: `share = amount / n`; `saldo = dibayar − bagian`; saran pelunasan minimal (§8 langkah 4) — **2026-09-26** `src/lib/split-bill.ts` (`splitEvenly`, `computeBalances`, `suggestSettlements`, `formatRupiah`)
- [x] Unit test: saldo + settlement minimal + settlement tercatat (PRD §8 wajib) — **21 test hijau** `src/lib/split-bill.test.ts` via `npm test`
- [x] Validasi input expense (nominal > 0, `paid_by` member, min 1 peserta split, kategori valid) + parse/format nominal rupiah (design_system §8.2) + metadata 6 kategori + ikon (design_system §7) — **2026-09-27** `src/lib/validate.ts` (`validateExpenseInput`, `parseRupiahInput`, `formatRupiahInput`, `isValidDate`, `EXPENSE_CATEGORIES`, `getExpenseCategory`); **23 test hijau** (expense 10 + kategori 3 + parse/format 8 + tanggal 2) di `src/lib/validate.test.ts` (39 test file ini; total 104 test lolos `npm test`)
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
