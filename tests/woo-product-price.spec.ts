/**
 * Covered: Essential Addons — Woo Product Price widget (Free)
 *
 * NOTE: Free widget. Requires WooCommerce active. The widget resolves the
 * product from the global $post, so the test URL must be a WC product
 * permalink (seeded by setup-woo-single-product-widgets-page.php).
 * The test product has regular price $99.99 and sale price $59.99.
 *
 * 1. Page health         — HTTP 200, no PHP errors, no JS errors
 * 2. Widget wrapper      — .eael-single-product-price renders per instance
 * 3. Price element       — .price renders with sale/regular amounts
 * 4. Currency symbol     — .woocommerce-Price-currencySymbol present
 * 5. Prefix text         — .prefix-price-text present/absent
 * 6. Suffix text         — .suffix-price-text present/absent
 * 7. Interaction         — hover triggers no JS errors
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.WOO_PRODUCT_PRICE_PAGE_SLUG ?? "product/ea-widget-test-product"}/`;

// ── DOM shape ─────────────────────────────────────────────────────────────
//
//   .{hook}
//     .eael-single-product-price
//       .prefix-price-text > span  ← only when show_prefix on + text type
//       .prefix-price-icon         ← only when show_prefix on + icon type
//       p.price                    ← from WC single-product/price.php
//         del > .woocommerce-Price-amount  ← regular price (struck through)
//         ins > .woocommerce-Price-amount  ← sale price
//       .suffix-price-text > span  ← only when show_suffix on + text type
//       .suffix-price-icon         ← only when show_suffix on + icon type

const wrapper    = (hook: string) => `.${hook} .eael-single-product-price`;
const priceEl    = (hook: string) => `.${hook} .eael-single-product-price .price`;
const salePrice  = (hook: string) => `.${hook} .eael-single-product-price .price ins .woocommerce-Price-amount`;
const regPrice   = (hook: string) => `.${hook} .eael-single-product-price .price del .woocommerce-Price-amount`;
const currency   = (hook: string) => `.${hook} .eael-single-product-price .woocommerce-Price-currencySymbol`;
const prefixText = (hook: string) => `.${hook} .eael-single-product-price .prefix-price-text`;
const suffixText = (hook: string) => `.${hook} .eael-single-product-price .suffix-price-text`;

async function openPage(page: Page) {
  await page.goto(PAGE_URL);
  const body = await page.content();
  if (
    body.includes("Fatal error") ||
    body.includes("Parse error") ||
    body.includes("WordPress database error")
  ) {
    throw new Error("PHP fatal/parse error detected on page load");
  }
}

function watchErrors(page: Page): string[] {
  const errs: string[] = [];
  page.on("pageerror", (e) => errs.push(e.message));
  return errs;
}

// ============================================================================
// 1. Page health
// ============================================================================

test.describe("Page health", () => {
  test("returns HTTP 200", async ({ page }) => {
    const res = await page.goto(PAGE_URL);
    expect(res?.status()).toBe(200);
  });

  test("no PHP fatal errors", async ({ page }) => {
    await openPage(page);
    await expect(page.getByText("Fatal error")).toHaveCount(0);
    await expect(page.getByText("Parse error")).toHaveCount(0);
  });

  test("no JavaScript errors on load", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});

// ============================================================================
// 2. Widget wrapper
// ============================================================================

test.describe("Widget wrapper", () => {
  const hooks = [
    "test-wpp-default",
    "test-wpp-prefix-text",
    "test-wpp-suffix-text",
    "test-wpp-reverse",
    "test-wpp-stacked",
  ];

  for (const hook of hooks) {
    test(`${hook}: .eael-single-product-price is attached`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrapper(hook)).first()).toBeAttached();
    });
  }
});

// ============================================================================
// 3. Price element renders
// ============================================================================

test.describe("Price element", () => {
  const hooks = [
    "test-wpp-default",
    "test-wpp-prefix-text",
    "test-wpp-suffix-text",
    "test-wpp-reverse",
    "test-wpp-stacked",
  ];

  for (const hook of hooks) {
    test(`${hook}: p.price is rendered`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(priceEl(hook)).first()).toBeAttached();
    });
  }

  test("test-wpp-default: sale price (ins) is rendered (product has sale price)", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(salePrice("test-wpp-default")).first()).toBeAttached();
  });

  test("test-wpp-default: regular price (del) is rendered alongside sale price", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(regPrice("test-wpp-default")).first()).toBeAttached();
  });
});

// ============================================================================
// 4. Currency symbol
// ============================================================================

test.describe("Currency symbol", () => {
  const hooks = ["test-wpp-default", "test-wpp-prefix-text", "test-wpp-suffix-text"];

  for (const hook of hooks) {
    test(`${hook}: .woocommerce-Price-currencySymbol is rendered`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(currency(hook)).first()).toBeAttached();
    });
  }
});

// ============================================================================
// 5. Prefix text
// ============================================================================

test.describe("Prefix text", () => {
  test("test-wpp-prefix-text: .prefix-price-text is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(prefixText("test-wpp-prefix-text")).first()).toBeAttached();
  });

  test("test-wpp-prefix-text: prefix contains 'Limited Time Offer'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(prefixText("test-wpp-prefix-text")).first()).toContainText(
      "Limited Time Offer"
    );
  });

  test("test-wpp-default: .prefix-price-text is absent when disabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(prefixText("test-wpp-default"))).toHaveCount(0);
  });
});

// ============================================================================
// 6. Suffix text
// ============================================================================

test.describe("Suffix text", () => {
  test("test-wpp-suffix-text: .suffix-price-text is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(suffixText("test-wpp-suffix-text")).first()).toBeAttached();
  });

  test("test-wpp-suffix-text: suffix contains 'Sales Ongoing'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(suffixText("test-wpp-suffix-text")).first()).toContainText(
      "Sales Ongoing"
    );
  });

  test("test-wpp-default: .suffix-price-text is absent when disabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(suffixText("test-wpp-default"))).toHaveCount(0);
  });
});

// ============================================================================
// 7. Interaction
// ============================================================================

test.describe("Interaction", () => {
  const hooks = [
    "test-wpp-default",
    "test-wpp-prefix-text",
    "test-wpp-suffix-text",
    "test-wpp-reverse",
    "test-wpp-stacked",
  ];

  for (const hook of hooks) {
    test(`${hook}: hover triggers no JS errors`, async ({ page }) => {
      const errs = watchErrors(page);
      await openPage(page);
      await page.locator(wrapper(hook)).first().hover();
      await page.waitForTimeout(150);
      expect(errs, errs.join(" | ")).toHaveLength(0);
    });
  }
});
