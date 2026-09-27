# Design Spec — Dashboard, Nav Bawah Mobile, dan Audit Keterbacaan

**Tanggal:** 27 September 2026
**Status:** Disetujui user (isi), menunggu review file
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
3. **Sebagian teks sulit dibaca.** Teks 12–13px dengan rasio 3.22:1
   (`ink-500` di kertas) dan 3.96:1 (putih/80 di panel biru) — di bawah
   ambang WCAG AA 4.5:1.

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

1. `getUser()` → tanpa sesi redirect `/login?next=/dashboard`.
2. `trip_members.select("trip_id").eq("user_id", user.id)` → daftar trip.
3. Daftar kosong → render kondisi kosong, **tanpa query lanjutan**
   (jangan kirim `.in("trip_id", [])`).
4. Dengan `.in("trip_id", ids)`: ambil `trips`, `expenses`, `expense_splits`,
   `profiles` (nama), `trip_members`.
5. Per trip: petakan ke `Expense[]` + `Transfer[]` (helper §4.2),
   `computeBalances` → net user per trip; `suggestSettlements` → baris pelunasan
   per trip (dengan label nama trip).

### 4.2 Helper bersama (baru, di `split-bill.ts`)

`/trips/[id]/page.tsx:161-176` kini memetakan baris DB ke `Expense[]` /
`Transfer[]` secara inline. Ekstrak dua fungsi murni agar dipakai kedua halaman:

```ts
export function toSplitExpenses(
  rows: { id: string; amount: number | string; paid_by: string; kind: string }[],
  splitsByExpense: Map<string, { user_id: string }[]>,
): Expense[];
export function toSettlementTransfers(
  rows: { id: string; amount: number | string; paid_by: string; kind: string }[],
  splitsByExpense: Map<string, { user_id: string }[]>,
): Transfer[];
```

Semantik = kode existing: hanya `kind !== "settlement"` yang jadi `Expense`
(participantIds kosong dibuang); settlement memetakan `paid_by → splits[0]`
(`to` kosong dibuang).

**Aturan wajib:** baris `kind = "settlement"` ikut dihitung via argumen
`settlements` di `computeBalances` (skema:
`supabase/migrations/20260926000000_init.sql:70-84`). `totalSpent` hanya
`kind = "expense"`.

### 4.3 Total lintas trip (logika display dashboard)

- `net(trip) = balances.get(userId) ?? 0` per trip (via `computeBalances`).
- `totalReceive = Σ max(0, net)`, `totalPay = Σ max(0, −net)`, `net = receive − pay`.
- Kartu 1: `net > 0` → "menerima"; `net < 0` → "bayar"; `net == 0` →
  `receive == 0` ? "Aman, lunas" : "Impas lintas trip".
- N orang dihitung dari pasangan unik pada baris saran yang melibatkan user.

---

## 5. Halaman `/dashboard` (`src/app/dashboard/page.tsx`)

Konten `max-w-2xl`, aman 360px.

| # | Kartu | Isi |
|---|---|---|
| 1 | Statusmu (`rpg-panel-sky`) | Angka net + subteks "dari N orang" / "ke N orang" |
| 2 | Tiga kotak ringkas | Total pengeluaran · Harus diterima · Harus dibayar; 3 kolom ≥`md`, 1 kolom <`md`; angka `tnum` |
| 3 | Saran pelunasan | "Budi → Kamu · Rp 150.000" + nama trip kecil; tanpa tombol |
| 4 | Trip aktif | Maks 4 terbaru + "Lihat semua →" ke `/trips` |
| 5 | Pengeluaran terbaru | 5 baris: judul, pembayar, nominal, nama trip |

Kondisi kosong per kartu: tanpa trip → kartu 1 & 3 diganti ajakan + tombol ke
`/trips`, kartu 2 disembunyikan (jangan tampilkan "Rp 0" tanpa penjelasan);
tanpa pengeluaran → kartu 2 = Rp 0 + keterangan; saran kosong → "Semua beres".

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

Batang `parch-100`, `border-top: 2px solid ink-900`, fixed bawah; aktif =
gradasi `sky` + putih + `aria-current="page"`; nonaktif `ink-600`. Tab 48px,
label 12px (turun ke 11px bila 360px mepet — jangan buang tab).
`padding-bottom: env(safe-area-inset-bottom)`. "Keluar" = `<form>` + `<button>`
(bukan Link). Hapus tombol "Keluar" header + tautan "Gabung" footer di
`trips-client.tsx`.

---

## 7. Kontras & Keterbacaan

| Lokasi | Sebelum | Sesudah |
|---|---|---|
| Teks di panel sky | `text-white/80` (3.96:1) | `text-white/90` (6.56:1) |
| Metadata 12–13px | `text-ink-500` (3.22:1) | `text-ink-600` (5.29:1) |
| `rpg-ribbon` 11px | `ink-900`/gold | ukur saat implementasi, sesuaikan bila <4.5:1 |

`text-[11px]` → `text-[12px]` untuk teks fungsional. Gradasi
`.rpg-panel-sky` tetap `sky-700 → sky-800`. Angka terverifikasi via skrip
luminans WCAG (bukan perkiraan).

---

## 8. Risiko & Pencegahan

Angka beda antar-halaman → fungsi bersama + settlement ikut dihitung + tes
mapper. Query tanpa filter → early-return saat ids kosong. Duplikasi aksi →
hapus tombol lama seiring pasang nav. Nav menutupi konten → padding bawah
`body`. Hydration → `usePathname` hanya untuk visibilitas/aktif.

---

## 9. Verifikasi

`typecheck` 0, `lint` 0, `test` lulus semua (86 existing + tes mapper baru),
`build` 0. Manual 360px: `/dashboard` kosong & berisi; `/trips`, `/trips/[id]`,
`/join` bernav; `/`, `/login` tanpa nav. Cross-check angka dashboard vs
`/trips/[id]` setelah satu pelunasan. Keluar via nav mengakhiri sesi.

---

## 10. File

**Baru:** `src/app/dashboard/page.tsx`, `src/app/mobile-nav.tsx`,
`docs/superpowers/specs/2026-09-27-dashboard-nav-design.md` (ini).

**Diubah:** `src/lib/split-bill.ts` (+2 helper), `src/lib/split-bill.test.ts`
(+tes mapper), `src/app/trips/[id]/page.tsx` (pakai helper, tampilan sama),
`src/app/layout.tsx` (+nav, +padding), `src/app/trips/trips-client.tsx`
(−duplikat), `src/app/globals.css` (kontras bila perlu),
`docs/design_system.md` (§8.4 + catatan kontras).
