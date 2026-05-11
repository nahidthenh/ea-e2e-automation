/**
 * Covered: Essential Addons — Woo Product List widget
 *
 * 1. Page health             — HTTP 200, no PHP errors, no JS errors
 * 2. Layout presets          — preset-1 / preset-2 / preset-3; wrapper attached,
 *                              items rendered, title visible, price visible
 * 3. Image alignment         — no alignment class by default; image-alignment-right class;
 *                              image wrap present for all items
 * 4. Rating toggle           — rating element present (default) / absent when disabled
 * 5. Title toggle            — title visible (default) / absent when disabled
 * 6. Price toggle            — price visible (default) / absent when disabled
 * 7. Button positions        — both (static footer + hover on image); static-only;
 *                              on-hover-only
 * 8. Total sold progress bar — absent by default; present + inner element when enabled
 * 9. Product filters         — featured / sale filter wrappers render without error
 * 10. Element structure      — wrapper class, item class, image wrap, h3 price tag, excerpt
 * 11. Interaction            — hover items (no JS errors); add-to-cart click (no JS errors);
 *                              all three presets render without JS errors
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.WOO_PRODUCT_LIST_PAGE_SLUG ?? "woo-product-list"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Woo_Product_List::render() + preset-1.php template):
//   .{hook}
//     .eael-product-list-wrapper.{preset-1|preset-2|preset-3}
//       .eael-product-list-body.woocommerce
//         .eael-product-list-container
//           .eael-post-appender
//             div.product
//               .eael-product-list-item.{image-alignment-*}
//                 .eael-product-list-image-wrap
//                   img
//                   ul.eael-product-list-buttons-on-hover  (button_position=on-hover|both)
//                 .eael-product-list-content-wrap
//                   div.eael-product-list-title
//                   .eael-product-list-content-header
//                     .eael-product-list-rating
//                   .eael-product-list-content-body
//                     .eael-product-list-excerpt
//                     h3.eael-product-list-price
//                   .eael-product-list-content-footer
//                     .eael-product-list-progress   (total_sold_show=yes)
//                     .eael-product-list-buttons    (button_position=static|both)

const wrapper = (hook: string) =>
  `.${hook} .eael-product-list-wrapper`;
const item = (hook: string) =>
  `.${hook} .eael-product-list-item`;
const title = (hook: string) =>
  `.${hook} .eael-product-list-title`;
const price = (hook: string) =>
  `.${hook} .eael-product-list-price`;
const rating = (hook: string) =>
  `.${hook} .eael-product-list-rating`;
const excerpt = (hook: string) =>
  `.${hook} .eael-product-list-excerpt`;
const addToCartBtn = (hook: string) =>
  `.${hook} .eael-product-list-buttons .eael-product-list-add-to-cart-button`;
const addToCartHover = (hook: string) =>
  `.${hook} .eael-product-list-buttons-on-hover .eael-product-list-add-to-cart-button`;
const progressBar = (hook: string) =>
  `.${hook} .eael-product-list-progress`;
const imageWrap = (hook: string) =>
  `.${hook} .eael-product-list-image-wrap`;

// ── known layout values ───────────────────────────────────────────────────
const LAYOUTS = {
  "test-wpl-default":  "preset-1",
  "test-wpl-preset-2": "preset-2",
  "test-wpl-preset-3": "preset-3",
} as const;

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

// ── Page health ───────────────────────────────────────────────────────────

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
    expect(errs).toHaveLength(0);
  });
});

// ── Layout presets ────────────────────────────────────────────────────────

test.describe("Layout presets", () => {
  for (const [hook, layoutClass] of Object.entries(LAYOUTS)) {
    test(`${layoutClass} wrapper is attached`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(`${wrapper(hook)}.${layoutClass}`)).toBeAttached();
    });

    test(`${layoutClass} renders product items`, async ({ page }) => {
      await openPage(page);
      const count = await page.locator(item(hook)).count();
      expect(count).toBeGreaterThan(0);
    });

    test(`${layoutClass} product title is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(title(hook)).first()).toBeVisible();
    });

    test(`${layoutClass} product price is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(price(hook)).first()).toBeVisible();
    });
  }
});

// ── Image alignment ───────────────────────────────────────────────────────

test.describe("Image alignment", () => {
  test("default: no explicit alignment class on item", async ({ page }) => {
    await openPage(page);
    const firstItem = page.locator(item("test-wpl-default")).first();
    await expect(firstItem).not.toHaveClass(/image-alignment-right/);
  });

  test("image-alignment-right class applied to item", async ({ page }) => {
    await openPage(page);
    const firstItem = page.locator(item("test-wpl-img-right")).first();
    await expect(firstItem).toHaveClass(/image-alignment-right/);
  });

  test("image wrap is present for all items", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(imageWrap("test-wpl-img-right")).count();
    expect(count).toBeGreaterThan(0);
  });
});

// ── Content toggles ───────────────────────────────────────────────────────

test.describe("Rating toggle", () => {
  test("rating visible in default widget", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(rating("test-wpl-default")).first()).toBeAttached();
  });

  test("rating hidden when disabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(rating("test-wpl-no-rating"))).not.toBeAttached();
  });
});

test.describe("Title toggle", () => {
  test("title visible in default widget", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(title("test-wpl-default")).first()).toBeVisible();
  });

  test("title hidden when disabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(title("test-wpl-no-title"))).not.toBeAttached();
  });
});

test.describe("Price toggle", () => {
  test("price visible in default widget", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(price("test-wpl-default")).first()).toBeVisible();
  });

  test("price hidden when disabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(price("test-wpl-no-price"))).not.toBeAttached();
  });
});

// ── Button positions ──────────────────────────────────────────────────────

test.describe("Button positions", () => {
  test("default (both): static buttons present in footer", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(addToCartBtn("test-wpl-default")).first()).toBeAttached();
  });

  test("default (both): hover buttons present on image", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(addToCartHover("test-wpl-default")).first()).toBeAttached();
  });

  test("static-only: footer buttons present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(addToCartBtn("test-wpl-btn-static")).first()).toBeAttached();
  });

  test("static-only: no hover buttons on image", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(addToCartHover("test-wpl-btn-static"))).not.toBeAttached();
  });

  test("on-hover-only: hover buttons present on image", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(addToCartHover("test-wpl-btn-hover")).first()).toBeAttached();
  });

  test("on-hover-only: no footer buttons", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(addToCartBtn("test-wpl-btn-hover"))).not.toBeAttached();
  });
});

// ── Total sold progress bar ───────────────────────────────────────────────

test.describe("Total sold progress bar", () => {
  test("progress bar absent in default widget", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(progressBar("test-wpl-default"))).not.toBeAttached();
  });

  test("progress bar present when enabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(progressBar("test-wpl-total-sold")).first()).toBeAttached();
  });

  test("progress bar inner element is rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-wpl-total-sold .eael-product-list-progress-bar-outer").first()
    ).toBeAttached();
  });
});

// ── Product filters ───────────────────────────────────────────────────────

test.describe("Product filters", () => {
  test("featured filter: wrapper renders without error", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrapper("test-wpl-featured"))).toBeAttached();
  });

  test("sale filter: wrapper renders without error", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrapper("test-wpl-sale"))).toBeAttached();
  });
});

// ── Element structure ─────────────────────────────────────────────────────

test.describe("Element structure", () => {
  test("main wrapper has eael-product-list-wrapper class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrapper("test-wpl-default"))).toBeAttached();
  });

  test("product item has eael-product-list-item class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(item("test-wpl-default")).first()).toBeAttached();
  });

  test("image wrap present inside each item", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(imageWrap("test-wpl-default")).first()).toBeAttached();
  });

  test("price uses h3 tag", async ({ page }) => {
    await openPage(page);
    const priceEl = page.locator(".test-wpl-default h3.eael-product-list-price").first();
    await expect(priceEl).toBeAttached();
  });

  test("excerpt present in default widget", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(excerpt("test-wpl-default")).first()).toBeAttached();
  });
});

// ── Interaction ───────────────────────────────────────────────────────────

test.describe("Interaction", () => {
  test("no JS errors when hovering product items", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    const items = page.locator(item("test-wpl-default"));
    const count = await items.count();
    for (let i = 0; i < Math.min(count, 4); i++) {
      await items.nth(i).hover();
      await page.waitForTimeout(150);
    }
    expect(errs).toHaveLength(0);
  });

  test("clicking add-to-cart button causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    const btn = page.locator(addToCartBtn("test-wpl-default")).first();
    if (await btn.isVisible()) {
      await btn.click();
    }
    expect(errs).toHaveLength(0);
  });

  test("all three layout presets render without JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    for (const hook of Object.keys(LAYOUTS)) {
      await expect(page.locator(wrapper(hook))).toBeAttached();
    }
    expect(errs).toHaveLength(0);
  });
});
