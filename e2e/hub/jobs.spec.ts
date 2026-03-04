/**
 * Job workflow tests — run with saved admin session (project: chromium).
 * Covers the jobs list, kanban board, and basic job interactions.
 */

import { test, expect } from "@playwright/test";

test.describe("Jobs list", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/hub/workflow/jobs");
  });

  test("loads jobs page without redirecting to login", async ({ page }) => {
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  test("displays job content area", async ({ page }) => {
    // Should render something — kanban, table, or empty state
    await expect(page.locator("main, [role='main']").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("has page heading or breadcrumb for jobs", async ({ page }) => {
    // Either a heading or breadcrumb indicating we're on the jobs page
    const heading = page
      .locator("h1, h2, [aria-current='page']")
      .filter({ hasText: /jobs/i })
      .first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Job sites", () => {
  test("sites page loads", async ({ page }) => {
    await page.goto("/hub/workflow/sites");
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.locator("body")).not.toBeEmpty();
  });
});

test.describe("Recurring jobs", () => {
  test("recurring page loads", async ({ page }) => {
    await page.goto("/hub/workflow/recurring");
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.locator("body")).not.toBeEmpty();
  });
});
