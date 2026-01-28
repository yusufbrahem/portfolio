import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests with Playwright.
 * Run with: npm run test:e2e
 * Put E2E tests in the e2e/ directory (e.g. e2e/*.spec.ts).
 *
 * webServer: starts the Next.js dev server before tests (or reuses it when not in CI).
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
