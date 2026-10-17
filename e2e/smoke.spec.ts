import { test, expect } from "@playwright/test";

test.describe("public smoke", () => {
  test("login and join pages render without navigation regressions", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading")).toContainText("Masuk");
    await page.goto("/join?code=INVALID");
    await expect(page).toHaveURL(/\/join\?code=INVALID/);
    await expect(page.getByRole("heading")).toBeVisible();
  });
});
