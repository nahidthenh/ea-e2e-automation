import { test, expect } from "./fixtures/wp-admin";

// The page slug where the Creative Button widget is placed.
// Create a page in WP admin, build it with Elementor, drop the
// "Creative Button" widget from Essential Addons, then publish it.
const PAGE_SLUG = process.env.CREATIVE_BUTTON_PAGE_SLUG ?? "creative-button-demo";

test.describe("Creative Button widget", () => {
  test("plugin list shows EA and Elementor as active", async ({ wpAdmin }) => {
    await wpAdmin.goto("/wp-admin/plugins.php");

    const elementorRow = wpAdmin.locator('tr[data-slug="elementor"]');
    const eaRow = wpAdmin.locator(
      'tr[data-slug="essential-addons-for-elementor-lite"]'
    );

    await expect(elementorRow).toBeVisible();
    await expect(eaRow).toBeVisible();

    // Both must show a "Deactivate" link (meaning they are active)
    await expect(elementorRow.locator("a.deactivate, span.deactivate")).toBeVisible();
    await expect(eaRow.locator("a.deactivate, span.deactivate")).toBeVisible();
  });

  test("Creative Button page loads without errors", async ({ page }) => {
    const response = await page.goto(`/${PAGE_SLUG}/`);

    // Must not be a 404
    expect(response?.status()).not.toBe(404);

    // No PHP fatal errors on screen
    await expect(
      page.locator("text=Fatal error"),
      "Unexpected PHP fatal error on page"
    ).toHaveCount(0);
  });

  test("Creative Button widget is rendered on the page", async ({ page }) => {
    await page.goto(`/${PAGE_SLUG}/`);

    // Essential Addons renders Creative Button inside this wrapper
    const widget = page.locator(".eael-creative-button-wrapper").first();
    await expect(widget).toBeVisible();
  });

  test("Creative Button is clickable and has correct text", async ({ page }) => {
    await page.goto(`/${PAGE_SLUG}/`);

    const button = page
      .locator(".eael-creative-button-wrapper .eael-creative-button")
      .first();

    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();

    // Verify the button text is non-empty
    const label = await button.textContent();
    expect(label?.trim().length).toBeGreaterThan(0);
  });

  test("Creative Button hover state applies without JS errors", async ({
    page,
  }) => {
    const jsErrors: string[] = [];
    page.on("pageerror", (err) => jsErrors.push(err.message));

    await page.goto(`/${PAGE_SLUG}/`);

    const button = page
      .locator(".eael-creative-button-wrapper .eael-creative-button")
      .first();

    await button.hover();
    await page.waitForTimeout(300); // allow CSS transition to settle

    expect(jsErrors, `JS errors on hover: ${jsErrors.join(", ")}`).toHaveLength(0);
  });
});
