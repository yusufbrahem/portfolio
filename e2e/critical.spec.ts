import { expect } from "@playwright/test";
import { test } from "@playwright/test";

test.describe("Public site", () => {
  test("public portfolio page loads without error", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle(/Create and share|Folio/i);
  });

  test("header is visible", async ({ page }) => {
    await page.goto("/");
    const header = page.getByRole("banner");
    await expect(header).toBeVisible();
    await expect(header.getByRole("link", { name: /Folio/i })).toBeVisible();
  });
});

test.describe("Admin login", () => {
  test("admin login works", async ({ page }) => {
    const email = process.env.E2E_ADMIN_EMAIL;
    const password = process.env.E2E_ADMIN_PASSWORD;
    test.skip(!email || !password, "E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD must be set");

    await page.goto("/admin/login");
    await expect(page.getByRole("heading", { name: /Admin Login/i })).toBeVisible();

    await page.getByLabel(/Email/i).fill(email);
    await page.getByLabel(/Password/i).fill(password);
    await page.getByRole("button", { name: /Login/i }).click();

    await expect(page).toHaveURL(/\/admin(?:\/|$)/, { timeout: 10000 });
  });
});
