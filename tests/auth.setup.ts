import { test as setup, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const AUTH_FILE = path.join(__dirname, "../playwright/.auth/admin.json");

setup("authenticate as admin", async ({ page }) => {
  const adminUser = process.env.WP_ADMIN_USER ?? "admin";
  const adminPassword = process.env.WP_ADMIN_PASSWORD ?? "admin123";

  await page.goto("/wp-login.php");
  await page.locator("#user_login").fill(adminUser);
  await page.locator("#user_pass").fill(adminPassword);
  await page.locator("#wp-submit").click();

  await expect(page).toHaveURL(/wp-admin/);
  await expect(page.locator("#wpadminbar")).toBeVisible();

  // Persist auth cookies so other tests skip login
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
});
