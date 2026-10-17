# Backup database

Backup penting karena Supabase Free dapat menjeda project setelah kira-kira satu minggu tanpa aktivitas. Script memakai `@supabase/supabase-js` yang sudah ada; tidak perlu install tool tambahan.

## Jalur utama: export tanpa install

Pastikan environment berisi URL dan service-role key. Jangan tulis nilainya ke repo atau log.

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL = "<Supabase URL>"
$env:SUPABASE_SERVICE_KEY = "<service-role key>"
npm run backup:db
```

Script membaca semua row dari enam tabel dengan pagination dan `count: exact`. Jika query error, count berubah, atau hasil tampak terpotong pada batas API, script gagal dan tidak mengklaim backup lengkap.

Output default berada di:

```text
C:\Users\Dhika\AppData\Local\Temp\opencode\kemanakita-backup\kemanakita-<timestamp>\
```

Bundle berisi:

- `data.json`: row lengkap, nama tabel, dan nama kolom; urutan tabel mengikuti foreign key.
- `schema/*.sql`: salinan migration dari `supabase/migrations/`, yaitu DDL schema.

Output mencetak path, ukuran, row count per tabel, dan sanity check baseline dokumen (3 profiles, 1 trip bernama `Malay`). Bila data live sudah berubah — mis. ada user/trip tambahan dari uji manual — script hanya mencetak `PERINGATAN` dan tetap exit 0, karena backup-nya lengkap sesuai isi database saat itu. Perbedaan itu perlu dicatat di laporan, bukan diperlakukan sebagai kegagalan backup. Service key tidak pernah dicetak atau disimpan ke bundle.

## Bersihkan sisa uji E2E

Test lane E2E menulis ke project live. Bila run terhenti sebelum teardown, akun dan trip sisa tetap tertinggal. Script `scripts/cleanup-e2e.mjs` menghapus sisa tersebut secara idempoten:

```powershell
npm run cleanup:e2e
```

Predikat yang dipakai (dibaca ulang dari database saat eksekusi, bukan daftar id hardcode):

- `profiles.name` diawali `E2E-`
- email Auth diawali `e2e-`
- `trips.title` diawali `E2E Trip`, beserta row turunan yang dapat dijangkau dari trip tersebut

Guard: setiap row diverifikasi ulang tepat sebelum dihapus (delete harus mengenai tepat 1 row), profile/trip terlindungi ditolak, dan E2E profile harus berpasangan dengan Auth user `e2e-` (begitu pula sebaliknya). Bila ada yang ambigu, script berhenti dengan exit non-zero tanpa menebak. Urutan hapus mengikuti FK: `expense_splits` → `expenses` → `itinerary_items` → `trip_members` → `trips` → `profiles` → Auth user. Tanpa kandidat, script hanya mencetak ringkasan dan exit 0. Service key tidak pernah dicetak.

Data yang TIDAK boleh tersentuh (trip `Malay`, tiga user baseline, `Budi`, trip `Singapore Malay 4D3N`) tidak memenuhi predikat di atas, sehingga aman dari sweep.

## Restore bundle ke project baru

Data-only restore bukan one-click restore. `profiles.id` mereferensikan `auth.users.id`; project baru tidak memiliki user Auth dengan ID sama, sehingga restore profiles saja menghasilkan orphaned profiles atau gagal karena foreign key.

1. Buat project Supabase baru.
2. Recreate Auth users terlebih dahulu dengan ID yang sama seperti user sumber, melalui proses Admin/Auth yang aman dan sesuai kebijakan Supabase.
3. Jalankan seluruh file `schema/*.sql` sesuai urutan nama file menggunakan SQL Editor atau `psql` ke project baru.
4. Import `data.json` memakai script/admin tool yang memetakan `tables.<nama>.columns` dan `tables.<nama>.rows`, dalam urutan: `profiles`, `trips`, `trip_members`, `itinerary_items`, `expenses`, `expense_splits`.
5. Verifikasi RLS, trigger, function, Realtime, Auth settings, dan jumlah row.

Bundle ini tidak memulihkan password, session, provider identity, email verification state, storage objects, project settings, atau konfigurasi Auth. Jangan masukkan service key ke file backup.

## Jalur upgrade: pg_dump atau Supabase CLI

Jika tool tersedia dan service key/URL belum diatur, script memakai fallback:

```powershell
$env:DATABASE_URL = "<connection string PostgreSQL>"
npm run backup:db
```

Atau:

```powershell
$env:SUPABASE_PROJECT_REF = "<project ref>"
supabase login
npm run backup:db
```

Fallback menghasilkan SQL di folder backup. Jalur utama tetap disarankan karena tidak membutuhkan binary eksternal.

## Credential dan durability

- Jangan commit database URL, password, service key, access token, atau connection string.
- Simpan secret melalui environment/secret manager; hapus environment variable setelah selesai.
- Simpan backup di luar repo dan batasi akses file.
- `updateExpense` masih melakukan operasi berurutan dengan race window dan kemungkinan state parsial.
- `get_trip_by_invite` tetap PUBLIC `SECURITY DEFINER` sebagai residual risk yang diterima docs.
- Revoke EXECUTE pada `handle_new_user` tercatat sebagai hardening live; pertahankan saat restore.
