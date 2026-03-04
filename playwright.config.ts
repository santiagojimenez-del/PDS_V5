import { defineConfig, devices } from "@playwright/test";

/**
 * E2E test configuration.
 * Runs against the local dev server (port 3005).
 * Tests focus on critical user flows: auth, navigation, key CRUD.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",

  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 1 : 0,

  // Run tests sequentially in CI to avoid port conflicts
  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3005",

    // Capture trace on first retry for debugging
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Don't slow down — internal app runs on fast network
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },

  projects: [
    // Setup project — runs auth setup once, saves session state
    {
      name: "setup",
      testMatch: "**/auth.setup.ts",
    },

    // Main tests — run with saved auth session
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Reuse authenticated session from setup
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
      testIgnore: "**/auth.setup.ts",
    },

    // Auth tests — run WITHOUT saved session (tests login page itself)
    {
      name: "auth-tests",
      use: { ...devices["Desktop Chrome"] },
      testMatch: "**/auth/**/*.spec.ts",
    },
  ],

  // Start local dev server before tests
  webServer: {
    command: "npm run dev",
    url: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3005",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
