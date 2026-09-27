// Cek rasio kontras token KemanaKita (docs/design_system.md §3.3, §10).
// Jalankan: node scripts/check-contrast.mjs
// Gerbang: kombinasi WAJIB (tombol utama = putih di sky-600, teks aksi, dst.)
// harus >= 4.5:1. Logika + token hidup di `src/lib/contrast.ts` (modul murni,
// diuji lewat `npm test`), sehingga skrip ini hanya menyajikan output.
//
// Catatan Node: modul `.ts` diimpor langsung (Node >= 22.6 strip-types).

import { runChecks, countFailures } from "../src/lib/contrast.ts";

const results = runChecks();

console.log("Kombinasi".padEnd(42), "Rasio".padStart(7), "  Min", "  Status");
console.log("-".repeat(72));

for (const r of results) {
  const status = r.ok ? "PASS" : r.required ? "FAIL" : "INFO";
  console.log(r.label.padEnd(42), r.ratio.toFixed(2).padStart(7), `  ${r.min}`, `  ${status}`);
}

const failed = countFailures(results);

if (failed > 0) {
  console.error(`\n${failed} kombinasi wajib gagal kontras.`);
  process.exit(1);
}
console.log("\nSemua kombinasi wajib lolos kontras.");
