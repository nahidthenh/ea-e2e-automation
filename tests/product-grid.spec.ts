/**
 * Covered: Essential Addons — Product Grid widget (Woo Product Grid)
 *
 * Widget PHP get_name(): 'eicon-woocommerce'
 *
 * 1. Page health         — HTTP 200, no PHP errors, no JS errors
 * 2. Grid wrapper        — .eael-product-grid rendered for each instance
 * 3. Layout class        — layout class (masonry / grid / list) on wrapper
 * 4. Style preset class  — preset class on wrapper (eael-product-{preset})
 * 5. Product items       — li.product items rendered (requires WC products)
 * 6. Product wrap        — .eael-product-wrap inside each product item
 * 7. data-widget-id      — present on each wrapper
 * 8. Interaction         — hover produces no JS errors
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.PRODUCT_GRID_PAGE_SLUG ?? "product-grid"}/`;

// -- DOM shape ----------------------------------------------------------------
// .{hook}
//   .eael-product-grid.{style_preset}.{layout}  [data-widget-id][data-page-id][data-nonce]
//     .woocommerce
//       ul.products.columns-{n}
//         li.product
//           .eael-product-wrap
//             ...product image, title, price, add-to-cart button...

const grid        = (hook: string) => `.${hook} .eael-product-grid`;
const productItem = (hook: string) => `.${hook} .eael-product-grid li.product`;
const productWrap = (hook: string) => `.${hook} .eael-product-grid .eael-product-wrap`;

// grid/masonry presets: hook → [layout, preset]
const GRID_PRESETS: Record<string, [string, string]> = {
  "test-pg-default":  ["masonry", "eael-product-simple"],
  "test-pg-grid":     ["grid",    "eael-product-simple"],
  "test-pg-overlay":  ["masonry", "eael-product-overlay"],
  "test-pg-preset-5": ["grid",    "eael-product-preset-5"],
};

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
// 2. Grid wrapper
// ============================================================================

test.describe("Grid wrapper", () => {
  const hooks = [...Object.keys(GRID_PRESETS), "test-pg-list"];

  for (const hook of hooks) {
    test(`${hook}: .eael-product-grid is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(grid(hook)).first()).toBeVisible();
    });
  }
});

// ============================================================================
// 3. Layout class
// ============================================================================

test.describe("Layout class", () => {
  for (const [hook, [layout]] of Object.entries(GRID_PRESETS)) {
    test(`${hook}: wrapper has layout class "${layout}"`, async ({ page }) => {
      await openPage(page);
      const cls = await page.locator(grid(hook)).first().getAttribute("class");
      expect(cls ?? "").toContain(layout);
    });
  }

  test("test-pg-list: wrapper has layout class \"list\"", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(grid("test-pg-list")).first().getAttribute("class");
    expect(cls ?? "").toContain("list");
  });
});

// ============================================================================
// 4. Style preset class
// ============================================================================

test.describe("Style preset class", () => {
  for (const [hook, [, preset]] of Object.entries(GRID_PRESETS)) {
    test(`${hook}: wrapper has preset class "${preset}"`, async ({ page }) => {
      await openPage(page);
      const cls = await page.locator(grid(hook)).first().getAttribute("class");
      expect(cls ?? "").toContain(preset);
    });
  }

  // For list layout, the preset class is on li.product items (not the outer wrapper)
  test("test-pg-list: li.product items have preset class \"eael-product-list-preset-1\"", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(productItem("test-pg-list")).first().getAttribute("class");
    expect(cls ?? "").toContain("eael-product-list-preset-1");
  });
});

// ============================================================================
// 5. Product items rendered
// ============================================================================

test.describe("Product items rendered", () => {
  const hooks = [...Object.keys(GRID_PRESETS), "test-pg-list"];

  for (const hook of hooks) {
    test(`${hook}: at least one li.product item is visible`, async ({ page }) => {
      await openPage(page);
      const count = await page.locator(productItem(hook)).count();
      expect(count, `no products found in ${hook}`).toBeGreaterThan(0);
      await expect(page.locator(productItem(hook)).first()).toBeVisible();
    });
  }
});

// ============================================================================
// 6. Product wrap
// ============================================================================

test.describe("Product wrap", () => {
  for (const hook of Object.keys(GRID_PRESETS)) {
    test(`${hook}: .eael-product-wrap is visible inside product item`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(productWrap(hook)).first()).toBeVisible();
    });
  }
});

// ============================================================================
// 7. data-widget-id attribute
// ============================================================================

test.describe("data-widget-id attribute", () => {
  const hooks = [...Object.keys(GRID_PRESETS), "test-pg-list"];

  for (const hook of hooks) {
    test(`${hook}: .eael-product-grid has data-widget-id`, async ({ page }) => {
      await openPage(page);
      const attr = await page.locator(grid(hook)).first().getAttribute("data-widget-id");
      expect(attr).toBeTruthy();
    });
  }
});

// ============================================================================
// 8. Interaction
// ============================================================================

test.describe("Interaction", () => {
  const hooks = [...Object.keys(GRID_PRESETS), "test-pg-list"];

  for (const hook of hooks) {
    test(`${hook}: hover produces no JS errors`, async ({ page }) => {
      const errs = watchErrors(page);
      await openPage(page);
      await page.locator(grid(hook)).first().hover();
      await page.waitForTimeout(150);
      expect(errs, errs.join(" | ")).toHaveLength(0);
    });
  }
});
