import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function env(name: string): string {
  const line = readFileSync(".env.local", "utf8").split(/\r?\n/).find((v) => v.startsWith(`${name}=`));
  if (!line) throw new Error(`${name} missing`);
  return line.slice(name.length + 1).replace(/^['"]|['"]$/g, "").trim();
}
const admin = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
type User = { email: string; name: string; pin: string };
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const A: User = { email: `e2e-${suffix}-a@example.com`, name: `E2E-A-${suffix}`, pin: "" };
const B: User = { email: `e2e-${suffix}-b@example.com`, name: `E2E-B-${suffix}`, pin: "" };
let tripId = "";
let before: Record<string, number> = {};
let after: Record<string, number> = {};
let usersGone = false;
let failure: string | undefined;
const log = (m: string) => console.log(`[T0.1] ${m}`);

async function step<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try { return await fn(); } catch (e) { failure ??= `${label}: ${(e as Error).message.split("\n")[0]}`; log(`FAILED STEP ${label}`); throw e; }
}
async function register(page: Page, user: User) {
  await page.goto("/login?next=%2Ftrips");
  await page.getByRole("tab", { name: /Daftar/ }).click();
  await page.getByLabel("Nama").fill(user.name);
  await page.getByLabel("Email").fill(user.email);
  await page.getByRole("button", { name: /Daftar & dapat PIN/ }).click();
  await expect(page.getByText("PIN Kamu")).toBeVisible();
  user.pin = (await page.locator("p.font-display").textContent())?.trim() ?? "";
  expect(user.pin).toMatch(/^\d{6}$/);
  log(`registered ${user.email}`);
}
async function login(page: Page, user: User) {
  await page.goto("/login?next=%2Ftrips");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel(/PIN/).fill(user.pin);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/\/trips/);
  log(`logged in ${user.email}`);
}
async function countRows(id: string): Promise<Record<string, number>> {
  const tables = ["trips", "trip_members", "itinerary_items", "expenses", "expense_splits"] as const;
  const out: Record<string, number> = {};
  for (const table of tables) {
    const q = admin.from(table).select("id", { count: "exact", head: true });
    const { count, error } = table === "trips" ? await q.eq("id", id) : await q.eq("trip_id", id);
    if (error) throw error;
    out[table] = count ?? 0;
  }
  return out;
}
async function userId(email: string): Promise<string | undefined> {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  return data.users.find((x) => x.email?.toLowerCase() === email.toLowerCase())?.id;
}
async function expense(page: Page, title: string, amount: string, payer: string) {
  await page.getByText("+ Catat pengeluaran").click();
  await page.getByLabel("Untuk apa").fill(title);
  await page.getByLabel("Nominal (Rp)").fill(amount);
  await page.getByLabel("Dibayar oleh").selectOption({ label: payer });
  await page.getByRole("button", { name: /Simpan pengeluaran/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "Pengeluaran tersimpan." }).first()).toBeVisible();
  log(`expense ${title} ${amount} paid by ${payer}`);
}

test.describe.serial("T0.1 two-account core loop", () => {
  test.afterAll(async () => {
    test.setTimeout(120_000);
    if (tripId) {
      before = await countRows(tripId);
      const { error } = await admin.from("trips").delete().eq("id", tripId);
      if (error) log(`TRIP DELETE ERROR ${error.message}`);
      after = await countRows(tripId);
    }
    const aId = await userId(A.email);
    const bId = await userId(B.email);
    for (const id of [aId, bId]) if (id) await admin.auth.admin.deleteUser(id);
    usersGone = !(await userId(A.email)) && !(await userId(B.email));
    const { data: malay } = await admin.from("trips").select("id,title").eq("title", "Malay");
    const { count: totalTrips } = await admin.from("trips").select("id", { count: "exact", head: true });
    const { count: totalUsers } = await admin.from("trip_members").select("id", { count: "exact", head: true });
    log(`cleanup userIds=${JSON.stringify({ A: aId, B: bId })}`);
    log(`cleanup rows before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);
    log(`cleanup usersRemoved=${usersGone}`);
    log(`production intact: Malay=${JSON.stringify(malay)} totalTrips=${totalTrips} totalTripMembers=${totalUsers}`);
    log(`failure=${failure ?? "none"}`);
    expect(after).toEqual({ trips: 0, trip_members: 0, itinerary_items: 0, expenses: 0, expense_splits: 0 });
    expect(usersGone).toBe(true);
    expect(malay?.length).toBe(1);
    expect(failure).toBeUndefined();
  });

  test("creates, joins, splits, settles, and cleans live data", async ({ browser }) => {
    const ca = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
    const cb = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
    const a = await ca.newPage(); const b = await cb.newPage();
    try {
      await step("register A", () => register(a, A));
      await step("login A", () => login(a, A));
      await step("create trip", async () => {
        await a.getByRole("button", { name: /Bikin trip baru/ }).click();
        await a.getByLabel("Judul trip").fill(`E2E Trip ${suffix}`);
        await a.getByLabel("Destinasi").fill("E2E City");
        await a.getByLabel("Mulai").fill("2030-01-01");
        await a.getByLabel("Selesai").fill("2030-01-03");
        await a.getByRole("button", { name: /Bikin trip$/ }).click();
        await expect(a).toHaveURL(/\/trips\/[0-9a-f-]{36}/);
        tripId = a.url().split("/trips/")[1].split("?")[0];
        log(`trip ${tripId}`);
      });
      let code = "";
      await step("share invite", async () => {
        const href = await a.getByRole("link", { name: /WhatsApp/ }).getAttribute("href");
        code = new URL(href!).searchParams.get("text")?.match(/code=([^\s]+)/)?.[1] ?? "";
        expect(code).toMatch(/^[0-9a-f]{12}$/);
        await a.getByRole("button", { name: /Bagikan undangan/ }).first().click();
        await expect(a).toHaveURL(new RegExp(`/trips/${tripId}`));
        const clip = await a.evaluate(() => navigator.clipboard.readText());
        expect(clip).toContain(`/join?code=${code}`);
        log(`invite code ${code}, clipboard ok, no self-navigation`);
      });
      await step("B previews invite", async () => {
        await b.goto(`/join?code=${code}`);
        await expect(b.getByRole("heading")).toContainText(`E2E Trip ${suffix}`);
        log("B saw trip preview from invite");
      });
      await step("register B", () => register(b, B));
      await step("login B", () => login(b, B));
      await step("B joins", async () => {
        await b.goto(`/join?code=${code}`);
        await b.getByRole("button", { name: /Gabung trip ini/ }).click();
        await expect(b).toHaveURL(new RegExp(`/trips/${tripId}`));
        log("B joined");
      });
      await step("itinerary A", async () => {
        await a.goto(`/trips/${tripId}?tab=itinerary`);
        await a.getByText("+ Tambah agenda di hari ini").first().click();
        await a.getByRole("article").first().getByLabel("Judul agenda").fill("E2E Agenda A");
        await a.getByRole("article").first().getByRole("button", { name: /Simpan agenda/ }).click();
        await expect(a.getByText("Agenda tersimpan.").first()).toBeVisible();
        log("A agenda saved");
      });
      await step("itinerary B", async () => {
        await b.goto(`/trips/${tripId}?tab=itinerary`);
        await b.getByText("+ Tambah agenda di hari ini").first().click();
        const bForm = b.locator("article").first().locator("details[open] form");
        await bForm.getByLabel("Judul agenda").fill("E2E Agenda B");
        await bForm.getByRole("button", { name: /Simpan agenda/ }).click();
        await expect(b.getByText("Agenda tersimpan.").first()).toBeVisible();
        log("B agenda saved");
      });
      await step("expense 1 even split (A pays 100.000)", async () => {
        await a.goto(`/trips/${tripId}?tab=keuangan`);
        await expense(a, "E2E Even", "100000", A.name);
        const rows = await countRows(tripId);
        expect(rows.expenses).toBe(1);
      });
      await step("expense 2 B pays 90.000", () => expense(a, "E2E Multi", "90000", B.name));
      await step("expense 3 A pays 60.000", () => expense(a, "E2E Edit", "60000", A.name));
      await step("balances match hand calculation", async () => {
        // 100.000 & 60.000 dibayar A, 90.000 dibayar B → A menalangi 160.000, B 90.000.
        // Total 250.000 dibagi rata 2 orang = 125.000/orang.
        // A = 160.000 - 125.000 = +35.000 (menerima). B = 90.000 - 125.000 = -35.000 (menanggung).
        await a.reload();
        await expect(a.getByText("Total patungan:")).toContainText("250.000");
        await expect(a.getByText(new RegExp(`${A.name}:.*menerima 35.000`))).toBeVisible();
        await expect(a.getByText(new RegExp(`${B.name}:.*menanggung 35.000`))).toBeVisible();
        log("balances A=+35.000 B=-35.000 verified");
      });
      await step("settlement suggestion", async () => {
        await expect(a.getByText("Saran transfer")).toBeVisible();
        await expect(a.getByText(new RegExp(`${B.name} → ${A.name}:.*35.000`))).toBeVisible();
        log("suggestion B→A 35.000 verified");
      });
      await step("mark as paid", async () => {
        await a.getByRole("button", { name: "Tandai lunas" }).click();
        await expect(a.getByText("Saran transfer")).toHaveCount(0);
        await expect(a.getByText(/Sudah diselesaikan/)).toBeVisible();
        await expect(a.getByText(new RegExp(`${A.name}:.*lunas`))).toBeVisible();
        await expect(a.getByText(new RegExp(`${B.name}:.*lunas`))).toBeVisible();
        const rows = await countRows(tripId);
        expect(rows.expenses).toBe(4);
        expect(rows.expense_splits).toBe(8);
        log("marked paid, both balances lunas, rows expenses=4 splits=8");
      });
    } finally { await ca.close().catch(() => {}); await cb.close().catch(() => {}); }
  });
});
