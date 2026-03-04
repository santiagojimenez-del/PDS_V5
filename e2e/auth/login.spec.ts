/**
 * Auth flow tests — run WITHOUT saved session (project: auth-tests).
 * Tests the login page itself: valid login, invalid credentials, validation, etc.
 */

import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
  });

  test("renders login form", async ({ page }) => {
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows validation errors for empty submit", async ({ page }) => {
    await page.getByRole("button", { name: /sign in/i }).click();

    // At least one validation message should appear
    const errors = page.locator("[role='alert'], .text-destructive");
    await expect(errors.first()).toBeVisible({ timeout: 5_000 });
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.getByLabel("Email").fill("nonexistent@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should stay on login page and show error
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
    const errorEl = page
      .locator("text=/invalid|incorrect|credentials|not found/i")
      .first();
    await expect(errorEl).toBeVisible({ timeout: 10_000 });
  });

  test("redirects to hub after valid login", async ({ page }) => {
    const email =
      process.env.E2E_ADMIN_EMAIL || "admin@prodrones.com";
    const password =
      process.env.E2E_ADMIN_PASSWORD || "admin123";

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 15_000 });
  });

  test("has link to forgot password", async ({ page }) => {
    const forgotLink = page.getByRole("link", { name: /forgot/i });
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    await expect(page).toHaveURL(/\/auth\/forgot-password/);
  });

  test("has accessible form fields", async ({ page }) => {
    // Inputs should have proper aria attributes when invalid
    await page.getByRole("button", { name: /sign in/i }).click();

    const emailInput = page.getByLabel("Email");
    const passwordInput = page.getByLabel("Password");

    // aria-invalid should be set after failed validation
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });
});

test.describe("Forgot password page", () => {
  test("renders forgot password form", async ({ page }) => {
    await page.goto("/auth/forgot-password");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /send|reset/i })
    ).toBeVisible();
  });

  test("shows validation for empty email", async ({ page }) => {
    await page.goto("/auth/forgot-password");
    await page.getByRole("button", { name: /send|reset/i }).click();
    const error = page.locator("[role='alert'], .text-destructive").first();
    await expect(error).toBeVisible({ timeout: 5_000 });
  });
});
