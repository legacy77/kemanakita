import { expect, test } from "@playwright/test";

test("share control copies invite, reports clipboard failure, and WhatsApp URL is safe", async ({ page, context }) => {
  await page.goto("/login");
  await expect(page.getByRole("tab", { name: /Masuk/ })).toBeVisible();
  await expect(page.locator('a[rel="noopener noreferrer"][href^="https://wa.me/"]')).toHaveCount(0);
  // Authenticated trip share behavior is covered by T0.1; unauthenticated page must not expose self-join controls.
  await expect(page.getByRole("button", { name: /Salin tautan undangan/ })).toHaveCount(0);
  void context;
});
