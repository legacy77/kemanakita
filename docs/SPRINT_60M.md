# SPRINT_60M — Todo + Checkpoint (4 Okt 2026)

> Target: **≥70% progres gate sisa dalam 60 menit.**
> Aturan: hitung ulang baseline di **detik 0**; jangan asumsikan angka lama.
> Bila build/test sudah hijau, **berhenti** — jangan gild (tambah risiko tanpa nilai).

## Definisi 70%
7 checkpoint (CP60-0..CP60-6). Menutup **CP60-0..CP60-4 = 5/7 ≈ 71%**.
Artinya: 70% tercapai **di menit ~55–60**, tepat saat E2E 2 akun (CP60-4) selesai.
Sisa 29% (CP60-5, CP60-6) memang tidak bisa dipadatkan: butuh mata+perangkat manusia.

## Pembagian kerja
- **AGEN** (otomatis, saya jalankan): CP60-0..CP60-3, CP60-7 (commit).
- **USER** (manual, browser/HP): CP60-4..CP60-6. Saya siapkan skrip langkah + tempat catat bukti.

---

## Todo list

### Fase A — Gate otomatis (0–40 menit, AGEN)
- [ ] CP60-0 Baseline detik 0: `git pull --ff-only`, `git log -1`, tree bersih, hitung ulang test/tsc/lint. (5 mnt)
- [ ] CP60-1 Gate repo: `npm test` + `tsc --noEmit` + `npm run lint` + `npm run build`. Berhenti bila hijau. (10 mnt)
- [ ] CP60-2 Probe integritas DB live: RLS per-peran (owner/member/anon), trigger owner otomatis, RPC invite, publikasi realtime 4 tabel. (10 mnt)
- [ ] CP60-3 E2E jalur-data via SQL: trip → join akun-2 → 3 expense (pembayar beda) → split → settlement → verifikasi saldo nol + saran minimal. Bersihkan data uji setelah. (15 mnt)

### Fase B — Gate manual inti (40–60 menit, USER)
- [ ] CP60-4 E2E 2 akun di browser (alur PRD §5.1/§10.1). Bukti: tiap langkah ✔ + screenshot opsional. (15 mnt)
- [ ] CP60-5 Realtime 2 tab: edit agenda di tab A → tab B auto-refresh. (5 mnt)

### Fase C — Polish & rilis (melewati 60 mnt, USER)
- [ ] CP60-6a Uji M5 browser: modal Tab/Esc/fokus-balik, toast 3 dtk, 360px tanpa scroll-x. (5 mnt)
- [ ] CP60-6b HP asli Android + iPhone via preview Vercel. (10 mnt)
- [ ] CP60-6c Toggle **Leaked Password Protection** di dashboard Supabase → Auth. (2 mnt)
- [ ] CP60-7 Commit + push + update `docs/TODO.md`/`CHECKPOINTS.md` (AGEN). (5 mnt)

---

## Checkpoint (gate + bukti)

| CP | Waktu | Owner | Gate (definisi lulus) | Bukti |
|----|-------|-------|------------------------|-------|
| CP60-0 | 0–5 m | Agen | Repo sinkron, tree bersih, baseline test/tsc/lint tercatat | Output perintah |
| CP60-1 | 5–15 m | Agen | `npm test` pass, tsc 0, lint 0, build sukses | Exit code + jumlah test |
| CP60-2 | 15–25 m | Agen | RLS owner=1/anon=0, trigger owner jalan, RPC invite balikin trip, 4 tabel di publikasi | Hasil SQL |
| CP60-3 | 25–40 m | Agen | Saldo total nol, saran pelunasan minimal & benar, data uji dibersihkan | Hasil SQL + rollback |
| **CP60-4** | **40–55 m** | **User** | **Buat→invite→join→itinerary→3 expense→saran benar→tandai lunas, tanpa error** | **Ceklis langkah** |
| CP60-5 | 55–60 m | User | Tab B auto-refresh < 1 dtk setelah edit tab A | Observasi |
| CP60-6 | 60 m+ | User | Modal aksesibel, toast 3 dtk, 360px rapi, HP OK, password protection ON | Observasi |

**Milestone 70% = CP60-4 selesai (≈ menit 55–60).**

---

## Aturan berhenti & risiko
- CP60-1 **hijau** → jangan lanjut "memperbaiki" yang tidak rusak.
- CP60-2/CP60-3 gagal → **stop**, lapor pesan error persis; jangan tambal buta.
- CP60-3 memakai data uji **sementara** di DB live; wajib dibersihkan (trip uji dihapus) agar tidak mengotori data Zara.
- Login uji: email + PIN 6 digit. Owner trip = `nzamirza@gmail.com` (Zara).
  Akun kedua: `andhikatrickster@gmail.com` / `andhikatrickster@outlook.com`.
  Invite trip uji: `d91e73e6c52a` (trip "Malay").

## Kalau waktu habis di menit 60
Yang sudah pasti bernilai: CP60-0..CP60-3 (gate otomatis + bukti data) ≈ 71%.
Yang tersisa jujur terbuka: CP60-5 (realtime), CP60-6 (browser/HP/toggle).
Tidak ada kode menggantung — hanya verifikasi manual.
