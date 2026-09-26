# PRD — KemanaKita

**Versi:** 1.0 (MVP)
**Tanggal:** 26 September 2026
**Status:** Draft untuk implementasi
**Pemilik Produk:** Dhika

---

## 1. Ringkasan Produk

**KemanaKita** adalah aplikasi web untuk mengelola perjalanan (trip) bareng teman:
menyusun rencana, mengatur itinerary harian, dan mencatat pengeluaran bersama
dengan perhitungan patungan otomatis.

Aplikasi dioptimalkan untuk **browser mobile** karena paling sering dibuka saat
di jalan. Kolaborasi multi-user: satu trip dikelola bersama oleh beberapa teman
lewat tautan undangan.

### 1.1 Masalah yang Diselesaikan

Saat traveling bareng teman, rencana dan uang biasanya tersebar:
- Itinerary di chat grup yang cepat tenggelam dan sulit dicari.
- Catatan "siapa bayar apa" di Notes/chat, lalu hitung utang manual di akhir trip.
- Sering salah hitung, ada yang lupa bayar, atau ada yang menanggung lebih.

KemanaKita menyatukan semuanya di satu tempat: **satu trip, satu tim, tanpa drama**.

### 1.2 Tujuan (Goals)

1. Menyusun itinerary bersama dengan cepat dan bisa diakses semua anggota.
2. Mencatat pengeluaran dan menghitung otomatis siapa utang ke siapa.
3. Bisa dipakai nyaman dari browser HP saat di jalan.

### 1.3 Bukan Tujuan (Non-Goals — di luar MVP)

Fitur berikut **tidak** dibuat di MVP (mungkin di versi lanjutan):
- Voting destinasi
- Chat / komentar
- Galeri foto & upload gambar besar
- Peta / navigasi / geolokasi
- Aplikasi native (Android/iOS) & mode offline penuh (PWA)
- Notifikasi push
- Multi-mata uang (MVP hanya IDR)
- Backup otomatis & custom domain

### 1.4 Metrik Keberhasilan MVP

- Pengguna bisa membuat trip, mengundang teman, dan teman berhasil bergabung.
- Pengguna bisa menambah/mengubah itinerary tanpa error.
- Perhitungan saldo & saran pelunasan benar (diverifikasi unit test).
- Nyaman dipakai di HP: tidak ada scroll horizontal di lebar 360px.

---

## 2. Persona Pengguna

| Persona | Deskripsi | Kebutuhan Utama |
|---------|-----------|-----------------|
| **Si Pengatur (Owner)** | Inisiatif bikin trip, sering jadi "bendahara" | Buat trip, undang teman, isi itinerary, catat pengeluaran |
| **Anggota (Member)** | Ikut trip, ingin tahu rencana & bagian biaya | Lihat rencana, tambah ide itinerary, tahu utangnya |

---

## 3. Branding & Identitas

| Elemen | Nilai |
|--------|-------|
| **Nama** | KemanaKita (K besar di kedua kata, tanpa spasi, tanpa tanda tanya) |
| **Tagline** | "Rencana bareng, jalan bareng." |
| **Kepribadian** | Santai, kompak, khas teman Indonesia. Bahasa UI pakai "kita/kamu", bukan formal. |
| **Warna utama** | Teal laut `#0D9488` |
| **Warna aksen** | Amber sunset `#F59E0B` |
| **Netral** | Slate |
| **Font** | Display: Gabarito · Body: Plus Jakarta Sans (keduanya gratis) |
| **Logo** | Wordmark rounded bold + ikon pin-lokasi berbentuk tas ransel / huruf K |

**Contoh nada bahasa:**
- Empty state: "Belum ada rencana. Yuk bikin trip pertama kita!"
- Email undangan: "Kamu diundang ke trip X di KemanaKita."
- Judul tab browser: "KemanaKita"

---

## 4. Ruang Lingkup Fitur MVP

### 4.1 Autentikasi & Akun

- Daftar/masuk dengan email (magic link / OTP).
- Profil sederhana: nama tampilan.
- Pengguna yang belum daftar bisa mencoba membuat trip sebagai guest, lalu
  diminta mendaftar saat ingin menyimpan/mengundang. *(Opsional — lihat 4.6 catatan.)*

### 4.2 Manajemen Trip

- Membuat trip: judul, destinasi, tanggal mulai, tanggal selesai.
- Pembuat trip otomatis menjadi **owner**.
- Daftar trip yang diikuti pengguna.
- Owner dapat menghapus trip dan mengeluarkan anggota.

### 4.3 Undangan & Kolaborasi

- Owner/anggota menghasilkan **tautan undangan** berisi kode unik.
- Teman membuka tautan → login → otomatis bergabung sebagai member.
- Semua member dapat melihat dan mengubah itinerary & pengeluaran.
- Hanya owner yang dapat menghapus trip / mengeluarkan anggota.

### 4.4 Itinerary

- Ditampilkan per hari berdasarkan rentang tanggal trip.
- Item itinerary: jam, judul, lokasi, catatan.
- Tambah / ubah / hapus item.
- Urutan berdasarkan `tanggal + jam + sort_order`.
- Semua member dapat mengedit.

### 4.5 Keuangan & Split-Bill

- Menambah pengeluaran: judul, nominal (IDR), siapa yang bayar, tanggal, kategori.
- Peserta split: default semua member; bisa pilih sebagian (uncheck).
- Sistem menghitung `share_amount` = nominal / jumlah peserta.
- Halaman Keuangan menampilkan:
  - Total dibayar vs bagian tiap orang.
  - Saldo bersih per orang.
  - **Saran pelunasan minimal** (siapa bayar ke siapa, berapa) — mis. "Budi → Andi Rp50.000".
- Tombol **"Tandai lunas"** untuk mencatat pembayaran utang sebagai transaksi
  settlement.
- Validasi: nominal > 0; `paid_by` harus member; minimal 1 peserta split.
- Hapus pengeluaran hanya oleh owner atau orang yang membayar.

### 4.6 Catatan Cakupan

Fitur guest-mode (4.1) bersifat opsional. Jika waktu terbatas, prioritaskan
alur: daftar → buat trip → undang → itinerary → keuangan. Guest mode bisa
ditunda ke iterasi berikutnya.

---

## 5. Alur Pengguna Utama

### 5.1 Alur Bahagia (Happy Path)

1. Dhika daftar/login.
2. Dhika buat trip "Bali 3D2N" (destinasi, 3 hari).
3. Dhika salin tautan undangan, kirim ke grup.
4. Teman-teman buka tautan → login → bergabung.
5. Semua mengisi itinerary hari 1–3.
6. Saat jalan, tiap orang mencatat pengeluaran (hotel, makan, tiket).
7. Di akhir trip, buka tab Keuangan → lihat saran pelunasan → tandai lunas.

### 5.2 Alur Error

| Kondisi | Perilaku |
|---------|----------|
| Tautan/kode undangan salah atau kedaluwarsa | Pesan "Kode tidak valid" + tombol minta kode baru |
| Bukan member membuka trip | Redirect + "Kamu belum jadi anggota trip ini" |
| Form gagal (nominal 0, tanggal kosong) | Validasi inline, tidak reload, isian tidak hilang |
| Akses data trip oleh non-member | Ditolak di level database (RLS), bukan hanya UI |

---

## 6. Desain & UX (Mobile-First)

### 6.1 Prinsip

- Rancang mulai dari layar **360px**, baru naik ke desktop.
- Tidak ada scroll horizontal.
- Tombol minimal **44px**, teks minimal **14px**, form full-width.

### 6.2 Layout

- **Mobile:** navigasi bawah (bottom tabs) → `Trip | Itinerary | Keuangan | Anggota`;
  tombol aksi mengambang "+ Pengeluaran".
- **Desktop:** navigasi atas + konten 2 kolom (kiri itinerary, kanan ringkasan kas).
- List expense & itinerary tampil sebagai **cards vertikal** di HP; tabel hanya di desktop.
- Form tambah/edit berupa **bottom-sheet** di HP (geser dari bawah), modal tengah di desktop.

### 6.3 Performa

- Ringan & hemat data; loading per tab; aset hanya SVG.
- Wajib diuji di HP asli via link preview Vercel (Android + iPhone), bukan hanya
  Chrome desktop.

---

## 7. Arsitektur Teknis

### 7.1 Stack

| Lapisan | Teknologi |
|---------|-----------|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Auth | Supabase Auth (email magic link / OTP) |
| Database | Supabase Postgres + Row Level Security (RLS) |
| Realtime | Supabase Realtime (untuk edit bareng) |
| Hosting | Vercel |

### 7.2 Environment Variables (di Vercel)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY` (server-only, jangan diekspos ke client)

### 7.3 Skema Data (6 tabel)

1. **profiles** — `id`, `name`
2. **trips** — `id`, `title`, `destination`, `start_date`, `end_date`, `created_by`
3. **trip_members** — `trip_id`, `user_id`, `role` (owner/member)
4. **itinerary_items** — `trip_id`, `date`, `time`, `title`, `notes`, `location`, `sort_order`
5. **expenses** — `trip_id`, `title`, `amount`, `paid_by`, `date`, `category`
6. **expense_splits** — `expense_id`, `user_id`, `share_amount`

### 7.4 Aturan Akses

- Hanya member trip yang dapat membaca/menulis data trip tersebut (via RLS).
- Owner memiliki hak tambahan (hapus trip, kelola anggota).
- Service key hanya dipakai di server (route handler / server action).

### 7.5 Struktur Halaman

- `/` → landing / redirect
- `/login` → autentikasi
- `/trips` → daftar trip
- `/trips/[id]` → detail trip dengan tab: `Itinerary | Keuangan | Anggota`
- `/join?code=` → menerima undangan

---

## 8. Algoritma Split-Bill

1. Untuk tiap pengeluaran, hitung `share_amount = amount / jumlah_peserta`.
2. Akumulasi per orang:
   - `total_dibayar[user]` = jumlah `amount` di mana user = `paid_by`.
   - `total_bagian[user]` = jumlah `share_amount` yang menjadi beban user.
3. `saldo[user] = total_dibayar[user] − total_bagian[user]` (positif = harus menerima).
4. Hasilkan **saran pelunasan minimal**: cocokkan yang bersaldo negatif (berutang)
   dengan yang bersaldo positif (piutang), dari nominal terbesar.
5. Settlement ("Tandai lunas") dicatat sebagai transaksi tersendiri dan
   memengaruhi saldo.

Fungsi perhitungan ini **wajib diuji dengan unit test**.

---

## 9. Kebutuhan Non-Fungsional

| Aspek | Target MVP |
|-------|------------|
| Responsif | Optimal 360px–1440px |
| Performa | Halaman tab ringan, hemat data |
| Keamanan | RLS aktif; service key server-only; validasi di server |
| Biaya | $0 — Supabase Free + Vercel Hobby |
| Bahasa | Bahasa Indonesia |
| Mata uang | IDR saja |

### 9.1 Catatan Biaya (Supabase Free)

- Kuota: 50.000 MAU, DB 500MB, egress 5GB, storage 1GB, maks 2 project aktif.
- Project **di-pause** setelah 1 minggu tidak aktif (data tidak hilang; bisa di-unpause).
- Tanpa backup otomatis & tanpa custom domain → lakukan backup manual (SQL dump) berkala.
- Hindari menyimpan file besar di Storage agar tetap gratis.

---

## 10. Rencana Pengujian

### 10.1 Pengujian Manual (Alur End-to-End)

1. Buat trip → undang 2 akun → tambah itinerary → tambah 3 pengeluaran →
   verifikasi hitungan utang benar → tandai lunas.
2. Uji tampilan di HP asli (Android + iPhone) via preview Vercel.

### 10.2 Pengujian Otomatis (Ringan)

- Unit test fungsi **hitung saldo + saran pelunasan**.
- Test RLS: akses member vs non-member terhadap data trip.

---

## 11. Rencana Rilis

| Tahap | Aktivitas |
|-------|-----------|
| 1 | Setup project Next.js + Supabase + skema & RLS |
| 2 | Auth + manajemen trip + undangan |
| 3 | Itinerary |
| 4 | Keuangan & split-bill + unit test |
| 5 | Polish mobile-first + pengujian di HP asli |
| 6 | Deploy ke Vercel (preview per PR, production per merge ke `main`) |

---

## 12. Pertanyaan Terbuka

- Guest-mode (coba tanpa daftar) masuk MVP atau iterasi berikutnya?
- Perlu kategori pengeluaran tetap (makan, transport, penginapan, tiket, lain-lain)?

---

*Dokumen ini adalah dasar desain untuk implementasi KemanaKita MVP.*
