# TODO — KemanaKita MVP

> Spec: `docs/PRD.md` · Visual: `docs/design_system.md` · Plot agen: `docs/AGENT_PLOT.md`
> Bahasa UI: Indonesia santai. Mata uang: IDR saja. Biaya: $0 (Supabase Free + Vercel Hobby).

## Prioritas — 2026-10-03 (PM)

> State: M0 100%. **147 test hijau.** Auth produksi: email + PIN 6 digit (kanonik; magic link/OTP legacy deprecated). Nav bawah mobile (`Dashboard | Trip | Gabung | Keluar`) + audit kontras token kanonik (skrip `check-contrast.mjs` sudah token baru, exit 0). `addExpense`/`markSettled` pakai id pra-generate; `deleteTrip` cek error + baris terhapus (flash `delete-error`); `deleteExpense` cek count exact. M1 migrasi init DIKLAIM jalan di `.superpowers/sdd/mvp/progress.md` — belum diverifikasi ulang di sesi ini; project/env mungkin ada, gate RLS tetap terbuka. Realtime: kode ter-push (commit `0b4dc53`), migrasi `20261003074910_realtime_trip_members.sql` SUDAH live (2026-10-03, terverifikasi `pg_publication_tables`) — uji 2 tab manual masih belum. M5 primitives kode selesai commit `10c13f3`, uji browser belum. Reset PIN admin manual `docs/admin-reset-pin.md` selesai. E2E 2 akun, HP asli, deploy, backup tetap terbuka. Guest-mode tunda (PRD §4.6).
> Aturan gate: status "kode selesai" dibedakan dari "gate runtime/manual". Kode selesai = implementasi ada di tree/commit. Gate tertunda = butuh DB live / aksi manual / uji browser; gate tertunda tidak membatalkan status kode, dan kode selesai tidak menutup gate.

### Arti label

- **kode selesai** = implementasi ada di tree/commit, belum lolos gate runtime/manual.
- **gate manual tertunda/terbuka** = butuh aksi manual (DB live, 2 tab browser, HP asli, deploy, E2E); jangan centang tanpa bukti.

### P0 — Blocker (buka gembok dulu)

| # | Item TODO | Status | Alasan |
|---|-----------|--------|--------|
| P0-1 | M1: project Supabase Free + env + 6 tabel + RLS + migrasi jalan | kode diklaim ada (progress.md) / verifikasi ulang belum — gate manual tertunda | Root blocker: gate M1 tetap merah sampai verifikasi ulang |
| P0-2 | M1: test RLS member vs non-member + gate migrasi bersih | gate manual terbuka (tanpa bukti, jangan centang) | Gate M1; keamanan PRD §7.4, syarat lanjut |
| P0-3 | M2: `/login` + `/trips` + invite `/join?code=` + gate 2 akun join | kode selesai / gate 2 akun manual terbuka | Happy path PRD §5.1 langkah 1–4; unlock M3/M4 |

### P1 — Nilai inti (setelah gembok buka)

| # | Item TODO | Status | Alasan |
|---|-----------|--------|--------|
| P1-1 | M3: tab Itinerary + CRUD + validasi inline + empty state | kode selesai / gate manual tertunda; bottom-sheet HP / modal desktop belum terbukti (tetap terbuka) | Goal PRD §1.2 #1; dependensi: halaman trip M2 |
| P1-2 | M4: CRUD expense + aturan hapus + tab Keuangan + "Tandai lunas" + FAB | kode selesai (FAB + collapsed ada) / E2E 3-expense manual terbuka | Goal PRD §1.2 #2; core value app |
| P1-3 | M2 error states: kode salah + non-member redirect | kode selesai / gate manual ikut P0-3 | PRD §5.2; kecil, kerjakan bareng P0-3 |
| P1-4 | M3: realtime edit bareng | kode selesai + migrasi live (`20261003074910`) / uji 2 tab manual belum | Kolaborasi PRD §4.3; stabilkan CRUD dulu |

### P2 — Polish & rilis (terakhir)

| # | Item TODO | Status | Alasan |
|---|-----------|--------|--------|
| P2-1 | M5: primitives (skeleton, toast 3 dtk, modal konfirmasi) + bottom tabs + layout 640px | kode selesai (`10c13f3`) / uji browser manual terbuka; checklist §12 belum semua centang | Primitives sudah kode; jangan klaim desain selesai |
| P2-2 | M5: checklist §12 + uji HP asli via preview Vercel | gate manual terbuka (butuh app hidup + data) | Gate polish; butuh app hidup + data |
| P2-3 | M6: env Vercel + preview/prod + E2E §10.1 + backup dump + gate prod | terbuka (nunggu semua gate) | Paling akhir; E2E butuh alur penuh hidup |

### 3 langkah berikutnya (paling bernilai)

1. **Verifikasi ulang M1 di DB live** (env + migrasi init + RLS member vs non-member). Tanpa ini gate M1 tetap merah. (P0-1 → P0-2)
2. **Uji 2 tab manual (realtime sudah live)**, lalu E2E 2 akun penuh (buat trip → invite → join → itinerary → 3 expense → saran benar → tandai lunas). (P1-4 → P0-3/E2E)
3. **Uji browser manual M5** (buka modal, Tab/Esc, toast 3 dtk) + render 360px; jangan centang checklist §12 sebelum ini. (P2-1 → P2-2)

## M0 — Keputusan & setup

- [x] Jawab PRD §12: guest-mode MVP atau tunda? → **Tunda ke v1.1** (2026-09-26)
- [x] Jawab PRD §12: kategori fixed atau free-form? → **Enum tetap 6** (2026-09-26): `makan`, `transport`, `penginapan`, `tiket`, `belanja`, `lain-lain` — ikut design_system §7 + ikon Lucide
- [x] `git init` + commit awal (2026-09-26)
- [x] Scaffold Next.js App Router + TS + Tailwind + fonts (Gabarito + Plus Jakarta Sans) + `lang="id"` (2026-09-26)
- [x] Token design_system §10 jadi CSS variables + `@theme`; cek kontras token kanonik (`sky-600` di `parch-50`: 5.14:1 PASS via `scripts/check-contrast.mjs`, skrip memakai modul `src/lib/contrast.ts` + uji `npm test`) — **2026-09-27**

## M1 — DB & Supabase (PRD §7)

- [ ] Project Supabase Free + env (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` server-only)
- [ ] 6 tabel (§7.3): `profiles`, `trips`, `trip_members`, `itinerary_items`, `expenses`, `expense_splits`
- [ ] RLS: hanya member baca/tulis trip-nya; owner hapus trip / kick (§7.4)
- [ ] Test RLS: member vs non-member
- [ ] Gate: migrasi bersih + RLS test hijau

## M2 — Auth + trip + undangan (PRD §4.1–4.3, §5)

- [x] `/login` email + PIN 6 digit; `profiles.name` — kode selesai, gate manual ikut P0-3
- [x] `/trips`: buat trip (judul, destinasi, start/end), list trip user; pembuat = owner — kode selesai, gate manual ikut P0-3
- [x] Invite link `/join?code=`: buka → login → auto-join member — kode selesai, gate manual ikut P0-3
- [x] Owner hapus trip / kick; non-member buka trip → redirect + "Kamu belum jadi anggota trip ini" — kode selesai, verifikasi runtime belum
- [x] Kode invite salah → "Kode tidak valid" + tombol minta kode baru — kode selesai, verifikasi runtime belum
- [x] Validasi form trip (judul wajib, tanggal selesai ≥ mulai) — **2026-09-27** `src/lib/validate.ts` (`validateTripInput`); **7 test hijau**, + format kode invite (12 hex, `validateInviteCode`) — **2 test**
- [x] Reset PIN admin manual — `docs/admin-reset-pin.md` (Opsi 2, tanpa kode) — selesai
- [ ] Gate: 2 akun uji join via link berhasil

## M3 — Itinerary (PRD §4.4)

- [x] Grup per hari dari rentang tanggal, urut `tanggal + jam + sort_order` — **2026-09-26** `src/lib/itinerary.ts` (`eachDayInRange`, `groupItineraryByDay`, `formatTripDate`, `formatDayLabel`); **16 test hijau** `src/lib/itinerary.test.ts`
- [x] Tab Itinerary UI di `/trips/[id]` — kode selesai (`tab-nav.tsx` + `page.tsx`), gate manual tertunda
- [x] CRUD item (jam, judul, lokasi, catatan); semua member bisa edit — kode selesai (`itinerary-actions.ts`, `edit-itinerary-form.tsx`, `delete-buttons.tsx`), verifikasi runtime belum
- [ ] Bottom-sheet form di HP, modal tengah di desktop; validasi inline tanpa reload — belum terbukti, tetap terbuka
- [x] Validasi input itinerary (judul wajib, tanggal kalender sah, jam format HH:MM) — **2026-09-27** `src/lib/validate.ts` (`validateItineraryInput`); **7 test hijau**
- [ ] Realtime Supabase untuk edit bareng — kode ada (`trip-realtime.tsx` + `realtime.ts`), migrasi `20261003074910` sudah live (2026-10-03) + uji 2 tab belum
- [x] Empty state per hari + halaman ("Belum ada agenda di hari ini" / "Belum ada pengeluaran…") — kode selesai
- [ ] Gate: tambah/ubah/hapus tanpa error, urutan benar

## M4 — Keuangan & split-bill (PRD §4.5, §8)

- [x] Hitung: `share = amount / n`; `saldo = dibayar − bagian`; saran pelunasan minimal (§8 langkah 4) — **2026-09-26** `src/lib/split-bill.ts` (`splitEvenly`, `computeBalances`, `suggestSettlements`, `formatRupiah`)
- [x] Unit test: saldo + settlement minimal + settlement tercatat (PRD §8 wajib) — **21 test hijau** `src/lib/split-bill.test.ts` via `npm test`
- [x] Validasi input expense (nominal > 0, `paid_by` member, min 1 peserta split, kategori valid) + parse/format nominal rupiah (design_system §8.2) + metadata 6 kategori + ikon (design_system §7) — **2026-09-27** `src/lib/validate.ts` (`validateExpenseInput`, `parseRupiahInput`, `formatRupiahInput`, `isValidDate`, `EXPENSE_CATEGORIES`, `getExpenseCategory`); **23 test hijau** (expense 10 + kategori 3 + parse/format 8 + tanggal 2) di `src/lib/validate.test.ts` (39 test file ini; total 147 test lolos `npm test` per 2026-10-03)
- [x] CRUD expense (implementasi ada; **verifikasi runtime belum** — butuh Supabase). `addExpense`/`updateExpense`/`deleteExpense` di `src/lib/trips/expense-actions.ts` pakai id pra-generate (`crypto.randomUUID()`) agar tidak bergantung `INSERT ... RETURNING` yang bisa tampak gagal akibat RLS/trigger — **2026-09-27**
- [x] Hapus hanya owner / yang bayar (RLS `expenses_delete_owner_or_payer`; implementasi ada, verifikasi runtime belum) — **2026-09-27**
- [x] Tab Keuangan + "Tandai lunas" (`markSettled`, id pra-generate; satu baris split dari→ke) — implementasi ada, verifikasi runtime belum — **2026-09-27**
- [x] FAB "+ Pengeluaran" + anchor `#tambah-pengeluaran`; baris lunas → seksi "Sudah diselesaikan" (collapsed, `<details>`) — kode selesai (`page.tsx`), E2E manual belum
- [x] `deleteTrip` cek error + jumlah baris terhapus (bukan klaim sukses buta); gagal → redirect `/trips?flash=delete-error` + banner — **2026-09-27**
- [ ] Gate: 3 expense uji → saldo & saran benar, unit test hijau (**unit test hijau: 147; 3-expense E2E manual belum**)

## M5 — Polish mobile-first (PRD §6, design_system §12)

- [x] Bottom tabs `Dashboard | Trip | Gabung | Keluar` (`src/app/mobile-nav.tsx`, `md:hidden`, sembunyi di `/` `/login`, padding bawah via shell layout) — **2026-09-27**; sisa `safe-area inset` dipertahankan via `env(safe-area-inset-bottom)`
- [x] Skeleton loading, toast 3 dtk, modal konfirmasi hapus (fokus trap, `Esc`) — kode selesai commit `10c13f3` (`skeleton.tsx`, `toast.tsx` + `lib/toast.ts`, `confirm-dialog.tsx` + `lib/focus-trap.ts`, integrasi hapus + toast hasil aksi); uji interaksi browser belum
- [x] Checklist §12 (parsial): token kanonik + kontras terverifikasi (`src/lib/contrast.ts` + `scripts/check-contrast.mjs` exit 0); 360px no scroll-x / tombol ≥44px / reduced-motion **belum diverifikasi di HP** — **2026-09-27**
- [ ] Uji HP asli via preview Vercel (Android + iPhone)
- [ ] Gate: checklist §12 semua centang

## M6 — Deploy (PRD §11 tahap 6)

- [ ] Env lengkap di Vercel; service key server-only
- [ ] Preview per PR, production per merge `main`
- [ ] E2E manual §10.1: buat → undang 2 akun → itinerary → 3 expense → saran benar → tandai lunas
- [ ] Backup manual SQL dump pertama (Free tanpa auto-backup)
- [ ] Gate: E2E hijau di production
