import { test } from "node:test";
import assert from "node:assert/strict";
import { debounce } from "./realtime.ts";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

test("panggilan cepat beruntun coalesce jadi 1", async () => {
  let n = 0;
  const d = debounce(() => n++, 15);
  d();
  d();
  d();
  await sleep(50);
  assert.equal(n, 1);
});

test("panggilan terpisah > delay jadi 2", async () => {
  let n = 0;
  const d = debounce(() => n++, 15);
  d();
  await sleep(50);
  d();
  await sleep(50);
  assert.equal(n, 2);
});

test("cancel() membatalkan panggilan terjadwal", async () => {
  let n = 0;
  const d = debounce(() => n++, 15);
  d();
  d.cancel();
  await sleep(50);
  assert.equal(n, 0);
});
