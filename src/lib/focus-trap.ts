// Logika fokus-trap murni (tanpa DOM) — dipakai `src/components/confirm-dialog.tsx`.
// Dipisah agar perilaku Tab/Shift+Tab/Home/End bisa diuji tanpa browser.
// Rujukan: design_system §8.9 (fokus terperangkap di modal, Esc menutup).

/**
 * Hitung indeks elemen yang harus difokuskan saat Tab/Shift+Tab ditekan,
 * sehingga fokus berputar di dalam modal (tidak lolos ke halaman belakang).
 *
 * @param count     jumlah elemen yang bisa difokuskan
 * @param current   indeks elemen yang sedang fokus
 * @param backwards true bila Shift+Tab
 * @returns indeks tujuan, atau null bila tak ada elemen
 */
export function trapTabIndex(
  count: number,
  current: number,
  backwards: boolean,
): number | null {
  if (count <= 0) return null;
  return backwards ? (current - 1 + count) % count : (current + 1) % count;
}

/**
 * Indeks tujuan untuk Home/End di dalam modal.
 *
 * @returns indeks (0 atau count-1), atau null bila tombol lain / tak ada elemen
 */
export function keyToFocusIndex(count: number, key: string): number | null {
  if (count <= 0) return null;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}
