import { test } from "node:test";
import assert from "node:assert/strict";
import { trapTabIndex, keyToFocusIndex } from "./focus-trap.ts";

// ---------- trapTabIndex (Tab / Shift+Tab berputar) ----------

test("Tab dari elemen terakhir berputar ke pertama", () => {
  assert.equal(trapTabIndex(3, 2, false), 0);
});

test("Tab dari elemen tengah maju satu", () => {
  assert.equal(trapTabIndex(3, 0, false), 1);
});

test("Shift+Tab dari elemen pertama berputar ke terakhir", () => {
  assert.equal(trapTabIndex(3, 0, true), 2);
});

test("Shift+Tab dari elemen tengah mundur satu", () => {
  assert.equal(trapTabIndex(3, 2, true), 1);
});

test("trapTabIndex tanpa elemen fokus → null", () => {
  assert.equal(trapTabIndex(0, 0, false), null);
});

test("trapTabIndex satu elemen → tetap 0", () => {
  assert.equal(trapTabIndex(1, 0, false), 0);
  assert.equal(trapTabIndex(1, 0, true), 0);
});

// ---------- keyToFocusIndex (Home / End) ----------

test("Home memfokuskan elemen pertama", () => {
  assert.equal(keyToFocusIndex(3, "Home"), 0);
});

test("End memfokuskan elemen terakhir", () => {
  assert.equal(keyToFocusIndex(3, "End"), 2);
});

test("tombol lain → null (biarkan default browser)", () => {
  assert.equal(keyToFocusIndex(3, "ArrowDown"), null);
});

test("Home/End tanpa elemen → null", () => {
  assert.equal(keyToFocusIndex(0, "Home"), null);
  assert.equal(keyToFocusIndex(0, "End"), null);
});
