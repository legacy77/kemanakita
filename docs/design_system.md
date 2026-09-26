# Design System — KemanaKita

**Versi:** 1.0
**Tanggal:** 26 September 2026
**Status:** Acuan implementasi UI
**Rujukan:** `docs/PRD.md`

---

## 1. Arah Desain

### 1.1 Konsep

**"Coastal Notebook"** — nuansa buku catatan perjalanan pesisir: hangat, bersih,
dan ramah, tapi tetap rapi saat menampilkan angka uang.

Terinspirasi dari laut (teal) dan matahari terbenam (amber) tanpa jatuh ke
gradasi ungu-biru yang generik. Permukaan memakai **off-white hangat (sand)**
alih-alih putih murni, sehingga terasa seperti kertas dan mengurangi kelelahan
mata saat dipakai lama di HP.

### 1.2 Prinsip

1. **Mobile dulu, 360px adalah kanvas utama.** Desktop adalah bonus.
2. **Angka uang adalah bintang.** Nominal harus paling mudah dibaca di layar.
3. **Tenang, bukan ramai.** Satu aksi utama per layar, aksen amber dipakai hemat.
4. **Sekali lihat, paham.** Status utang/lunas harus terbaca tanpa berpikir.
5. **Sentuhan ramah.** Sudut membulat, ikon ramah, bahasa santai.

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
| **Display / Heading** | **Gabarito** (500/600/700) | Judul halaman, judul kartu, angka besar |
| **Body / UI** | **Plus Jakarta Sans** (400/500/600/700) | Paragraf, label, tombol, input |
| **Angka Uang** | Plus Jakarta Sans + `font-variant-numeric: tabular-nums` | Nominal, saldo, tanggal |
| Fallback mono | IBM Plex Mono (400/500) | Hanya jika `tabular-nums` tidak didukung |

> Alasan: Gabarito memberi karakter bulat-geometris yang ramah dan tidak
> generik; Plus Jakarta Sans menjaga keterbacaan teks panjang dan asal
> Indonesia. Angka uang wajib **tabular** agar kolom nominal tidak goyang.

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

- Judul trip → `display` (Gabarito 700)
- "Total kamu bayar" → `overline` + `amount-lg`
- Nama anggota → `body-strong`
- "Rp 1.250.000" → `amount` dengan `tabular-nums`

---

## 3. Warna

### 3.1 Palet Inti

**Lagoon (primary — teal laut)**

| Token | Hex | Pemakaian |
|-------|-----|-----------|
| `lagoon-50` | `#F0FDFA` | Latar chip lembut |
| `lagoon-100` | `#CCFBF1` | Latar badge, hover lembut |
| `lagoon-200` | `#99F6E4` | Border aksen |
| `lagoon-300` | `#5EEAD4` | Ikon di latar gelap |
| `lagoon-400` | `#2DD4BF` | Aksen gelap, grafik |
| `lagoon-500` | `#14B8A6` | Hover tombol |
| `lagoon-600` | `#0D9488` | **Warna merek** (isi tombol, ikon) |
| `lagoon-700` | `#0F766E` | **Teks/aksi utama** (aman kontras) |
| `lagoon-800` | `#115E59` | Tekanan tombol (pressed) |
| `lagoon-900` | `#134E4A` | Heading di tema gelap |
| `lagoon-950` | `#042F2E` | Latar tema gelap |

**Sunset (accent — amber)**

| Token | Hex | Pemakaian |
|-------|-----|-----------|
| `sunset-50` | `#FFFBEB` | Latar sorotan |
| `sunset-100` | `#FEF3C7` | Chip "belum lunas" |
| `sunset-300` | `#FCD34D` | Grafik, highlight |
| `sunset-500` | `#F59E0B` | **Aksen merek** (badge, tombol sekunder penting) |
| `sunset-600` | `#D97706` | Teks aksen di latar terang |
| `sunset-700` | `#B45309` | Teks peringatan |

**Sand (permukaan hangat)**

| Token | Hex | Pemakaian |
|-------|-----|-----------|
| `sand-50` | `#FDFBF7` | Latar halaman |
| `sand-100` | `#FAF6EF` | Kartu di atas halaman |
| `sand-200` | `#F2EBE0` | Kartu sekunder, input |
| `sand-300` | `#E6DCCC` | Border halus |
| `sand-400` | `#CFC2AC` | Border kuat, garis pemisah |
| `sand-500` | `#B0A088` | Placeholder, ikon nonaktif |

**Slate (teks & garis)**

| Token | Hex | Pemakaian |
|-------|-----|-----------|
| `slate-900` | `#0F172A` | Teks utama |
| `slate-700` | `#334155` | Teks sekunder kuat |
| `slate-600` | `#475569` | Teks sekunder |
| `slate-500` | `#64748B` | Metadata, ikon |
| `slate-300` | `#CBD5E1` | Garis pemisah |
| `slate-100` | `#F1F5F9` | Latar netral |

### 3.2 Warna Semantik

| Token | Hex | Arti | Pasangan |
|-------|-----|------|----------|
| `success` | `#15803D` | Lunas, saldo positif | ikon centang |
| `success-bg` | `#DCFCE7` | Latar status lunas | — |
| `danger` | `#B91C1C` | Hapus, saldo negatif | ikon tanda seru |
| `danger-bg` | `#FEE2E2` | Latar peringatan | — |
| `warning` | `#B45309` | Belum lunas, perlu aksi | ikon jam |
| `warning-bg` | `#FEF3C7` | Latar pending | — |
| `info` | `#0369A1` | Info, tips | ikon info |
| `info-bg` | `#E0F2FE` | Latar info | — |

**Aturan status keuangan (wajib ikon + teks, bukan warna saja):**

- Saldo **positif** (piutang) → `success` + ikon panah masuk + label "Harus menerima"
- Saldo **negatif** (utang) → `danger` + ikon panah keluar + label "Harus bayar"
- Saldo **nol** → `slate-500` + label "Aman, lunas"

### 3.3 Rasio Kontras (penting)

| Kombinasi | Rasio | Aman untuk |
|-----------|-------|-----------|
| `lagoon-700` di `sand-50` | 5.30:1 | Semua teks ✅ |
| `lagoon-600` di `sand-50` | 3.62:1 | Hanya teks besar / ikon |
| Putih di `lagoon-600` | 3.74:1 | Hanya teks besar ❌ untuk body |
| Putih di `lagoon-700` | 5.47:1 | Semua teks ✅ |
| `slate-900` di `sand-50` | 17.27:1 | Semua teks ✅ |
| `slate-500` di `sand-50` | 4.60:1 | Metadata ≥13px ✅ |
| `success` di `success-bg` | 4.57:1 | Badge lunas ✅ |
| `danger` di `danger-bg` | 5.30:1 | Badge utang ✅ |
| `warning` di `warning-bg` | 4.51:1 | Badge pending ✅ |
| `slate-900` di `sunset-500` | 8.31:1 | Tombol accent ✅ |
| `lagoon-800` di `lagoon-100` | 6.73:1 | Chip aktif ✅ |

> **Keputusan:** tombol utama memakai `lagoon-700` sebagai isi (bukan 600) agar
> teks putih aman di ukuran kecil. `lagoon-600` dipakai untuk ikon, border, dan
> area besar.

### 3.4 Gradasi & Tekstur (hemat)

- **Sea gradient** (header trip): `linear-gradient(135deg, #0F766E, #14B8A6)`
- **Sunset gradient** (kartu ringkasan, aksen): `linear-gradient(135deg, #F59E0B, #FB7185)`
- **Grain overlay**: SVG noise opacity 0.03 di atas header bergradasi saja.
- Gradasi **tidak** dipakai di latar form atau area angka (mengganggu baca).

---

## 4. Tema

### 4.1 Tema Terang (default)

| Peran | Token | Nilai |
|-------|-------|-------|
| Latar halaman | `bg` | `sand-50` |
| Permukaan | `surface` | `#FFFFFF` |
| Permukaan alternatif | `surface-2` | `sand-100` |
| Teks utama | `fg` | `slate-900` |
| Teks sekunder | `fg-muted` | `slate-600` |
| Border | `border` | `sand-300` |
| Border kuat | `border-strong` | `sand-400` |
| Aksen | `accent` | `sunset-500` |
| Aksi utama | `action` | `lagoon-700` |

### 4.2 Tema Gelap (v1.1, token sudah disiapkan)

| Peran | Nilai |
|-------|-------|
| `bg` | `#08110F` |
| `surface` | `#12201D` |
| `surface-2` | `#1A2C28` |
| `fg` | `#ECFDF5` |
| `fg-muted` | `#9DB5AE` |
| `border` | `#25403A` |
| `action` | `lagoon-400` (teks di atasnya gelap) |

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
| `shadow-xs` | `0 1px 2px rgba(15,23,42,.06)` | Kartu datar, input |
| `shadow-sm` | `0 2px 6px rgba(15,23,42,.08)` | Kartu standar |
| `shadow-md` | `0 6px 16px rgba(13,148,136,.12)` | Kartu terangkat, FAB |
| `shadow-lg` | `0 -8px 28px rgba(15,23,42,.16)` | Bottom sheet, modal |

> Bayangan bernuansa teal (`rgba(13,148,136,…)`) untuk elemen merek, netral untuk
> sisanya. Hindari bayangan hitam pekat.

### 5.4 Border

- Standar: `1px solid var(--border)`
- Kartu di latar sand: `1px solid var(--border)` + `shadow-sm`
- Fokus: `2px solid lagoon-600` dengan `outline-offset: 2px`

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

- **Logo:** wordmark "KemanaKita" (Gabarito 700) + ikon pin-lokasi yang
  membentuk tas ransel. Sediakan `logo.svg`, `logo-mark.svg`, `favicon.svg`.

---

## 8. Komponen

### 8.1 Tombol

| Varian | Latar | Teks | Border | Pemakaian |
|--------|-------|------|--------|-----------|
| `primary` | `lagoon-700` | putih | — | Aksi utama (1 per layar) |
| `secondary` | transparan | `lagoon-700` | `1px lagoon-600` | Aksi pendukung |
| `accent` | `sunset-500` | `slate-900` | — | Aksi penting keuangan |
| `ghost` | transparan | `slate-700` | — | Aksi tersier |
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
- Placeholder `sand-500`.
- **Fokus:** border `lagoon-600` + ring `2px` transparan teal.
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
- Kartu pengeluaran: kiri = ikon kategori dalam lingkaran `lagoon-50`;
  tengah = judul + "Dibayar Budi · 12 Okt"; kanan = `amount` + caption bagian
  ("bagianmu Rp50.000").

### 8.4 Navigasi

**Mobile (bottom tabs):** `Trip | Itinerary | Keuangan | Anggota`
- Tinggi 60px + safe-area inset bawah.
- Ikon 24px + label `caption`.
- Aktif: ikon & label `lagoon-700`, indikator pill di belakang ikon.
- Nonaktif: `slate-500`.
- Header atas: nama trip (bisa ditekan untuk ganti trip) + avatar.

**Desktop:** nav atas horizontal + konten 2 kolom (itinerary kiri, ringkasan kas
kanan), sidebar 280px.

### 8.5 Chip & Badge

| Varian | Latar | Teks | Pemakaian |
|--------|-------|------|-----------|
| `chip-neutral` | `sand-200` | `slate-700` | Tag, filter tidak aktif |
| `chip-active` | `lagoon-100` | `lagoon-800` | Filter aktif |
| `badge-lunas` | `success-bg` | `success` | Status lunas |
| `badge-utang` | `danger-bg` | `danger` | Status berutang |
| `badge-pending` | `warning-bg` | `warning` | Belum dibayar |
| `badge-owner` | `sunset-100` | `sunset-700` | Penanda owner |

- Tinggi 24–28px, padding 8–10px, radius `radius-full`, teks `overline`.
- Selalu sertakan ikon pada badge status.

### 8.6 Avatar & Anggota

- Ukuran: 24 (di list), 32 (standar), 48 (profil), 64 (header trip).
- Bulat penuh, inisial nama (2 huruf) di atas warna deterministik dari palet
  teal/amber (hash nama → warna) agar konsisten per orang.
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

- **Empty state:** ikon ilustratif 64px (garis, warna `lagoon-300`), judul `h2`,
  satu kalimat `body`, satu tombol aksi. Contoh: "Belum ada rencana. Yuk bikin
  trip pertama kita!"
- **Skeleton:** blok `sand-200` dengan shimmer 1.4s, meniru bentuk kartu asli.
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

```css
:root {
  /* Merek */
  --lagoon-50:  #F0FDFA;
  --lagoon-100: #CCFBF1;
  --lagoon-200: #99F6E4;
  --lagoon-300: #5EEAD4;
  --lagoon-400: #2DD4BF;
  --lagoon-500: #14B8A6;
  --lagoon-600: #0D9488;
  --lagoon-700: #0F766E;
  --lagoon-800: #115E59;
  --lagoon-900: #134E4A;
  --lagoon-950: #042F2E;

  --sunset-50:  #FFFBEB;
  --sunset-100: #FEF3C7;
  --sunset-300: #FCD34D;
  --sunset-500: #F59E0B;
  --sunset-600: #D97706;
  --sunset-700: #B45309;

  --sand-50:  #FDFBF7;
  --sand-100: #FAF6EF;
  --sand-200: #F2EBE0;
  --sand-300: #E6DCCC;
  --sand-400: #CFC2AC;
  --sand-500: #B0A088;

  /* Peran */
  --bg: var(--sand-50);
  --surface: #FFFFFF;
  --surface-2: var(--sand-100);
  --fg: #0F172A;
  --fg-muted: #475569;
  --border: var(--sand-300);
  --border-strong: var(--sand-400);
  --accent: var(--sunset-500);
  --action: var(--lagoon-700);
  --action-hover: var(--lagoon-800);

  /* Semantik */
  --success: #15803D;
  --success-bg: #DCFCE7;
  --danger: #B91C1C;
  --danger-bg: #FEE2E2;
  --warning: #B45309;
  --warning-bg: #FEF3C7;
  --info: #0369A1;
  --info-bg: #E0F2FE;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Bayangan */
  --shadow-xs: 0 1px 2px rgba(15, 23, 42, .06);
  --shadow-sm: 0 2px 6px rgba(15, 23, 42, .08);
  --shadow-md: 0 6px 16px rgba(13, 148, 136, .12);
  --shadow-lg: 0 -8px 28px rgba(15, 23, 42, .16);

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

@theme {
  --color-lagoon-50:  #F0FDFA;
  --color-lagoon-600: #0D9488;
  --color-lagoon-700: #0F766E;
  --color-sunset-500: #F59E0B;
  --color-sand-50:  #FDFBF7;
  --color-sand-300: #E6DCCC;

  --font-display: "Gabarito", ui-sans-serif, system-ui, sans-serif;
  --font-sans: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;

  --radius-lg: 16px;
  --shadow-md: 0 6px 16px rgba(13, 148, 136, .12);
}
```

### 10.3 Font Loading (Next.js)

- `next/font/google` untuk Gabarito + Plus Jakarta Sans, `display: swap`,
  subset `latin`, dipakai via CSS variable `--font-display` dan `--font-sans`.
- Preload hanya dua bobot utama (400, 700) untuk menghemat data di HP.

---

## 11. Aksesibilitas

| Kebutuhan | Aturan |
|-----------|--------|
| Kontras teks | Minimal 4.5:1 (body), 3:1 (≥18px bold / ikon) |
| Target sentuh | Minimal 44×44px, jarak antar target ≥8px |
| Fokus | Terlihat jelas: ring 2px `lagoon-600` + offset 2px |
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
- [ ] Kontras teks lolos 4.5:1 (cek tombol `lagoon-700`, bukan 600).
- [ ] Bottom-sheet & FAB tidak menutupi konten (padding safe-area).
- [ ] Loading memakai skeleton, bukan layar kosong.
- [ ] Empty state punya ajakan aksi.
- [ ] Uji di Android + iPhone asli via preview Vercel.
- [ ] `prefers-reduced-motion` dihormati.
- [ ] Aset hanya SVG; tidak ada gambar raster besar.

---

*Dokumen ini adalah acuan visual KemanaKita. Setiap komponen baru harus memakai
token di sini, bukan nilai warna/ukuran lepas.*
