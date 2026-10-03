// Logika antrean toast murni (tanpa DOM) — dipakai `src/components/toast.tsx`.
// Dipisah agar bisa diuji tanpa browser. design_system §8.8: toast 3 detik.

export type ToastKind = "success" | "error" | "info";

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  /** Waktu dibuat (ms, `Date.now()`), dipakai pruneExpired. */
  createdAt: number;
}

/** Toast hilang otomatis setelah 3 detik (design_system §8.8). */
export const TOAST_TTL_MS = 3000;

/** Maksimal toast tampil bersamaan; yang tertua dibuang. */
export const MAX_TOASTS = 3;

/** Tambah toast ke akhir antrean, buang yang tertua bila melebihi MAX_TOASTS. */
export function addToast(list: readonly Toast[], toast: Toast): Toast[] {
  const next = [...list, toast];
  return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
}

/** Hapus toast berdasarkan id (no-op bila tidak ada). */
export function removeToast(list: readonly Toast[], id: number): Toast[] {
  return list.filter((t) => t.id !== id);
}

/** Buang toast yang umurnya sudah melewati TTL. */
export function pruneExpired(
  list: readonly Toast[],
  now: number,
  ttlMs: number = TOAST_TTL_MS,
): Toast[] {
  return list.filter((t) => now - t.createdAt < ttlMs);
}
