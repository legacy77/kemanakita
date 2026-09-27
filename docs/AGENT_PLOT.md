# Plot Subagent — KemanaKita MVP

> TODO: `docs/TODO.md` · Spec: `docs/PRD.md` · Visual: `docs/design_system.md`
> Lokasi agen: project-lokal `.opencode/agents/` (projectmanager, frontend) + global (`developer`, `analyst`, `tester`, `architect`, `debugger`, `security`, `reviewer`).

## Roster

| Agen | Sumber | Peran | Kapan turun |
|------|--------|-------|-------------|
| `projectmanager` | lokal | Pecah tugas, sequence, gate milestone | Awal tiap milestone + gate akhir |
| `analyst` | global config | Jawab open question PRD §12, klarifikasi spek | M0 saja (guest-mode, kategori) |
| `developer` | global | Backend/logika: Supabase, RLS, split-bill, server actions | M1, M2, M4-logika |
| `frontend` | lokal | Semua UI mobile-first + token | M0-token, M2–M5 UI |
| `tester` | global config | Unit test split-bill, RLS test, E2E manual §10.1 | Akhir M1, M4, M5, M6 |
| `reviewer` | global config | Gate kualitas tiap milestone | Akhir tiap milestone |
| `security` | global | Audit RLS, service key server-only, validasi server | M1, M2, M6 |
| `architect`/`debugger` | global | On-call: arsitektur buntu / bug | Bila diminta PM saja |

## Alur per milestone

```text
PM buka milestone → brief + kriteria gate (dari TODO)
  → analyst (hanya M0) → developer / frontend kerja
  → tester verifikasi → security (M1/M2/M6) → reviewer gate
  → PM centang TODO → milestone berikut
```

| Milestone | Urutan agen | Gate |
|-----------|-------------|------|
| M0 | analyst → PM → frontend (token) → reviewer | Kontras `lagoon-700` lolos, font jalan |
| M1 | PM → developer (skema+RLS) → tester (RLS) → security → reviewer | Migrasi bersih, RLS hijau |
| M2 | PM → developer (auth/invite) → frontend (login/trips/join) → tester → security → reviewer | 2 akun join via link |
| M3 | PM → developer (CRUD+realtime) → frontend (tab+sheet) → tester → reviewer | Urutan benar, edit bareng jalan |
| M4 | PM → developer (split-bill) → tester (unit test wajib) → frontend (tab Keuangan) → reviewer | Saldo & saran benar |
| M5 | PM → frontend → tester (HP asli) → reviewer | Checklist design_system §12 |
| M6 | PM → developer (env/deploy) → tester (E2E §10.1) → security → reviewer | E2E hijau di production |

## Aturan paralel

- Boleh paralel: `developer` (logika) + `frontend` (UI) beda file; `tester` tulis test sambil implementasi jalan.
- Wajib sekuensial: sentuh file sama; `reviewer`/`security` setelah kerja selesai; `PM gate` terakhir.
- Maks 1 implementer per file dalam satu waktu. Jangan dispatch 2 agen ke file sama paralel.

## Format dispatch (wajib)

Setiap dispatch ke subagent bawa: (1) milestone + task TODO; (2) file target eksplisit; (3) nilai exact dari PRD/design_system (hex, nama tabel/kolom, path); (4) kriteria done; (5) larangan (no secret, no non-goal). Terima: status, commit, hasil test, concern.

## Eskalasi

Bug → `debugger` (repro + root cause + fix minimal). Temuan security → fix dulu, milestone tidak lanjut. Plan cacat total → stop, tanya user.
