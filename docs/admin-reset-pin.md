# Reset PIN user (admin)

Login KemanaKita pakai **email + PIN 6 digit** (PIN = password Supabase user).
Kalau user lupa PIN, admin reset manual lewat Dashboard. Maks 20 user → aman manual.

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) → pilih project KemanaKita.
2. Menu **Authentication** → **Users**.
3. Pilih user berdasarkan email.
4. Klik menu `⋯` (kanan baris user) → **Reset password** / **Update password**.
5. Isi PIN baru **6 digit angka** (mis. `482913`) → **Update user**.
6. Pastikan **Email confirmed** tetap aktif (biar tidak perlu verifikasi email).
7. Kirim PIN baru ke user lewat jalur offline (WhatsApp/telepon langsung) — jangan email.
8. Minta user masuk di `/login` tab **Masuk** pakai email + PIN baru itu.

Catatan:
- Kolom `profiles.name` tidak berubah; hanya password (PIN) yang di-reset.
- Kalau user belum pernah daftar, minta dia daftar dulu di tab **Daftar**.
