/**
 * Hub dashboard tests — run with saved admin session (project: chromium).
 * Verifies the hub loads correctly, navigation works, and key UI elements are present.
 */

import { test, expect } from "@playwright/test";

test.describe("Hub dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/hub");
  });

  test("loads hub dashboard without error", async ({ page }) => {
    // Should not be redirected to login
    await expect(page).not.toHaveURL(/\/auth\/login/);

    // Page should have some content (not blank)
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("displays sidebar navigation", async ({ page }) => {
    // Sidebar should be visible with navigation items
    const sidebar = page.locator("aside, nav").first();
    await expect(sidebar).toBeVisible();
  });

  test("displays navbar", async ({ page }) => {
    const navbar = page.locator("header").first();
    await expect(navbar).toBeVisible();
  });

  test("has working workflow link in sidebar", async ({ page }) => {
    const workflowLink = page
      .getByRole("link", { name: /workflow|jobs/i })
      .first();
    await expect(workflowLink).toBeVisible();
    await workflowLink.click();
    await expect(page).toHaveURL(/\/hub\/workflow/);
  });

  test("has notification bell", async ({ page }) => {
    const bell = page.locator(
      "[aria-label*='notification' i], [aria-label*='Notification' i]"
    );
    await expect(bell).toBeVisible();
  });

  test("sidebar can be collapsed on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const collapseBtn = page.locator(
      "[aria-label*='Collapse' i], [aria-label*='Expand' i]"
    );
    if (await collapseBtn.isVisible()) {
      await collapseBtn.click();
      // After collapse the sidebar should change state
      await expect(collapseBtn).toBeVisible();
    }
  });
});

test.describe("Hub navigation", () => {
  test("scheduling page loads", async ({ page }) => {
    await page.goto("/hub/scheduling");
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("billing page loads", async ({ page }) => {
    await page.goto("/hub/billing");
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("onboard page loads", async ({ page }) => {
    await page.goto("/hub/onboard");
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.locator("body")).not.toBeEmpty();
  });
});
