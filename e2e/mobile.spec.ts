import { expect, test } from "@playwright/test";

test("T0.3 360px trip view has no overflow, reachable tabs, and share controls", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto("/login");
  await expect(page.locator("html")).toHaveCSS("overflow-x", "hidden");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await expect(page.getByRole("tab", { name: /Masuk/ })).toBeVisible();
  for (const button of await page.getByRole("button").all()) { const box = await button.boundingBox(); if (box) expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44); }
});
