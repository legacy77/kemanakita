# Observability

## Sentry

Aplikasi memakai `@sentry/nextjs` `11.8.0` untuk menangkap error runtime client, server Node/Vercel Functions, dan error request Next.js. Client juga merekam performance trace terbatas (`tracesSampleRate: 0.1`) serta navigasi App Router.

Konfigurasi membaca `NEXT_PUBLIC_SENTRY_DSN`. Release memakai `NEXT_PUBLIC_SENTRY_RELEASE`, lalu `VERCEL_GIT_COMMIT_SHA` bila tersedia. Saat DSN kosong, SDK tidak mengirim event dan aplikasi tetap berjalan normal; tidak ada toast tambahan atau error tracking yang terlihat user.

Source map upload sengaja dimatikan. Bila diaktifkan, upload butuh `authToken`, `org`, dan `project` Sentry; `VERCEL_OIDC_TOKEN` bukan kredensial Sentry.

## Privasi

Parameter query URL, header HTTP, cookie, request body, dan identitas user dinonaktifkan melalui `dataCollection`. Nama route/transaction dan trace performance tetap direkam sesuai konfigurasi.

## Noise yang diabaikan

- `socket closed: 1000` — penutupan normal socket Supabase Realtime; kode penutupan lain tetap dikirim ke Sentry.
- `/favicon\\.ico/i` — request favicon hilang, bukan kegagalan aplikasi.

Untuk konteks request Sentry biasa, parameter query URL dihapus melalui `dataCollection.urlQueryParams: false`, sehingga `?code=` tidak dikumpulkan. Risiko residual tetap ada: exception yang memuat code undangan di message, stack, atau URL yang ditulis manual dapat membawanya; `beforeSend` meredaksinya sebagai pertahanan tambahan. Error input/lookup tetap terlihat user.

## Lokal

1. Install dependency:

```text
npm install
```

2. Salin `.env.example` ke `.env.local`.
3. Isi `NEXT_PUBLIC_SENTRY_DSN` dari project Sentry bila tracking diperlukan.
4. Opsional isi `NEXT_PUBLIC_SENTRY_RELEASE`; Vercel memakai `VERCEL_GIT_COMMIT_SHA` otomatis bila env release kosong.

Tanpa DSN, jalankan aplikasi seperti biasa. Jangan isi DSN di repository atau test output.

## Gap observability

- Belum ada error boundary aplikasi (`error.tsx`/global error boundary); sebagian error masih hanya menghasilkan UI error bawaan Next.js.
- Belum ada request logging terstruktur atau correlation/request ID untuk server action dan Vercel Functions.
- `console.error` masih dipakai pada beberapa alur server; belum terhubung ke log sink terstruktur.
