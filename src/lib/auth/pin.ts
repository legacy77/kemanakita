import { randomInt } from "node:crypto";

/**
 * Buat PIN 6 digit acak. Rentang 100000..999999 (tanpa leading zero) agar
 * panjang selalu 6. Server action memakai hasil ini sebagai password Supabase.
 */
export function generatePin(): string {
  return randomInt(100000, 1000000).toString();
}
