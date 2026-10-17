import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

type User = { email: string; name: string; pin: string };
function env(name: string) { const x = readFileSync(".env.local", "utf8").split(/\r?\n/).find((v) => v.startsWith(`${name}=`)); if (!x) throw new Error(`${name} missing`); return x.slice(name.length + 1).replace(/^['"]|['"]$/g, "").trim(); }
const admin = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const A: User = { email: `e2e-rt-${id}-a@example.com`, name: `E2E-RT-A-${id}`, pin: "" };
const B: User = { email: `e2e-rt-${id}-b@example.com`, name: `E2E-RT-B-${id}`, pin: "" };
let tripId = "";

async function register(page: any, user: User) { await page.goto("/login?next=%2Ftrips"); await page.getByRole("tab", { name: /Daftar/ }).click(); await page.getByLabel("Nama").fill(user.name); await page.getByLabel("Email").fill(user.email); await page.getByRole("button", { name: /Daftar & dapat PIN/ }).click(); await expect(page.getByText("PIN Kamu")).toBeVisible(); user.pin = (await page.locator("p.font-display").textContent())!.trim(); }
async function login(page: any, user: User) { await page.goto("/login?next=%2Ftrips"); await page.getByLabel("Email").fill(user.email); await page.getByLabel(/PIN/).fill(user.pin); await page.getByRole("button", { name: "Masuk" }).click(); await expect(page).toHaveURL(/\/trips/); }
async function cleanupUser(email: string) { const { data } = await admin.auth.admin.listUsers({ perPage: 1000 }); const u = data.users.find((x) => x.email === email); if (u) await admin.auth.admin.deleteUser(u.id); }

test("T0.2 realtime propagates itinerary and expense to independent context", async ({ browser }) => {
  const ca = await browser.newContext(); const cb = await browser.newContext(); const a = await ca.newPage(); const b = await cb.newPage();
  try {
    await register(a, A); await login(a, A); await a.getByRole("button", { name: /Bikin trip baru/ }).click(); await a.getByLabel("Judul trip").fill(`E2E RT ${id}`); await a.getByLabel("Mulai").fill("2030-01-01"); await a.getByLabel("Selesai").fill("2030-01-02"); await a.getByRole("button", { name: /Bikin trip$/ }).click(); await expect(a).toHaveURL(/\/trips\//); tripId = a.url().split("/").pop()!;
    const href = await a.getByRole("link", { name: /WhatsApp/ }).getAttribute("href"); const code = new URL(href!).searchParams.get("text")!.match(/code=([^\s]+)/)![1];
    await register(b, B); await login(b, B); await b.goto(`/join?code=${code}`); await b.getByRole("button", { name: /Gabung trip ini/ }).click(); await expect(b).toHaveURL(new RegExp(`/trips/${tripId}`));
    await a.getByText("+ Tambah agenda di hari ini").click(); await a.getByLabel("Judul agenda").fill("RT Agenda"); await a.getByRole("button", { name: /Simpan agenda/ }).click(); await expect(b.getByText("RT Agenda")).toBeVisible({ timeout: 5000 });
    await a.getByText("+ Catat pengeluaran").click(); await a.getByLabel("Untuk apa").fill("RT Expense"); await a.getByLabel("Nominal (Rp)").fill("100000"); await a.getByRole("button", { name: /Simpan pengeluaran/ }).click(); await expect(b.getByText("RT Expense")).toBeVisible({ timeout: 5000 });
  } finally { await ca.close(); await cb.close(); if (tripId) await admin.from("trips").delete().eq("id", tripId); await cleanupUser(A.email); await cleanupUser(B.email); }
});
