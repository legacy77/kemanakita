# Design Spec — Dashboard, Nav Bawah Mobile, dan Audit Keterbacaan

**Tanggal:** 27 September 2026
**Status:** Disetujui user; direvisi setelah review teknis
**Rujukan:** `docs/PRD.md`, `docs/design_system.md`

> Koreksi teknis 27 Sep: modul saldo sudah ada di `src/lib/split-bill.ts`
> (`computeBalances`, `suggestSettlements`, `formatRupiah`, 21 tes) dan sudah
> dipakai `/trips/[id]`. Spec ini memakai ulang modul itu — TIDAK membuat
> modul saldo baru.

---

## 1. Latar & Masalah

1. **Tidak ada ringkasan personal.** User harus membuka trip satu per satu untuk
   tahu "saya harus bayar berapa dan ke siapa".
2. **Navigasi antar-halaman tercecer.** Tombol "Keluar" di header `/trips`,
   tautan "Gabung trip" di footer `/trips`. Tidak ada nav konsisten dalam
   jangkauan jempol.
3. **Sebagian teks sulit dibaca.** Teks 12–13px `ink-500` di kertas (3.22:1) —
   di bawah ambang WCAG AA 4.5:1. (`white/80` di panel sky terukur 5.53:1,
   jadi lolos; naik ke `/90` = 6.56:1 hanya pengerasan, bukan perbaikan
   pelanggaran.)

---

## 2. Ruang Lingkup

**Termasuk:** halaman `/dashboard` (tampilan saja); komponen `MobileNav`;
refactor kecil pemetaan expense→saldo jadi helper bersama + tes; perbaikan
kontras menyeluruh; hapus tombol duplikat di `/trips`.

**Tidak termasuk:** migration/RPC/tabel baru; aksi tulis di `/dashboard`;
grafik/filter/analitik; perubahan tampilan `/trips` dan `TabNav`.

---

## 3. Keputusan yang Sudah Disetujui

Dashboard = ringkasan utang/pengeluaran personal; halaman baru `/dashboard`
(`/trips` tetap); query langsung + agregasi server; tampilan saja; audit
kontras menyeluruh; nav tampil di `/dashboard`, `/trips`, `/trips/[id]`,
`/join` — sembunyi di `/` dan `/login`; isi nav = Dashboard, Trip, Gabung,
Keluar.

---

## 4. Arsitektur

### 4.1 Sumber data `/dashboard`

> **Batasan RLS (terverifikasi).** `profiles_select_own_or_comember`
> (`migrations/20260926000000_init.sql:182-192`) hanya mengizinkan baca profil
> yang **berbagi ≥1 trip** dengan viewer, dan `trip_members_select_comember`
> (`:218-220`) hanya baris trip yang viewer ikuti. Maka `profiles` dan
> `trip_members` **wajib di-scope per trip** — satu `.in("id", gabunganLintasTrip)`
> akan dikembalikan sebagian tanpa error (nama bisa hilang → fallback salah).

1. `getUser()` → tanpa sesi redirect `/login?next=/dashboard`.
2. `trip_members.select("trip_id").eq("user_id", user.id)` → daftar `tripIds`.
3. `tripIds` kosong → render kondisi kosong, **hentikan**; jangan jalankan query
   lanjutan apa pun (jangan kirim `.in("trip_id", [])`).
4. `trips.select("id, title, start_date, end_date").in("id", tripIds)`.
5. `expenses.select("id, trip_id, title, amount, paid_by, date, kind").in("trip_id", tripIds)`.
   `expenseIds = rows.map(e => e.id)`.
6. `expenseIds` kosong → lewati langkah 7 (jangan kirim `.in("expense_id", [])`).
   Pola existing memakai dummy UUID `["00000000-0000-0000-0000-000000000000"]`
   (`trips/[id]/page.tsx:127,148`); pola itu **sah** dan boleh dipakai, tetapi
   pilih satu gaya untuk seluruh file (dummy UUID **atau** skip) — jangan campur.
7. `expense_splits.select("expense_id, user_id, share_amount").in("expense_id", expenseIds)`.
8. **Per trip** (`for (const id of tripIds)`): `trip_members.select("user_id").eq("trip_id", id)`
   → `memberIds`; lalu `profiles.select("id, name").in("id", memberIds)`.
   Gabungkan hasil ke satu `Map<userId, name>` (nama sama di semua trip).
   N+1 ini **tidak dapat dihindari** tanpa RPC/tabel baru (ditolak §2) — catat di kode.
9. Per trip: petakan ke `Expense[]` + `Transfer[]` (helper §4.2),
   `computeBalances` → net user per trip; `suggestSettlements` → baris pelunasan
   per trip (dengan label nama trip).

### 4.2 Helper bersama (baru, di `split-bill.ts`)

`/trips/[id]/page.tsx:161-176` kini memetakan baris DB ke `Expense[]` /
`Transfer[]` secara inline. Ekstrak dua fungsi murni agar dipakai kedua halaman:

```ts
type ExpenseRow = { id: string; amount: number; paid_by: string; kind: "expense" | "settlement" };

export function toSplitExpenses(
  rows: ExpenseRow[],
  splitsByExpense: ReadonlyMap<string, { user_id: string }[]>,
): Expense[];
export function toSettlementTransfers(
  rows: ExpenseRow[],
  splitsByExpense: ReadonlyMap<string, { user_id: string }[]>,
): Transfer[];
```

Semantik **harus persis** kode existing (`trips/[id]/page.tsx:161-173`):

- `toSplitExpenses`: ambil `kind !== "settlement"`; `participantIds` =
  `splitsByExpense.get(id).map(s => s.user_id)`; buang baris dengan
  `participantIds.length === 0`; `amount = Math.round(Number(amount))`.
- `toSettlementTransfers`: ambil `kind === "settlement"`; **map dulu** menjadi
  `{ from: paid_by, to: splits[0]?.user_id ?? "", amount: Math.round(Number(amount)) }`,
  **baru** buang `to === ""`. Urutan map→filter ini wajib (kalau filter sebelum
  map, baris `to=""` bisa lolos dan mencemari saldo).
- `amount` bertipe `number` (supabase-js memparse `numeric` → number,
  `database.types.ts`); `Number(...)` tetap dipakai agar defensif terhadap
  `string` runtime.

**Aturan wajib:** baris `kind = "settlement"` ikut dihitung via argumen
`settlements` di `computeBalances` (skema:
`supabase/migrations/20260926000000_init.sql:70-84`). `totalSpent` (§4.3) hanya
`kind = "expense"`.

### 4.3 Angka personal lintas trip

Dihitung dari `net` **per trip** (`balances.get(userId) ?? 0` via
`computeBalances`), lalu diagregasi:

- `totalReceive = Σ max(0, net)`, `totalPay = Σ max(0, −net)`, `net = receive − pay`.
  (Karena `receive − pay ≡ Σ net`, `net == 0` **boleh** punya
  `receive == pay > 0` bila user berpiutang di satu trip dan berutang di trip lain
  — cabang "Impas lintas trip" **reachable**, bukan dead code.)
- `totalSpent` = **bagian user sendiri**, bukan total trip: untuk tiap expense
  `splitEvenly(amount, participantIds).get(userId) ?? 0`, dijumlah lintas trip.
  Ini berbeda dari `tripTotal` di `trips/[id]:178-180` (total seluruh trip).
- Kartu 1: `net > 0` → "menerima"; `net < 0` → "bayar"; `net == 0` →
  `totalReceive > 0 ? "Impas lintas trip" : "Aman, lunas"`.
- N orang = **partner unik**:
  `new Set(suggestions.flatMap(s => s.from === uid ? [s.to] : s.to === uid ? [s.from] : [])).size`.
  Label arah: `net > 0` → "dari N orang", `net < 0` → "ke N orang",
  `net == 0` → "ke N orang".

---

## 5. Halaman `/dashboard` (`src/app/dashboard/page.tsx`)

Konten `max-w-2xl`, aman 360px. Tambahkan `export const metadata = { title: "Dashboard — KemanaKita" }` mengikuti pola halaman server existing.

| # | Kartu | Isi |
|---|---|---|
| 1 | Statusmu (`rpg-panel-sky`) | Angka net + subteks "dari N orang" / "ke N orang" |
| 2 | Tiga kotak ringkas | Total pengeluaran · Harus diterima · Harus dibayar; 3 kolom ≥`md`, 1 kolom <`md`; angka `tnum` |
| 3 | Saran pelunasan | "Budi → Kamu · Rp 150.000" + nama trip kecil; tanpa tombol |
| 4 | Trip aktif | Maks 4 terbaru + "Lihat semua →" ke `/trips` |
| 5 | Pengeluaran terbaru | 5 baris: judul, pembayar, nominal, nama trip |

Kondisi kosong per kartu: tanpa trip → kartu 1 & 3 diganti ajakan
("Belum ada trip. Bikin atau gabung dulu, ya.") + tombol ke `/trips`,
kartu 2 disembunyikan (jangan tampilkan "Rp 0" tanpa penjelasan);
tanpa pengeluaran → kartu 2 = Rp 0 + keterangan "Belum ada pengeluaran";
saran kosong → "Semua beres 🎉".

Nama dari `profiles`, nominal via `formatRupiah`, tanpa `dangerouslySetInnerHTML`.

---

## 6. `MobileNav` (`src/app/mobile-nav.tsx`)

Client, `usePathname()`. Sembunyi bila `pathname === "/"` atau
diawali `/login`.

| Tab | Tujuan | Aktif saat |
|---|---|---|
| 🏠 Dashboard | `/dashboard` | prefix `/dashboard` |
| 🧭 Trip | `/trips` | prefix `/trips` |
| 🎟️ Gabung | `/join` | prefix `/join` |
| 🚪 Keluar | `signOut` (existing) | tidak pernah |

Batang `parch-100`, `border-top: 2px solid ink-900`, fixed bawah, **`md:hidden`**
(desktop tetap tanpa nav bawah, selaras design_system §9); aktif =
gradasi `sky` + putih + `aria-current="page"`; nonaktif `ink-600`. Tab ≥44px,
label 12px (turun ke 11px bila 360px mepet — jangan buang tab).
`padding-bottom: env(safe-area-inset-bottom)`. "Keluar" = `<form>` + `<button>`
(bukan Link, tanpa `aria-current`). Hapus tombol "Keluar" header + tautan
"Gabung" footer di `trips-client.tsx`.

**Ruang bawah:** `pb-16` halaman tidak cukup untuk bar 56–64px + safe-area.
`layout.tsx` menambahkan padding bawah ke `body` yang setara tinggi bar +
`env(safe-area-inset-bottom)` saat nav tampil (`md:` dinolkan kembali).

**Hidrasi:** `usePathname()` mengontrol visibilitas dan active state di client;
markup tetap deterministik sehingga tidak ada hydration mismatch. Nav boleh
terlihat sesaat sebelum pathname tersedia, tetapi tidak boleh mengubah layout
atau memicu query. Jangan pindahkan route ke route group — churn terlalu besar
untuk MVP.

---

## 7. Kontras & Keterbacaan

| Lokasi | Sebelum | Sesudah |
|---|---|---|
| Teks di panel sky | `text-white/80` (5.53:1, lolos — pengerasan) | `text-white/90` (6.56:1) |
| Metadata 12–13px | `text-ink-500` (3.22:1) | `text-ink-600` (5.29:1) |
| `rpg-ribbon` 11px | `ink-900`/gold | **lolos (6.44–9.43:1), tidak perlu ubah** |
| `ink-600` di permukaan | hanya aman di `parch-50`/`parch-100` | di atas `parch-200+` wajib `ink-700` |

`text-[11px]` → `text-[12px]` untuk teks fungsional. Gradasi
`.rpg-panel-sky` tetap `sky-700 → sky-800` (rasio aman di kedua ujung).
Angka terverifikasi via perhitungan luminans WCAG; **Todo 6 wajib memutakhirkan
`scripts/check-contrast.mjs` ke token baru** (`ink-500/600/900`,
`white/80/90`, `parch-*`, `sky-*`, gold) karena skrip kini masih berisi
token palet lama (`lagoon`/`sand`/`sunset`).

---

## 8. Risiko & Pencegahan

Angka beda antar-halaman → fungsi bersama + settlement ikut dihitung + **tes
paritas** (output helper `deepEqual` dengan pemetaan inline lama untuk fixture
campuran). Query tanpa filter → early-return saat `tripIds`/`expenseIds` kosong.
Scope RLS → `profiles`/`trip_members` di-fan-out per trip (bukan satu `.in`
lintas trip). Duplikasi aksi → hapus tombol lama seiring pasang nav. Nav
menutupi konten → padding bawah `body`. Hidrasi → `usePathname` hanya untuk
visibilitas/aktif, markup deterministik.

---

## 9. Verifikasi

`typecheck` 0, `lint` 0, `test` lulus semua (86 existing + tes mapper baru
**termasuk tes paritas helper vs inline**), `build` 0,
`node scripts/check-contrast.mjs` exit 0 (skrip sudah token-baru). Manual 360px:
`/dashboard` kosong & berisi; `/trips`, `/trips/[id]`, `/join` bernav;
`/`, `/login` tanpa nav **tanpa flicker**; nav `md:hidden` di desktop.
Cross-check angka dashboard vs `/trips/[id]` setelah satu pelunasan
(termasuk cabang "Impas lintas trip" bila data memungkinkan).
Keluar via nav mengakhiri sesi.

---

## 10. File

**Baru:** `src/app/dashboard/page.tsx`, `src/app/mobile-nav.tsx`,
`docs/superpowers/specs/2026-09-27-dashboard-nav-design.md` (ini).

**Diubah:** `src/lib/split-bill.ts` (+2 helper), `src/lib/split-bill.test.ts`
(+tes mapper + tes paritas), `src/app/trips/[id]/page.tsx` (pakai helper, tampilan sama),
`src/app/layout.tsx` (+nav + padding bawah), `src/app/trips/trips-client.tsx`
(−duplikat), `src/app/globals.css` (kontras bila perlu),
`scripts/check-contrast.mjs` (**wajib**: token baru),
`docs/design_system.md` (§8.4 → bottom tabs aktual `Dashboard | Trip | Gabung |
Keluar` + tinggi/warna sesuai implementasi; + catatan angka kontras).
