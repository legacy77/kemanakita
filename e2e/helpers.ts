import { expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function env(name: string): string {
  const line = readFileSync(".env.local", "utf8").split(/\r?\n/).find((x) => x.startsWith(`${name}=`));
  if (!line) throw new Error(`${name} missing from .env.local`);
  return line.slice(name.length + 1).trim().replace(/^['"]|['"]$/g, "");
}

export const supabaseAdmin = (): SupabaseClient => createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
});

export type Account = { email: string; name: string; pin: string; userId?: string };

export async function register(page: Page, account: Account): Promise<void> {
  await page.goto("/login?next=%2Ftrips");
  await page.getByRole("tab", { name: /Daftar/ }).click();
  await page.getByLabel("Nama").fill(account.name);
  await page.getByLabel("Email").fill(account.email);
  await page.getByRole("button", { name: /Daftar & dapat PIN/ }).click();
  await expect(page.getByText("PIN Kamu")).toBeVisible();
  account.pin = (await page.locator(".font-display").filter({ hasText: /^\d{6}$/ }).textContent())?.trim() ?? "";
  expect(account.pin).toMatch(/^\d{6}$/);
}

export async function login(page: Page, account: Account): Promise<void> {
  await page.goto("/login?next=%2Ftrips");
  await page.getByRole("tab", { name: /Masuk/ }).click();
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel(/PIN/).fill(account.pin);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/\/trips/);
}

export async function newContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
}

export async function rowCounts(admin: SupabaseClient, tripId: string) {
  const tables = ["trips", "trip_members", "itinerary_items", "expenses", "expense_splits"] as const;
  const counts = Object.fromEntries(await Promise.all(tables.map(async (table) => {
    const query = admin.from(table).select("id", { count: "exact", head: true });
    const { count, error } = table === "trips" ? await query.eq("id", tripId) : await query.eq("trip_id", tripId);
    if (error) throw error;
    return [table, count ?? 0] as const;
  })));
  return counts;
}

export async function deleteUserByEmail(admin: SupabaseClient, email: string): Promise<boolean> {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) return true;
  const result = await admin.auth.admin.deleteUser(user.id);
  if (result.error) throw result.error;
  return true;
}
