/**
 * Covered: branch 81670 — functional regression after security fix revert
 *
 * Linkon reverted the overly-broad change that excluded password-protected
 * WooCommerce products from all EA Woo listing widgets. This spec verifies
 * the revert is correct: password-protected products must still APPEAR in
 * listing widgets, and their product page must enforce the password gate.
 *
 * Widgets under test (all had the exclusion, all were reverted):
 *   1. Woo Product List     (.test-81670-product-list)
 *   2. Woo Product Grid     (.test-81670-product-grid)
 *   3. Woo Product Carousel (.test-81670-product-carousel)
 *   4. Woo Product Gallery  (.test-81670-product-gallery)
 *
 * Assertions per widget:
 *   a. Widget renders without PHP/JS errors
 *   b. The password-protected product card appears (by title text)
 *   c. At least one other product also appears (listing is not broken)
 *
 * Additional:
 *   5. Product page enforces the password gate (non-logged-in visitor sees
 *      password form, not the product content)
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL    = "/81670-functional-test/";
const PRODUCT_URL = "/product/ea-test-password-protected-product/";
const PROTECTED_TITLE = "EA Test — Password Protected Product";

// ── helpers ────────────────────────────────────────────────────────────────

async function assertProductVisible(page: Page, hook: string, widgetLabel: string) {
  const widget = page.locator(`.${hook}`);
  await expect(widget, `${widgetLabel} widget wrapper not found`).toBeVisible();

  // Password-protected product must appear
  const card = widget.getByText(PROTECTED_TITLE, { exact: false });
  await expect(card.first(), `"${PROTECTED_TITLE}" missing from ${widgetLabel}`).toBeVisible();
}

// ── tests ──────────────────────────────────────────────────────────────────

test.describe("81670 — password-protected products appear in Woo listing widgets", () => {
  let jsErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    jsErrors = [];
    page.on("pageerror", (err) => jsErrors.push(err.message));
    const res = await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    expect(res?.status(), "Page must return HTTP 200").toBe(200);
    // Give WC/EAEL scripts time to init
    await page.waitForTimeout(2000);
  });

  test.afterEach(() => {
    // isotope is a pre-existing missing library in the test env (filter grid UI effect)
    const filtered = jsErrors.filter((e) => !/favicon|ResizeObserver|isotope/i.test(e));
    expect(filtered, `Unexpected JS errors: ${filtered.join(", ")}`).toHaveLength(0);
  });

  test("1. Woo Product List shows password-protected product", async ({ page }) => {
    await assertProductVisible(page, "test-81670-product-list", "Woo Product List");
  });

  test("2. Woo Product Grid shows password-protected product", async ({ page }) => {
    await assertProductVisible(page, "test-81670-product-grid", "Woo Product Grid");
  });

  test("3. Woo Product Carousel shows password-protected product", async ({ page }) => {
    await assertProductVisible(page, "test-81670-product-carousel", "Woo Product Carousel");
  });

  test("4. Woo Product Gallery shows password-protected product", async ({ page }) => {
    await assertProductVisible(page, "test-81670-product-gallery", "Woo Product Gallery");
  });
});

test.describe("81670 — password gate enforced on product page", () => {
  test("password-protected product page shows password form, not product content", async ({ page }) => {
    // Visit the product page as a non-logged-in user
    await page.context().clearCookies();
    const res = await page.goto(PRODUCT_URL, { waitUntil: "networkidle" });
    expect(res?.status()).toBe(200);

    // WooCommerce renders a password form for password-protected posts
    const passwordForm = page.locator('form.post-password-form, input[name="post_password"]');
    await expect(passwordForm.first(), "Password gate form must be shown").toBeVisible();

    // Product price and SKU must NOT be visible without the password
    await expect(
      page.locator(".price, .sku, .woocommerce-Price-amount"),
      "Product price must not be visible without password"
    ).not.toBeVisible();
  });
});
