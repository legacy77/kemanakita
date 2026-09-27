import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TOKENS,
  CHECKS,
  luminance,
  contrastRatio,
  runChecks,
  countFailures,
} from "./contrast.ts";

// ---------- matematika kontras (WCAG) ----------

test("contrastRatio: hitam-putih = 21:1, warna sama = 1:1", () => {
  assert.equal(contrastRatio("#000000", "#FFFFFF").toFixed(2), "21.00");
  assert.equal(contrastRatio("#1668D6", "#1668D6"), 1);
});

test("contrastRatio simetris (urutan fg/bg tidak penting)", () => {
  const a = contrastRatio("#1668D6", "#FFFCF4");
  const b = contrastRatio("#FFFCF4", "#1668D6");
  assert.equal(a.toFixed(6), b.toFixed(6));
});

test("luminance menolak hex tidak valid", () => {
  assert.throws(() => luminance("not-a-color"));
  assert.throws(() => luminance("#FFF"));
});

// ---------- token kanonik & alias ----------

test("TOKENS memuat palet kanonik JRPG Bright", () => {
  assert.equal(TOKENS["sky-600"], "#1668D6");
  assert.equal(TOKENS["gold-500"], "#F5A524");
  assert.equal(TOKENS["parch-50"], "#FFFCF4");
  assert.equal(TOKENS["ink-900"], "#22304D");
  assert.equal(TOKENS["coral-500"], "#E5484D");
  assert.equal(TOKENS["mint-500"], "#0E9F6E");
});

test("alias nama lama memetakan ke nilai kanonik (rasio tidak berubah)", () => {
  // lagoon → sky, sand → parch, sunset → gold, slate → ink
  assert.equal(TOKENS["lagoon-600"], TOKENS["sky-600"]);
  assert.equal(TOKENS["lagoon-700"], TOKENS["sky-700"]);
  assert.equal(TOKENS["sand-50"], TOKENS["parch-50"]);
  assert.equal(TOKENS["sunset-500"], TOKENS["gold-500"]);
  assert.equal(TOKENS["slate-900"], TOKENS["ink-900"]);
});

test("tidak ada token alias bernama lama di dalam CHECKS (skrip sudah token-baru)", () => {
  // CHECKS harus memakai nama kanonik; alias hanya untuk kompatibilitas kode lama.
  const LEGACY = /^(lagoon|sand|sunset|slate)-/;
  for (const check of CHECKS) {
    assert.ok(!LEGACY.test(check.fg), `fg lama: ${check.fg}`);
    assert.ok(!LEGACY.test(check.bg), `bg lama: ${check.bg}`);
  }
});

// ---------- gate: semua kombinasi WAJIB harus lolos ----------

test("semua kombinasi wajib (required) lolos kontras", () => {
  const failures = runChecks().filter((r) => r.required && !r.ok);
  assert.deepEqual(
    failures.map((f) => `${f.label} = ${f.ratio.toFixed(2)} < ${f.min}`),
    [],
  );
});

test("countFailures() = 0 (skrip check-contrast akan exit 0)", () => {
  assert.equal(countFailures(), 0);
});

test("setiap pasangan CHECKS merujuk token yang ada di TOKENS", () => {
  for (const check of CHECKS) {
    assert.ok(TOKENS[check.fg], `fg hilang: ${check.fg}`);
    assert.ok(TOKENS[check.bg], `bg hilang: ${check.bg}`);
  }
});

test("tombol utama (putih di sky-600) aman >= 4.5:1", () => {
  const ratio = contrastRatio(TOKENS["white"], TOKENS["sky-600"]);
  assert.ok(ratio >= 4.5, `rasio ${ratio.toFixed(2)} < 4.5`);
});
