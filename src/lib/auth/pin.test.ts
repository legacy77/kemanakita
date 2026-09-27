import { test } from "node:test";
import assert from "node:assert/strict";
import { generatePin } from "./pin.ts";
import { validatePin } from "../validate.ts";

// generatePin: unit yang memproduksi PIN untuk `createPinAccount`.
// 6 digit numerik, tanpa leading-zero issue (rentang 100000..999999).

test("generatePin: selalu 6 digit numerik", () => {
  for (let i = 0; i < 200; i += 1) {
    const pin = generatePin();
    assert.match(pin, /^\d{6}$/);
    assert.equal(validatePin(pin).ok, true);
  }
});
