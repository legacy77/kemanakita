// Cek rasio kontras token KemanaKita (docs/design_system.md §3.3).
// Jalankan: node scripts/check-contrast.mjs
// Gerbang M0: tombol utama = putih di lagoon-700 (harus >= 4.5:1).

const HEX = /^#[0-9a-fA-F]{6}$/;

function srgbToLinear(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  if (!HEX.test(hex)) throw new Error(`Bukan hex 6 digit: ${hex}`);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrast(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

const tokens = {
  "lagoon-600": "#0D9488",
  "lagoon-700": "#0F766E",
  "sand-50": "#FDFBF7",
  "slate-900": "#0F172A",
  "sunset-500": "#F59E0B",
  white: "#FFFFFF",
};

// [label, fg, bg, minimum, wajib]
const checks = [
  ["putih di lagoon-700 (tombol utama)", "white", "lagoon-700", 4.5, true],
  ["lagoon-700 di sand-50 (teks aksi)", "lagoon-700", "sand-50", 4.5, true],
  ["slate-900 di sand-50 (body)", "slate-900", "sand-50", 4.5, true],
  ["lagoon-600 di sand-50 (ikon/besar)", "lagoon-600", "sand-50", 3, false],
  ["slate-900 di sunset-500 (tombol accent)", "slate-900", "sunset-500", 4.5, true],
];

let failed = 0;
console.log("Kombinasi".padEnd(40), "Rasio".padStart(7), "  Min", "  Status");
console.log("-".repeat(70));

for (const [label, fg, bg, min, required] of checks) {
  const ratio = contrast(tokens[fg], tokens[bg]);
  const ok = ratio >= min;
  const status = ok ? "PASS" : required ? "FAIL" : "INFO";
  if (!ok && required) failed += 1;
  console.log(label.padEnd(40), ratio.toFixed(2).padStart(7), `  ${min}`, `  ${status}`);
}

if (failed > 0) {
  console.error(`\n${failed} kombinasi wajib gagal kontras.`);
  process.exit(1);
}
console.log("\nSemua kombinasi wajib lolos kontras.");
