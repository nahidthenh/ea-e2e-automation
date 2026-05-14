/**
 * Covered: Essential Addons — Woo Add To Cart widget (Free)
 *
 * NOTE: Free widget. Requires WooCommerce active. The widget resolves the
 * product from the global $post, so the test URL must be a WC product
 * permalink (seeded by setup-woo-single-product-widgets-page.php).
 *
 * 1. Page health          — HTTP 200, no PHP errors, no JS errors
 * 2. Widget wrapper       — .eael-single-product-add-to-cart renders per instance
 * 3. Inner wrapper        — .eael-add-to-cart-wrapper with product-type class
 * 4. Product data attrs   — data-product-id and data-product-type always present
 * 5. AJAX attribute       — data-eael-ajax-add-to-cart present only when enabled
 * 6. Layout class         — eael-add-to-cart--layout-{row|column} on widget container
 * 7. Add to cart output   — WC add-to-cart form or button rendered inside wrapper
 * 8. Interaction          — hover triggers no JS errors
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.WOO_ADD_TO_CART_PAGE_SLUG ?? "product/ea-widget-test-product"}/`;

// ── DOM shape ─────────────────────────────────────────────────────────────
//
//   .{hook}  ← elementor widget container; also carries prefix_class
//     .eael-single-product-add-to-cart
//       .eael-add-to-cart-wrapper.eael-product-{type}
//         [data-product-id="{id}"]
//         [data-product-type="{type}"]
//         [data-eael-ajax-add-to-cart="yes"]   ← only when AJAX enabled
//         .woocommerce-notices-wrapper
//         form.cart  (WC simple-product template)
//           .quantity > input.qty
//           button.single_add_to_cart_button

const outer   = (hook: string) => `.${hook} .eael-single-product-add-to-cart`;
const wrapper = (hook: string) => `.${hook} .eael-add-to-cart-wrapper`;

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
    "test-watc-default",
    "test-watc-column",
    "test-watc-no-qty",
    "test-watc-no-icon",
    "test-watc-ajax",
    "test-watc-custom-text",
  ];

  for (const hook of hooks) {
    test(`${hook}: .eael-single-product-add-to-cart is attached`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(outer(hook)).first()).toBeAttached();
    });
  }
});

// ============================================================================
// 3. Inner wrapper and product class
// ============================================================================

test.describe("Inner wrapper and product type class", () => {
  test("test-watc-default: .eael-add-to-cart-wrapper is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrapper("test-watc-default")).first()).toBeAttached();
  });

  test("test-watc-default: wrapper carries eael-product-{type} class", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(wrapper("test-watc-default")).first().getAttribute("class");
    expect(cls ?? "").toMatch(/eael-product-/);
  });
});

// ============================================================================
// 4. Product data attributes
// ============================================================================

test.describe("Product data attributes", () => {
  const hooks = ["test-watc-default", "test-watc-column", "test-watc-ajax"];

  for (const hook of hooks) {
    test(`${hook}: data-product-id is set`, async ({ page }) => {
      await openPage(page);
      const attr = await page.locator(wrapper(hook)).first().getAttribute("data-product-id");
      expect(attr).toBeTruthy();
    });

    test(`${hook}: data-product-type is set`, async ({ page }) => {
      await openPage(page);
      const attr = await page.locator(wrapper(hook)).first().getAttribute("data-product-type");
      expect(attr).toBeTruthy();
    });
  }
});

// ============================================================================
// 5. AJAX attribute
// ============================================================================

test.describe("AJAX add-to-cart attribute", () => {
  test("test-watc-ajax: data-eael-ajax-add-to-cart is 'yes'", async ({ page }) => {
    await openPage(page);
    const attr = await page
      .locator(wrapper("test-watc-ajax"))
      .first()
      .getAttribute("data-eael-ajax-add-to-cart");
    expect(attr).toBe("yes");
  });

  test("test-watc-default: data-eael-ajax-add-to-cart is absent (AJAX off)", async ({ page }) => {
    await openPage(page);
    const attr = await page
      .locator(wrapper("test-watc-default"))
      .first()
      .getAttribute("data-eael-ajax-add-to-cart");
    expect(attr).toBeNull();
  });
});

// ============================================================================
// 6. Layout class
// ============================================================================

test.describe("Layout class on widget container", () => {
  test("test-watc-default: widget container has eael-add-to-cart--layout-row", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(".test-watc-default").first().getAttribute("class");
    expect(cls ?? "").toContain("eael-add-to-cart--layout-row");
  });

  test("test-watc-column: widget container has eael-add-to-cart--layout-column", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(".test-watc-column").first().getAttribute("class");
    expect(cls ?? "").toContain("eael-add-to-cart--layout-column");
  });
});

// ============================================================================
// 7. Add to cart output renders
// ============================================================================

test.describe("Add to cart output", () => {
  test("test-watc-default: WC cart form or EA button is rendered inside wrapper", async ({ page }) => {
    await openPage(page);
    const wcForm  = page.locator(".test-watc-default .eael-single-product-add-to-cart form.cart");
    const eaBtn   = page.locator(".test-watc-default .eael-add-to-cart");
    const formCnt = await wcForm.count();
    const btnCnt  = await eaBtn.count();
    expect(formCnt + btnCnt, "expected at least one of: WC cart form or EA button").toBeGreaterThan(0);
  });
});

// ============================================================================
// 8. Interaction
// ============================================================================

test.describe("Interaction", () => {
  const hooks = [
    "test-watc-default",
    "test-watc-column",
    "test-watc-no-qty",
    "test-watc-no-icon",
    "test-watc-ajax",
    "test-watc-custom-text",
  ];

  for (const hook of hooks) {
    test(`${hook}: hover triggers no JS errors`, async ({ page }) => {
      const errs = watchErrors(page);
      await openPage(page);
      await page.locator(outer(hook)).first().hover();
      await page.waitForTimeout(150);
      expect(errs, errs.join(" | ")).toHaveLength(0);
    });
  }
});
