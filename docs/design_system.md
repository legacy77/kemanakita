# Design System — KemanaKita

**Versi:** 2.0 (tema "JRPG Bright")
**Tanggal:** 27 September 2026
**Status:** Acuan implementasi UI
**Rujukan:** `docs/PRD.md`

> **Perubahan v2.0:** tema berganti dari "Coastal Notebook" (teal/sand) ke
> **"JRPG Bright"** — nuansa game petualangan RPG Jepang yang ceria dan terang.
> Nama token lama (`lagoon`/`sunset`/`sand`/`slate`) **dipertahankan sebagai alias**
> agar kelas lama tetap jalan; nama kanonik baru adalah `sky`/`gold`/`parch`/`ink`.
> Font display berganti dari Gabarito ke **M PLUS Rounded 1c**.

---

## 1. Arah Desain

### 1.1 Konsep

**"JRPG Bright"** — nuansa game petualangan RPG Jepang: ceria, hangat, dan terang,
seperti layar judul game saat matahari pagi menyinari peta dunia.

Permukaan memakai **kertas hangat (parchment)** alih-alih putih murni, dengan
aksen **biru langit anime (sky)** sebagai warna aksi dan **emas hangat (gold)**
sebagai pita/badge. Panel berbentuk **"jendela game"** — tepi tebal 2px dengan
bayangan bertingkat — sehingga terasa seperti menu di dalam game. Tetap rapi saat
menampilkan angka uang.

### 1.2 Prinsip

1. **Mobile dulu, 360px adalah kanvas utama.** Desktop adalah bonus.
2. **Angka uang adalah bintang.** Nominal harus paling mudah dibaca di layar.
3. **Ceria tapi teratur.** Satu aksi utama per layar; aksen emas dipakai hemat.
4. **Sekali lihat, paham.** Status utang/lunas harus terbaca tanpa berpikir.
5. **Sentuhan ramah.** Sudut membulat, panel "jendela game", bahasa santai.

### 1.3 Anti-pola (Dilarang)

- Gradasi ungu/biru di atas putih (ciri khas desain generik).
- Font sistem default sebagai font utama.
- Tabel penuh di layar HP.
- Tombol ikon tanpa label di aksi penting.
- Teks abu-abu terang sebagai body text.
- Animasi lebih dari 300ms pada interaksi harian.
- Warna sebagai satu-satunya penanda status (harus ada ikon/teks).

---

## 2. Tipografi

### 2.1 Keluarga Font

| Peran | Font | Pemakaian |
|-------|------|-----------|
| **Display / Heading** | **M PLUS Rounded 1c** (500/700/800) | Judul halaman, judul kartu, angka besar |
| **Body / UI** | **Plus Jakarta Sans** (400/500/600/700) | Paragraf, label, tombol, input |
| **Angka Uang** | Plus Jakarta Sans + `font-variant-numeric: tabular-nums` | Nominal, saldo, tanggal |
| Fallback mono | IBM Plex Mono (400/500) | Hanya jika `tabular-nums` tidak didukung |

> Alasan: M PLUS Rounded 1c adalah font membulat khas UI game Jepang — memberi
> karakter "game" yang ramah tanpa mengorbankan keterbacaan; Plus Jakarta Sans
> menjaga keterbacaan teks panjang dan asal Indonesia. Angka uang wajib
> **tabular** agar kolom nominal tidak goyang.

### 2.2 Skala Tipe

| Token | Size / Line-height | Weight | Tracking | Pemakaian |
|-------|--------------------|--------|----------|-----------|
| `display` | 32 / 38 | 700 | -0.02em | Nama trip di header, hero |
| `h1` | 26 / 32 | 700 | -0.015em | Judul halaman |
| `h2` | 20 / 26 | 600 | -0.01em | Judul seksi, judul kartu |
| `h3` | 17 / 24 | 600 | 0 | Sub-judul item |
| `body` | 15 / 22 | 400 | 0 | Paragraf |
| `body-strong` | 15 / 22 | 600 | 0 | Nama orang, penekanan |
| `label` | 13 / 18 | 600 | 0.01em | Label form, tab |
| `caption` | 12 / 16 | 500 | 0.01em | Metadata, lokasi, waktu |
| `amount-lg` | 28 / 32 | 700 | -0.01em | Saldo utama |
| `amount` | 16 / 22 | 600 | 0 | Nominal di list |
| `overline` | 11 / 14 | 700 | 0.08em | Kategori, badge, uppercase |

**Aturan minimum:** tidak ada teks di bawah **12px**, body minimal **15px**.
Di layar ≥1024px, `body` naik ke 16/24.

### 2.3 Contoh Penerapan

- Judul trip → `display` (M PLUS Rounded 1c 800)
- "Total kamu bayar" → `overline` + `amount-lg`
- Nama anggota → `body-strong`
- "Rp 1.250.000" → `amount` dengan `tabular-nums`

---

## 3. Warna

### 3.1 Palet Inti

> Nama kanonik kini: **sky** (primary — biru langit anime), **gold** (accent —
> emas hangat), **parch** (permukaan kertas hangat), **ink** (teks navy).
> Nama lama `lagoon`/`sunset`/`sand`/`slate` **tetap tersedia sebagai alias**
> dan memetakan ke nilai di bawah, jadi kelas lama (`bg-lagoon-700`,
> `text-slate-500`, `bg-sand-100`, dst.) tetap valid.

**Sky (primary — biru langit anime)**

| Token | Hex | Pemakaian |
|-------|-----|-----------|
| `sky-50` | `#EFF7FF` | Latar chip lembut |
| `sky-100` | `#D9EDFF` | Latar badge, hover lembut |
| `sky-200` | `#BCE0FF` | Border aksen |
| `sky-300` | `#8CCBFF` | Ikon di latar gelap |
| `sky-400` | `#55AEFF` | Aksen gelap, grafik |
| `sky-500` | `#2B8FEF` | Hover tombol, fokus |
| `sky-600` | `#1668D6` | **Warna merek** (isi tombol, ikon) |
| `sky-700` | `#1250A8` | **Teks/aksi utama** (aman kontras) |
| `sky-800` | `#14428A` | Tekanan tombol (pressed) |
| `sky-900` | `#163A72` | Heading di tema gelap |
| `sky-950` | `#0E2549` | Latar tema gelap |

**Gold (accent — emas hangat)**

| Token | Hex | Pemakaian |
|-------|-----|-----------|
| `gold-50` | `#FFF9E8` | Latar sorotan |
| `gold-100` | `#FFF0C4` | Chip "belum lunas" |
| `gold-300` | `#FFD666` | Grafik, highlight |
| `gold-500` | `#F5A524` | **Aksen merek** (pita, badge) |
| `gold-600` | `#D08305` | Teks aksen di latar terang |
| `gold-700` | `#A16207` | Teks peringatan |

**Parchment (permukaan kertas hangat)**

| Token | Hex | Pemakaian |
|-------|-----|-----------|
| `parch-50` | `#FFFCF4` | Latar halaman |
| `parch-100` | `#FFF6E6` | Kartu di atas halaman |
| `parch-200` | `#FBEACF` | Kartu sekunder, input |
| `parch-300` | `#F1DCB6` | Border halus |
| `parch-400` | `#E0C493` | Border kuat, garis pemisah |
| `parch-500` | `#C0A470` | Placeholder, ikon nonaktif |

**Ink (teks navy & garis)**

| Token | Hex | Pemakaian |
|-------|-----|-----------|
| `ink-900` | `#22304D` | Teks utama |
| `ink-700` | `#3B4B6E` | Teks sekunder kuat |
| `ink-600` | `#5A6A8C` | Teks sekunder |
| `ink-500` | `#808EA8` | Metadata, ikon |
| `ink-300` | `#C6CFE0` | Garis pemisah |
| `ink-100` | `#EDF1F8` | Latar netral |

### 3.2 Warna Semantik

| Token | Hex | Arti | Pasangan |
|-------|-----|------|----------|
| `success` | `#0E9F6E` | Lunas, saldo positif | ikon centang |
| `success-bg` | `#D6F6E9` | Latar status lunas | — |
| `danger` | `#E5484D` | Hapus, saldo negatif | ikon tanda seru |
| `danger-bg` | `#FFE3E5` | Latar peringatan | — |
| `warning` | `#A16207` | Belum lunas, perlu aksi | ikon jam |
| `warning-bg` | `#FFF0C4` | Latar pending | — |
| `info` | `#1668D6` | Info, tips | ikon info |
| `info-bg` | `#D9EDFF` | Latar info | — |

**Aturan status keuangan (wajib ikon + teks, bukan warna saja):**

- Saldo **positif** (piutang) → `success` + ikon panah masuk + label "Harus menerima"
- Saldo **negatif** (utang) → `danger` + ikon panah keluar + label "Harus bayar"
- Saldo **nol** → `ink-500` + label "Aman, lunas"

### 3.3 Rasio Kontras (penting)

| Kombinasi | Rasio | Aman untuk |
|-----------|-------|-----------|
| `sky-700` di `parch-50` | ≥7:1 | Semua teks ✅ |
| Putih di `sky-600` | ≥4.5:1 | Semua teks ✅ (tombol utama) |
| `sky-600` di `parch-50` | ~4.6:1 | Metadata ≥13px ✅ |
| `ink-900` di `parch-50` | >14:1 | Semua teks ✅ |
| `ink-500` di `parch-50` | ≥4.5:1 | Metadata ≥13px ✅ |
| `success` di `success-bg` | ≥4.5:1 | Badge lunas ✅ |
| `danger` di `danger-bg` | ≥4.5:1 | Badge utang ✅ |
| `warning` di `warning-bg` | ≥4.5:1 | Badge pending ✅ |
| `ink-900` di `gold-500` | ≥8:1 | Pita/badge emas ✅ |

> **Keputusan:** tombol utama memakai `sky-600` sebagai isi dengan teks putih
> (aman ≥4.5:1). `sky-700` dipakai untuk teks/tautan di latar terang agar
> kontras lebih tinggi. Verifikasi rasio dengan `scripts/check-contrast.mjs`
> bila nilai berubah.

### 3.4 Gradasi & Tekstur (hemat)

- **Sky gradient** (header trip / panel quest): `linear-gradient(180deg, #55AEFF, #1668D6)`
- **Gold gradient** (pita/ribbon): `linear-gradient(180deg, #FFD666, #F5A524)`
- **Latar halaman**: langit lembut (radial biru) + kertas hangat (radial emas) di atas `parch-50`.
- Gradasi **tidak** dipakai di latar form atau area angka (mengganggu baca).

---

## 4. Tema

### 4.1 Tema Terang (default)

| Peran | Token | Nilai |
|-------|-------|-------|
| Latar halaman | `bg` | `parch-50` |
| Permukaan | `surface` | `#FFFEFB` |
| Permukaan alternatif | `surface-2` | `parch-100` |
| Teks utama | `fg` | `ink-900` |
| Teks sekunder | `fg-muted` | `ink-600` |
| Border | `border` | `parch-300` |
| Border kuat | `border-strong` | `parch-400` |
| Aksen | `accent` | `gold-500` |
| Aksi utama | `action` | `sky-600` |

### 4.2 Tema Gelap (v1.1, token sudah disiapkan)

| Peran | Nilai |
|-------|-------|
| `bg` | `#101A2E` |
| `surface` | `#17233D` |
| `surface-2` | `#1E2D4B` |
| `fg` | `#EAF1FF` |
| `fg-muted` | `#A3B3D0` |
| `border` | `#2C3D61` |
| `action` | `sky-400` (teks di atasnya gelap) |

> Implementasi: token didefinisikan sebagai CSS variable sehingga tema gelap
> cukup menukar nilai, tanpa mengubah kelas komponen.

---

## 5. Ruang (Spacing), Radius, Bayangan

### 5.1 Skala Spacing (basis 4px)

| Token | px | Pemakaian umum |
|-------|----|----------------|
| `space-1` | 4 | Jarak ikon–teks |
| `space-2` | 8 | Padding chip, gap rapat |
| `space-3` | 12 | Padding dalam kartu rapat |
| `space-4` | 16 | **Padding standar kartu & layar** |
| `space-5` | 20 | Gap antar kartu |
| `space-6` | 24 | Jarak antar seksi |
| `space-8` | 32 | Jarak antar blok besar |
| `space-12` | 48 | Jarak hero, empty state |

**Padding layar:** 16px di HP, 24px di tablet, hingga 32px di desktop.

### 5.2 Radius

| Token | px | Pemakaian |
|-------|----|-----------|
| `radius-sm` | 8 | Chip, badge, input kecil |
| `radius-md` | 12 | Input, tombol |
| `radius-lg` | 16 | Kartu |
| `radius-xl` | 24 | Bottom sheet, panel besar |
| `radius-full` | 9999 | Avatar, pill, FAB |

> Sudut membulat adalah bagian dari karakter merek — jangan pakai sudut tajam.

### 5.3 Bayangan

| Token | Nilai | Pemakaian |
|-------|-------|-----------|
| `shadow-xs` | `0 1px 2px rgba(34,48,77,.08)` | Kartu datar, input |
| `shadow-sm` | `0 2px 6px rgba(34,48,77,.10)` | Kartu standar |
| `shadow-md` | `0 2px 0 rgba(20,66,138,.9), 0 6px 16px rgba(22,104,214,.18)` | Panel "jendela game", FAB |
| `shadow-lg` | `0 -8px 28px rgba(34,48,77,.18)` | Bottom sheet, modal |

> Panel "jendela game" memakai **bayangan bertingkat**: garis dasar solid
> navy (`2px`) + bayangan lembut kebiruan. Elemen merek bernuansa sky, netral
> bernuansa ink. Hindari bayangan hitam pekat.

### 5.4 Border

- Standar: `1px solid var(--border)`
- **Panel "jendela game":** `2px solid var(--ink-900)` + `radius-md` + `shadow-md`
  (kelas siap pakai: `.rpg-panel`, `.rpg-panel-sky`, `.rpg-corner`).
- Fokus: `2px solid sky-500` dengan ring `sky-500/25`

---

## 6. Gerak (Motion)

### 6.1 Durasi & Easing

| Token | Nilai | Pemakaian |
|-------|-------|-----------|
| `motion-fast` | 120ms | Hover, warna, opasitas |
| `motion-base` | 200ms | Tombol, tab, transisi kecil |
| `motion-slow` | 300ms | Bottom sheet, modal, halaman |
| `ease-standard` | `cubic-bezier(.2,.8,.2,1)` | Umum |
| `ease-spring` | `cubic-bezier(.34,1.56,.64,1)` | Bottom sheet, FAB, badge |

### 6.2 Pola

- **Muat halaman:** konten masuk bertahap (`opacity 0→1`, `translateY 8px→0`),
  jeda 40ms per item, maksimal 6 item.
- **Bottom sheet:** naik dari bawah + fade scrim; tutup dengan menggeser ke bawah
  atau tap scrim.
- **Tambah pengeluaran:** angka total "berhitung naik" 300ms saat saldo berubah.
- **Tandai lunas:** baris berubah ke status sukses + ikon centang muncul dengan
  `ease-spring`.
- **Hormati `prefers-reduced-motion`:** semua animasi dinonaktifkan, hanya ganti
  instan.

---

## 7. Ikonografi

- **Set:** Lucide (konsisten, gratis, ramah) — gaya garis, `stroke-width: 2`.
- **Ukuran:** 16 (dalam chip), 20 (default), 24 (nav bawah), 28 (aksi utama).
- **Ikon wajib untuk:** navigasi, status keuangan, kategori pengeluaran, aksi
  destruktif.
- **Ikon kategori pengeluaran:**

| Kategori | Ikon |
|----------|------|
| Makan & Minum | `utensils` |
| Transport | `car` |
| Penginapan | `bed` |
| Tiket & Wisata | `ticket` |
| Belanja | `shopping-bag` |
| Lain-lain | `receipt` |

- **Logo:** wordmark "KemanaKita" (M PLUS Rounded 1c 800) + ikon pin-lokasi yang
  membentuk tas ransel. Sediakan `logo.svg`, `logo-mark.svg`, `favicon.svg`.

---

## 8. Komponen

### 8.1 Tombol

| Varian | Latar | Teks | Border | Pemakaian |
|--------|-------|------|--------|-----------|
| `primary` | `sky-600` | putih | tepi `ink-900` 2px (`.rpg-btn`) | Aksi utama (1 per layar) |
| `secondary` | transparan | `sky-700` | `1px sky-600` | Aksi pendukung |
| `accent` | `gold-500` | `ink-900` | — | Aksi penting keuangan |
| `ghost` | transparan | `ink-700` | — | Aksi tersier |
| `danger` | `danger` | putih | — | Hapus (selalu konfirmasi) |

**Spesifikasi:**
- Tinggi: **48px** (standar), 56px (aksi utama layar), 44px minimum absolut.
- Padding horizontal: 16px. Radius: `radius-md`. Teks: `label` 15px/600.
- Ikon opsional, gap 8px, ikon di kiri.
- `:hover` → 1 tingkat lebih gelap; `:active` → `scale(0.98)`.
- `:disabled` → opasitas 45%, `cursor: not-allowed`.
- Full-width di HP, auto di desktop.
- **FAB** "+ Pengeluaran": 56px, `radius-full`, `shadow-md`, ikon + label di HP.

### 8.2 Input & Form

- Tinggi 48px, radius `radius-md`, border `1px var(--border)`, latar `surface`.
- Padding 12px 14px. Teks 16px (**penting: cegah auto-zoom iOS**).
- Label di atas input, `label` 13px/600, jarak 6px.
- Placeholder `parch-500`.
- **Fokus:** border `sky-500` + ring `2px sky-500/25`.
- **Error:** border `danger` + pesan 13px `danger` dengan ikon, di bawah field.
- **Nominal uang:** prefix "Rp" sebagai teks tetap di kiri, input `inputmode="numeric"`,
  format ribuan otomatis saat blur, angka tabular.
- **Tanggal:** date picker native di HP; tampilkan format `12 Okt 2026`.
- **Pemilih peserta split:** daftar anggota dengan checkbox 24px; header aksi
  "Pilih semua / Kosongkan"; tampilkan "Dibagi 4 orang = Rp75.000/orang".
- **Bottom-sheet (HP):** form tambah/edit muncul dari bawah, tinggi maks 90vh,
  header lengket dengan tombol tutup, aksi utama lengket di bawah.

### 8.3 Kartu

- Latar `surface`, radius `radius-lg`, padding 16px, `shadow-sm`, border 1px.
- Judul kartu `h2`/`h3`; isi `body`; metadata `caption` + ikon.
- Kartu trip: header gradasi sea + nama trip (`display`), baris metadata
  (destinasi, rentang tanggal), footer chip status.
- Kartu pengeluaran: kiri = ikon kategori dalam lingkaran `sky-50`;
  tengah = judul + "Dibayar Budi · 12 Okt"; kanan = `amount` + caption bagian
  ("bagianmu Rp50.000").

### 8.4 Navigasi

**Mobile (bottom tabs):** `Dashboard | Trip | Gabung | Keluar`
- Komponen: `src/app/mobile-nav.tsx` (client, `usePathname()`).
- Tampil hanya di layar **`md:hidden`** (mobile). Desktop tetap tanpa nav bawah.
- **Disembunyikan** di `/` (landing) dan `/login*` (gerbang masuk).
- Tinggi item 56px + `padding-bottom: env(safe-area-inset-bottom)`.
- Batang: latar `parch-100`, `border-top: 2px solid ink-900`, `fixed` bawah.
- Ikon 20px + label `caption` (12px). Target sentuh ≥44px.
- **Aktif:** gradasi `sky-500 → sky-600`, teks & ikon putih, `aria-current="page"`.
- **Nonaktif:** `ink-600`; hover `parch-200`.
- **Fokus:** `:focus-visible` global (ring 3px `sky-500` + offset 2px).
- "Keluar" = `<form action={signOut}>` + `<button>` (bukan Link, tanpa active).
  Satu-satunya tombol Keluar; "Gabung" satu-satunya tautan `/join`.
- Ruang bawah: konten diberi `pb` setara tinggi bar (72px) hanya saat nav tampil
  (`md:` dinolkan), lewat shell di `layout.tsx`.
- Header atas halaman trip: nama trip + avatar (tidak ada tombol Keluar/gabung).

**Desktop:** nav atas horizontal + konten 2 kolom (itinerary kiri, ringkasan kas
kanan), sidebar 280px.

### 8.5 Chip & Badge

| Varian | Latar | Teks | Pemakaian |
|--------|-------|------|-----------|
| `chip-neutral` | `parch-200` | `ink-700` | Tag, filter tidak aktif |
| `chip-active` | `sky-100` | `sky-800` | Filter aktif |
| `badge-lunas` | `success-bg` | `success` | Status lunas |
| `badge-utang` | `danger-bg` | `danger` | Status berutang |
| `badge-pending` | `warning-bg` | `warning` | Belum dibayar |
| `badge-owner` | `gold-100` | `gold-700` | Penanda owner |

- Tinggi 24–28px, padding 8–10px, radius `radius-full`, teks `overline`.
- Selalu sertakan ikon pada badge status.

### 8.6 Avatar & Anggota

- Ukuran: 24 (di list), 32 (standar), 48 (profil), 64 (header trip).
- Bulat penuh, inisial nama (2 huruf) di atas warna deterministik dari palet
  teal/amber diganti sky/gold (hash nama → warna) agar konsisten per orang.
- Grup avatar bertumpuk (overlap -8px), maksimal 4 + "+3".
- Baris anggota: avatar, nama, badge role, dan (owner) menu aksi.

### 8.7 Baris Saldo & Saran Pelunasan

- **Kartu saldo:** `amount-lg` untuk saldo bersihmu, chip status, dan teks
  "Kamu harus menerima dari 2 orang".
- **Baris saran pelunasan:** `Budi → Andi` dengan panah ikon, nominal `amount`
  di kanan, tombol teks "Tandai lunas".
- Baris lunas: latar `success-bg` tipis, ikon centang, teks dicoret halus.
- Setelah lunas: baris pindah ke seksi "Sudah diselesaikan" (collapsed).

### 8.8 State Kosong & Muat

- **Empty state:** ikon ilustratif 64px (garis, warna `sky-300`), judul `h2`,
  satu kalimat `body`, satu tombol aksi. Contoh: "Belum ada rencana. Yuk bikin
  trip pertama kita!"
- **Skeleton:** blok `parch-200` dengan shimmer 1.4s, meniru bentuk kartu asli.
- **Error state:** ikon, pesan jelas, tombol "Coba lagi".
- **Toast:** muncul dari atas (HP) / kanan bawah (desktop), 3 detik, `shadow-md`,
  ikon status + teks pendek.

### 8.9 Modal & Konfirmasi

- Konfirmasi hapus: judul tegas, ringkasan item yang dihapus, tombol `danger`
  "Hapus" dan `ghost` "Batal".
- Modal desktop: tengah, lebar maks 480px, radius `radius-xl`.
- Fokus terperangkap di dalam modal; `Esc` menutup; fokus kembali ke pemicu.

---

## 9. Tata Letak & Breakpoint

| Breakpoint | Lebar | Tata letak |
|------------|-------|-----------|
| `sm` (HP) | 360–639 | 1 kolom, bottom tabs, FAB, bottom-sheet |
| `md` (tablet) | 640–1023 | 1 kolom lebar maks 640px, tabs atas |
| `lg` (desktop) | ≥1024 | 2 kolom, nav atas, tabel boleh muncul |
| `xl` | ≥1280 | Konten maks 1200px, margin auto |

**Aturan:**
- Lebar konten maks 640px di HP/tablet agar baris tidak terlalu panjang.
- `padding-bottom` konten = tinggi bottom tabs + safe area, agar tidak tertutup.
- Gunakan `env(safe-area-inset-bottom)` untuk perangkat berponi.
- Tabel hanya di `lg+`; di bawah itu selalu kartu.

---

## 10. Token Implementasi

### 10.1 CSS Variables

> **Sumber kebenaran:** `src/app/globals.css`. Nama kanonik adalah
> `sky`/`gold`/`parch`/`ink`/`coral`/`mint`; nama lama `lagoon`/`sunset`/`sand`/
> `slate` didefinisikan sebagai **alias** (`--lagoon-700: var(--sky-700)`) agar
> kelas lama tetap valid.

```css
:root {
  /* Sky (primary) */
  --sky-50:#EFF7FF; --sky-100:#D9EDFF; --sky-200:#BCE0FF; --sky-300:#8CCBFF;
  --sky-400:#55AEFF; --sky-500:#2B8FEF; --sky-600:#1668D6; --sky-700:#1250A8;
  --sky-800:#14428A; --sky-900:#163A72; --sky-950:#0E2549;

  /* Gold (accent) */
  --gold-50:#FFF9E8; --gold-100:#FFF0C4; --gold-300:#FFD666;
  --gold-500:#F5A524; --gold-600:#D08305; --gold-700:#A16207;

  /* Parchment (permukaan) */
  --parch-50:#FFFCF4; --parch-100:#FFF6E6; --parch-200:#FBEACF;
  --parch-300:#F1DCB6; --parch-400:#E0C493; --parch-500:#C0A470;

  /* Ink (teks & garis) */
  --ink-900:#22304D; --ink-700:#3B4B6E; --ink-600:#5A6A8C;
  --ink-500:#808EA8; --ink-300:#C6CFE0; --ink-100:#EDF1F8;

  /* Coral (bahaya/HP) & Mint (sukses/MP) */
  --coral-500:#E5484D; --coral-100:#FFE3E5;
  --mint-500:#0E9F6E;  --mint-100:#D6F6E9;

  /* Peran */
  --bg: var(--parch-50);
  --surface: #FFFEFB;
  --surface-2: var(--parch-100);
  --fg: var(--ink-900);
  --fg-muted: var(--ink-600);
  --border: var(--parch-300);
  --border-strong: var(--parch-400);
  --accent: var(--gold-500);
  --action: var(--sky-600);
  --action-hover: var(--sky-700);

  /* Semantik */
  --success: var(--mint-500);
  --success-bg: var(--mint-100);
  --danger: var(--coral-500);
  --danger-bg: var(--coral-100);
  --warning: var(--gold-700);
  --warning-bg: var(--gold-100);
  --info: var(--sky-600);
  --info-bg: var(--sky-100);

  /* Radius */
  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 18px;
  --radius-xl: 26px;
  --radius-full: 9999px;

  /* Bayangan */
  --shadow-xs: 0 1px 2px rgba(34, 48, 77, .08);
  --shadow-sm: 0 2px 6px rgba(34, 48, 77, .10);
  --shadow-md: 0 8px 20px rgba(22, 104, 214, .16);
  --shadow-lg: 0 -10px 30px rgba(34, 48, 77, .20);
  --shadow-panel: 0 2px 0 rgba(34,48,77,.14), 0 10px 22px rgba(34,48,77,.12);
  --shadow-panel-sky: 0 2px 0 rgba(14,37,73,.28), 0 12px 26px rgba(22,104,214,.28);

  /* Gerak */
  --motion-fast: 120ms;
  --motion-base: 200ms;
  --motion-slow: 300ms;
  --ease-standard: cubic-bezier(.2, .8, .2, 1);
  --ease-spring: cubic-bezier(.34, 1.56, .64, 1);
}
```

### 10.2 Tailwind v4 `@theme`

```css
@import "tailwindcss";

@theme inline {
  /* Kanonik */
  --color-sky-600: var(--sky-600);
  --color-sky-700: var(--sky-700);
  --color-gold-500: var(--gold-500);
  --color-parch-50: var(--parch-50);
  --color-parch-300: var(--parch-300);
  --color-ink-900: var(--ink-900);

  /* Alias nama lama */
  --color-lagoon-600: var(--sky-600);
  --color-lagoon-700: var(--sky-700);
  --color-sunset-500: var(--gold-500);
  --color-sand-50: var(--parch-50);
  --color-sand-300: var(--parch-300);

  --font-display: var(--font-rounded), ui-sans-serif, system-ui, sans-serif;
  --font-sans: var(--font-jakarta), ui-sans-serif, system-ui, sans-serif;
}
```

### 10.3 Font Loading (Next.js)

- `next/font/google` untuk **M PLUS Rounded 1c** (display) + **Plus Jakarta Sans**
  (body), `display: swap`, subset `latin`.
- Dipakai via CSS variable `--font-rounded` (display) dan `--font-jakarta` (body),
  yang lalu dipetakan ke `--font-display` / `--font-sans` di `@theme inline`.
- Preload hanya dua bobot utama (500, 700) untuk menghemat data di HP.

### 10.4 Utilitas "Jendela Game" (`@layer components`)

Kelas siap pakai untuk panel bergaya JRPG (didefinisikan di `globals.css`):

| Kelas | Fungsi |
|-------|--------|
| `.rpg-panel` | Panel kertas: `2px` border ink, radius `md`, `shadow-panel`, permukaan `--surface` |
| `.rpg-panel-sky` | Panel header: latar gradasi sky + teks putih + `shadow-panel-sky` |
| `.rpg-ribbon` | Pita emas (badge/judul kecil): gradasi gold + teks `ink-900` |
| `.rpg-btn` | Tombol bergaya game: tepi tebal + bayangan dasar solid (pressed turun) |
| `.rpg-corner` | Aksen sudut dekoratif untuk panel |

---

## 11. Aksesibilitas

| Kebutuhan | Aturan |
|-----------|--------|
| Kontras teks | Minimal 4.5:1 (body), 3:1 (≥18px bold / ikon) |
| Target sentuh | Minimal 44×44px, jarak antar target ≥8px |
| Fokus | Terlihat jelas: ring 2px `sky-500` + offset 2px |
| Keyboard | Semua aksi dapat dijangkau Tab; modal terperangkap fokus |
| Label | Semua input punya `<label>`; tombol ikon punya `aria-label` |
| Status | Tidak hanya warna — selalu ada ikon + teks |
| Zoom | Teks 16px di input agar iOS tidak auto-zoom |
| Gerak | Hormati `prefers-reduced-motion` |
| Bahasa | `lang="id"` di `<html>` |

---

## 12. Checklist Kualitas Sebelum Rilis

- [ ] Tidak ada scroll horizontal di 360px.
- [ ] Semua tombol ≥44px dan nyaman dijangkau ibu jari.
- [ ] Nominal uang memakai angka tabular dan format `Rp 1.250.000`.
- [ ] Status keuangan selalu punya ikon + teks, bukan hanya warna.
- [ ] Kontras teks lolos 4.5:1 (tombol `sky-600` + teks putih; teks di latar terang pakai `sky-700`).
- [ ] Bottom-sheet & FAB tidak menutupi konten (padding safe-area).
- [ ] Loading memakai skeleton, bukan layar kosong.
- [ ] Empty state punya ajakan aksi.
- [ ] Uji di Android + iPhone asli via preview Vercel.
- [ ] `prefers-reduced-motion` dihormati.
- [ ] Aset hanya SVG; tidak ada gambar raster besar.

---

*Dokumen ini adalah acuan visual KemanaKita. Setiap komponen baru harus memakai
token di sini, bukan nilai warna/ukuran lepas.*
