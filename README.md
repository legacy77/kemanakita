# KemanaKita 🌊

> **Rencana bareng, jalan bareng.**

Pernah nggak sih, mau trip bareng temen tapi semuanya berantakan? Itinerary nyemplung di chat grup, terus tenggelam. Catatan "siapa bayar apa" ada di Notes, ada di kepala, ada yang lupa. Pas mau pulang, ribet ngitung utang masing-masing. 😵‍💫

**KemanaKita** beresin semua itu. Satu trip, satu tim, tanpa drama.

---

## Jadi ini buat apa? 🤔

Bayangin kamu mau jalan ke Bali 3 hari bareng 4 orang. Di KemanaKita, kalian bisa:

- **Susun itinerary bareng** — per hari, per jam. Semua anggota bisa nambah ide.
- **Catat pengeluaran** — siapa bayar hotel, siapa traktir makan, langsung ke-catat.
- **Hitung patungan otomatis** — sistem yang ngitung, bukan feeling. Siapa utang ke siapa, berapa, jelas.
- **Saran pelunasan paling simpel** — bukan 10 transfer sana-sini, tapi seefisien mungkin. Tinggal "Tandai lunas" pas udah bayar. ✅

Buka dari HP sambil di jalan, karena emang didesain buat itu. 📱

---

## Siapa yang cocok pakai ini? 👀

- **Si pengatur** yang biasanya jadi bendahara gak resmi trip. Buat trip, undang temen, beres.
- **Si anggota** yang cuma pengen tau rencana dan utangnya sendiri. Gak perlu nanya di grup terus.

Yang penting: kalian berteman. Semua anggota bisa ngedit itinerary dan pengeluaran — nggak ada yang cuma bisa nonton.

---

## Gimana cara mulainya? 🚀

1. **Bikin trip** — isi judul, destinasi, tanggal mulai & selesai.
2. **Undang temen** — bagikan tautan undangan ke grup chat.
3. **Isi bareng** — itinerary dan pengeluaran diisi siapa aja yang mau.
4. **Di akhir trip** — buka tab Keuangan, lihat saran pelunasan, tandai lunas. Selesai, gak ada yang ngerasa dizolimi. 🤝

---

## Di balik layar ⚙️

| Bagian | Teknologi |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Auth | Supabase Auth (email + PIN 6 digit) |
| Database | Supabase Postgres + Row Level Security |
| Realtime | Supabase Realtime (biar edit barengan tetap sinkron) |
| Hosting | Vercel |

**Prinsipnya: nol biaya.** Jalan di Supabase Free + Vercel Hobby. Cocok buat project bareng temen, bukan buat bikin startup unicorn dulu. 😄

---

## Coba jalanin di komputer kamu 💻

Butuh **Node.js 20+** dan akun [Supabase](https://supabase.com) (gratis).

```bash
# 1. Install dependency
npm install

# 2. Siapkan environment variable
cp .env.example .env.local
# lalu isi nilai-nilainya dari dashboard Supabase:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_KEY   (server-only, jangan sampai bocor ke client!)

# 3. Jalankan migrasi database
# buka supabase/migrations/20260926000000_init.sql
# paste & run di Supabase SQL Editor
# lalu buka supabase/migrations/20260927000000_owner_trigger.sql
# paste & run juga (trigger owner saat trip dibuat)

# 4. Nyalain
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) — udah jalan. ✨

---

## Yang belum ada (dan sengaja belum dibuat) 🙅

Biar fokus dulu, beberapa hal ditahan buat versi berikutnya:

- Voting destinasi
- Chat / komentar
- Galeri foto
- Peta & navigasi
- Aplikasi native (Android/iOS) & mode offline
- Notifikasi push
- Multi-mata uang (sekarang cuma IDR)
- Backup otomatis

---

## Kontribusi 🤝

Project ini masih kecil dan sedang tumbuh. Kalau ada ide atau nemu bug, buka issue atau PR aja.

---

*Dibikin buat temen-temen yang pengen jalan bareng tanpa ribet ngitung.* ✌️
