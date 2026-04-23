import { test as base, expect, Page } from "@playwright/test";

export type WpAdminFixtures = {
  wpAdmin: Page;
};

export const test = base.extend<WpAdminFixtures>({
  wpAdmin: async ({ page }, use) => {
    await page.goto("/wp-admin/");
    await expect(page.locator("#wpadminbar")).toBeVisible();
    await use(page);
  },
});

export { expect };
