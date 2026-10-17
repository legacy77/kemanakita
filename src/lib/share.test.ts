import assert from "node:assert/strict";
import test from "node:test";
import { buildShareMessage, truncateWhatsAppTitle, WHATSAPP_TITLE_MAX_LENGTH } from "./share.ts";

const cases = [
  ["judul kosong", "", "https://contoh.test/join?code=ABC", "Yuk gabung ke trip “” di KemanaKita: https://contoh.test/join?code=ABC"],
  ["judul dengan ampersand", "Trip A & B", "https://contoh.test/join?code=ABC", "Yuk gabung ke trip “Trip A & B” di KemanaKita: https://contoh.test/join?code=ABC"],
  ["judul dengan tanda kutip", 'Trip "Kita"', "https://contoh.test/join?code=ABC", 'Yuk gabung ke trip “Trip "Kita"” di KemanaKita: https://contoh.test/join?code=ABC'],
  ["judul emoji dan unicode", "🗺️ 東京", "https://contoh.test/join?code=ABC", "Yuk gabung ke trip “🗺️ 東京” di KemanaKita: https://contoh.test/join?code=ABC"],
  ["judul sangat panjang", `Trip ${"x".repeat(300)}`, "https://contoh.test/join?code=ABC", `Yuk gabung ke trip “Trip ${"x".repeat(300)}” di KemanaKita: https://contoh.test/join?code=ABC`],
  ["URL dengan ampersand dan sama dengan", "Trip Bandung", "https://contoh.test/join?code=A&B=1", "Yuk gabung ke trip “Trip Bandung” di KemanaKita: https://contoh.test/join?code=A&B=1"],
] as const;

test("buildShareMessage menghasilkan pesan persis", () => {
  for (const [name, title, url, expected] of cases) {
    assert.equal(buildShareMessage(title, url), expected, name);
  }
});

const truncationCases = [
  ["judul normal tidak berubah", "Trip Bandung", "Trip Bandung"],
  ["judul lebih pendek dari batas", "Trip", "Trip"],
  ["judul kosong", "", ""],
  ["emoji tepat di batas pemotongan", "a".repeat(WHATSAPP_TITLE_MAX_LENGTH - 1) + "😀", "a".repeat(WHATSAPP_TITLE_MAX_LENGTH - 1) + "😀"],
  ["string multi code unit (ZWJ) dipotong aman", "👨‍👩‍👧".repeat(WHATSAPP_TITLE_MAX_LENGTH), "👨‍👩‍👧".repeat(Math.floor(WHATSAPP_TITLE_MAX_LENGTH / Array.from("👨‍👩‍👧").length))],
  ["judul panjang dipotong tepat di batas", "b".repeat(WHATSAPP_TITLE_MAX_LENGTH + 50), "b".repeat(WHATSAPP_TITLE_MAX_LENGTH)],
] as const;

test("truncateWhatsAppTitle memotong per code point", () => {
  for (const [name, input, expected] of truncationCases) {
    const output = truncateWhatsAppTitle(input);
    assert.equal(output, expected, name);
    assert.equal(Array.from(output).length <= WHATSAPP_TITLE_MAX_LENGTH, true, `panjang ${name}`);
    assert.doesNotThrow(() => encodeURIComponent(buildShareMessage(output, "https://contoh.test/join?code=ABC")), `encode ${name}`);
  }
});
