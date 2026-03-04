/**
 * Authentication setup — runs once before all tests.
 * Logs in with test credentials and saves the session to disk.
 * Other test files reuse this session via storageState.
 */

import { test as setup, expect } from "@playwright/test";
import path from "path";

const AUTH_FILE = path.join(__dirname, ".auth/user.json");

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/auth/login");

  // Fill credentials from env (never hardcode in source)
  const email = process.env.E2E_ADMIN_EMAIL || "admin@prodrones.com";
  const password = process.env.E2E_ADMIN_PASSWORD || "admin123";

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for redirect away from login (successful auth)
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 15_000 });

  // Save session state
  await page.context().storageState({ path: AUTH_FILE });
});
