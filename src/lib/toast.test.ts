import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addToast,
  removeToast,
  pruneExpired,
  TOAST_TTL_MS,
  MAX_TOASTS,
  type Toast,
} from "./toast.ts";

const t = (id: number, createdAt = 0, kind: Toast["kind"] = "info"): Toast => ({
  id,
  kind,
  message: `pesan ${id}`,
  createdAt,
});

test("addToast menambahkan ke akhir antrean", () => {
  const list = addToast([], t(1));
  assert.deepEqual(list.map((x) => x.id), [1]);
});

test("addToast membatasi jumlah toast (buang paling lama)", () => {
  let list: Toast[] = [];
  for (let i = 1; i <= MAX_TOASTS + 2; i++) list = addToast(list, t(i));
  assert.equal(list.length, MAX_TOASTS);
  assert.deepEqual(list.map((x) => x.id), [3, 4, 5]);
});

test("removeToast menghapus berdasarkan id", () => {
  const list = removeToast([t(1), t(2)], 1);
  assert.deepEqual(list.map((x) => x.id), [2]);
});

test("removeToast id tidak ada → daftar tak berubah", () => {
  const list = removeToast([t(1)], 99);
  assert.deepEqual(list.map((x) => x.id), [1]);
});

test("pruneExpired membuang toast yang melewati TTL", () => {
  const list = pruneExpired([t(1, 0), t(2, 1000)], TOAST_TTL_MS + 1);
  assert.deepEqual(list.map((x) => x.id), [2]);
});

test("pruneExpired menyisakan toast yang masih segar", () => {
  const list = pruneExpired([t(1, 0)], TOAST_TTL_MS - 1);
  assert.deepEqual(list.map((x) => x.id), [1]);
});

test("pruneExpired memakai TTL default 3000ms", () => {
  assert.equal(TOAST_TTL_MS, 3000);
  assert.deepEqual(pruneExpired([t(1, 0)], 3001), []);
});
