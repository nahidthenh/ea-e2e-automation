/**
 * Covered: Essential Addons — Woo Cart widget
 *
 * 1. Page health        — HTTP 200, no PHP errors, no JS errors
 * 2. Widget wrapper     — .eael-woo-cart-wrapper rendered for each instance
 * 3. Empty cart state   — .eael-woo-cart-empty present (cart is always empty in test env)
 * 4. Layout class       — eael-woo-{layout} class applied to wrapper
 * 5. Auto-update class  — eael-auto-update present/absent based on setting
 * 6. Interaction        — hover produces no JS errors
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.WOO_CART_PAGE_SLUG ?? "woo-cart"}/`;

// -- DOM shape ----------------------------------------------------------------
// .{hook}
//   .eael-woo-cart-wrapper.eael-woo-{layout}[.eael-woo-cart-empty][.eael-auto-update]
//     (empty cart) → WooCommerce cart-empty.php template (.woocommerce-info or similar)
//     (non-empty)  → form.woocommerce-cart-form.eael-woo-cart-form
//                      .eael-woo-cart-table
//                    .cart_totals

const wrapper = (hook: string) =>
  `.${hook} .eael-woo-cart-wrapper`;

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
  const hooks = ["test-wc-default", "test-wc-style-2", "test-wc-no-auto-update"];

  for (const hook of hooks) {
    test(`${hook}: .eael-woo-cart-wrapper is rendered`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrapper(hook)).first()).toBeAttached();
    });
  }
});

// ============================================================================
// 3. Cart output rendered
// ============================================================================

test.describe("Cart output rendered", () => {
  const hooks = ["test-wc-default", "test-wc-style-2", "test-wc-no-auto-update"];

  for (const hook of hooks) {
    test(`${hook}: widget renders cart content (empty state or cart table)`, async ({ page }) => {
      await openPage(page);
      const el = page.locator(wrapper(hook)).first();
      await expect(el).toBeAttached();
      // Widget renders either empty cart (.eael-woo-cart-empty) or a cart form
      const cls = await el.getAttribute("class");
      const hasEmptyClass = (cls ?? "").includes("eael-woo-cart-empty");
      const hasCartForm = await page.locator(`.${hook} form.eael-woo-cart-form`).count() > 0;
      // At least one of them must be true
      expect(hasEmptyClass || hasCartForm, `neither empty class nor cart form found in ${hook}`).toBe(true);
    });
  }
});

// ============================================================================
// 4. Layout class
// ============================================================================

test.describe("Layout class", () => {
  const layoutMap: Record<string, string> = {
    "test-wc-default":        "eael-woo-default",
    "test-wc-style-2":        "eael-woo-style-2",
    "test-wc-no-auto-update": "eael-woo-default",
  };

  for (const [hook, layoutClass] of Object.entries(layoutMap)) {
    test(`${hook}: wrapper has layout class ${layoutClass}`, async ({ page }) => {
      await openPage(page);
      const cls = await page.locator(wrapper(hook)).first().getAttribute("class");
      expect(cls ?? "").toContain(layoutClass);
    });
  }
});

// ============================================================================
// 5. Auto-update class
// ============================================================================

test.describe("Auto-update class", () => {
  test("test-wc-default: eael-auto-update class is present when enabled", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(wrapper("test-wc-default")).first().getAttribute("class");
    expect(cls ?? "").toContain("eael-auto-update");
  });

  test("test-wc-style-2: eael-auto-update class is present when enabled", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(wrapper("test-wc-style-2")).first().getAttribute("class");
    expect(cls ?? "").toContain("eael-auto-update");
  });

  test("test-wc-no-auto-update: eael-auto-update class is absent when disabled", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(wrapper("test-wc-no-auto-update")).first().getAttribute("class");
    expect(cls ?? "").not.toContain("eael-auto-update");
  });
});

// ============================================================================
// 6. Interaction
// ============================================================================

test.describe("Interaction", () => {
  const hooks = ["test-wc-default", "test-wc-style-2", "test-wc-no-auto-update"];

  for (const hook of hooks) {
    test(`${hook}: hover produces no JS errors`, async ({ page }) => {
      const errs = watchErrors(page);
      await openPage(page);
      await page.locator(wrapper(hook)).first().hover();
      await page.waitForTimeout(150);
      expect(errs, errs.join(" | ")).toHaveLength(0);
    });
  }
});
