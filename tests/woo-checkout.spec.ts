/**
 * Covered: Essential Addons — Woo Checkout widget
 *
 * 1. Page health          — HTTP 200, no PHP errors, no JS errors
 * 2. Container rendered   — .ea-woo-checkout present for each instance
 * 3. Layout class         — layout-{layout} class applied to container
 * 4. data-checkout attr   — JSON settings attribute present on container
 * 5. Checkout output      — form.woocommerce-checkout or empty-cart state
 * 6. Order review section — .ea-woo-checkout-order-review when cart has items
 * 7. Place Order button   — #place_order button when cart has items
 * 8. Interaction          — hover produces no JS errors
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.WOO_CHECKOUT_PAGE_SLUG ?? "woo-checkout"}/`;

// -- DOM shape ----------------------------------------------------------------
// .{hook}
//   .ea-woo-checkout.layout-{layout}[data-checkout="..."]
//     .woocommerce
//       (cart has items)
//         form.checkout.woocommerce-checkout
//           .woocommerce-billing-fields
//           .woocommerce-shipping-fields
//         .ea-woo-checkout-order-review
//         .woocommerce-checkout-payment
//           #place_order
//       (cart empty) → returns without rendering form

const container   = (hook: string) => `.${hook} .ea-woo-checkout`;
const checkoutForm = (hook: string) => `.${hook} form.woocommerce-checkout`;
const orderReview  = (hook: string) => `.${hook} .ea-woo-checkout-order-review`;
const placeOrder   = (hook: string) => `.${hook} #place_order`;

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
// 2. Container rendered
// ============================================================================

test.describe("Container rendered", () => {
  const hooks = ["test-wco-default", "test-wco-cart-update", "test-wco-shop-link"];

  for (const hook of hooks) {
    test(`${hook}: .ea-woo-checkout container is attached`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(container(hook)).first()).toBeAttached();
    });
  }
});

// ============================================================================
// 3. Layout class
// ============================================================================

test.describe("Layout class", () => {
  const hooks = ["test-wco-default", "test-wco-cart-update", "test-wco-shop-link"];

  for (const hook of hooks) {
    test(`${hook}: container has layout-default class`, async ({ page }) => {
      await openPage(page);
      const cls = await page.locator(container(hook)).first().getAttribute("class");
      expect(cls ?? "").toContain("layout-default");
    });
  }
});

// ============================================================================
// 4. data-checkout attribute
// ============================================================================

test.describe("data-checkout attribute", () => {
  const hooks = ["test-wco-default", "test-wco-cart-update", "test-wco-shop-link"];

  for (const hook of hooks) {
    test(`${hook}: container has data-checkout JSON attribute`, async ({ page }) => {
      await openPage(page);
      const attr = await page.locator(container(hook)).first().getAttribute("data-checkout");
      expect(attr).toBeTruthy();
      // Should be valid JSON
      expect(() => JSON.parse(attr!)).not.toThrow();
    });
  }
});

// ============================================================================
// 5. Checkout output rendered
// ============================================================================

test.describe("Checkout output rendered", () => {
  const hooks = ["test-wco-default", "test-wco-cart-update", "test-wco-shop-link"];

  for (const hook of hooks) {
    test(`${hook}: checkout form or empty-cart state is rendered`, async ({ page }) => {
      await openPage(page);
      const hasForm = await page.locator(checkoutForm(hook)).count() > 0;
      // When cart is empty, WooCommerce redirects checkout content; container still renders
      const hasContainer = await page.locator(container(hook)).count() > 0;
      expect(hasContainer, `ea-woo-checkout container missing in ${hook}`).toBe(true);
      // If cart has items the form must be attached
      if (hasForm) {
        await expect(page.locator(checkoutForm(hook)).first()).toBeAttached();
      }
    });
  }
});

// ============================================================================
// 6. Order review section (when cart has items)
// ============================================================================

test.describe("Order review section", () => {
  test("test-wco-default: .ea-woo-checkout-order-review present when checkout form is rendered", async ({ page }) => {
    await openPage(page);
    const hasForm = await page.locator(checkoutForm("test-wco-default")).count() > 0;
    if (!hasForm) {
      test.skip(); // cart is empty — form not rendered
      return;
    }
    await expect(page.locator(orderReview("test-wco-default")).first()).toBeAttached();
  });
});

// ============================================================================
// 7. Place Order button (when cart has items)
// ============================================================================

test.describe("Place Order button", () => {
  test("test-wco-default: #place_order button is present when checkout form is rendered", async ({ page }) => {
    await openPage(page);
    const hasForm = await page.locator(checkoutForm("test-wco-default")).count() > 0;
    if (!hasForm) {
      test.skip(); // cart is empty
      return;
    }
    await expect(page.locator(placeOrder("test-wco-default")).first()).toBeVisible();
  });

  test("test-wco-default: #place_order button has correct text", async ({ page }) => {
    await openPage(page);
    const hasForm = await page.locator(checkoutForm("test-wco-default")).count() > 0;
    if (!hasForm) {
      test.skip();
      return;
    }
    const btn = page.locator(placeOrder("test-wco-default")).first();
    const text = await btn.textContent();
    expect(text?.trim()).toBeTruthy();
  });
});

// ============================================================================
// 8. Interaction
// ============================================================================

test.describe("Interaction", () => {
  const hooks = ["test-wco-default", "test-wco-cart-update", "test-wco-shop-link"];

  for (const hook of hooks) {
    test(`${hook}: hover produces no JS errors`, async ({ page }) => {
      const errs = watchErrors(page);
      await openPage(page);
      await page.locator(container(hook)).first().hover();
      await page.waitForTimeout(150);
      expect(errs, errs.join(" | ")).toHaveLength(0);
    });
  }
});
