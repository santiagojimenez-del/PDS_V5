/**
 * Client portal tests — run with saved admin session (project: chromium).
 * Admin can access client routes; verifies portal pages load correctly.
 */

import { test, expect } from "@playwright/test";

test.describe("Client portal", () => {
  test("client home loads without login redirect", async ({ page }) => {
    await page.goto("/client");
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("client sites list loads", async ({ page }) => {
    await page.goto("/client/sites");
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.locator("body")).not.toBeEmpty();
  });
});
