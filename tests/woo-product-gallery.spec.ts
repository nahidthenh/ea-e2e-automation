/**
 * Covered: Essential Addons — Woo Product Gallery widget (Free)
 *
 * 1. Page health       — HTTP 200, no PHP errors, no JS errors
 * 2. Layout presets    — preset-1/2/3/4: wrapper has correct preset class; products render
 * 3. Product layout    — masonry (default): data-layout-mode="masonry";
 *                        grid: data-layout-mode="grid"
 * 4. Category filter   — ul.eael-cat-tab rendered; a.active "All" tab present
 * 5. Content toggles   — price on/off; add-to-cart on/off;
 *                        quick-view on/off; view-details link on/off
 * 6. Load more         — .eael-load-more-button present when show_load_more='true'
 * 7. Product filters   — featured / sale filter wrappers render without error
 * 8. Element structure — .eael-product-gallery; ul.products.eael-post-appender;
 *                        li.product; .eael-product-wrap; .product-image-wrap img;
 *                        .icons-wrap.over-box-style; .eael-product-title
 * 9. Isotope JS init   — li.product visible after isotope init (masonry)
 * 10. Interaction      — hover on each preset triggers no JS errors;
 *                        clicking category filter tab updates active class
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.WOO_PRODUCT_GALLERY_PAGE_SLUG ?? "woo-product-gallery"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Woo_Product_Gallery::render() + preset-1.php):
//   .{hook}
//     .eael-product-gallery.{eael-product-preset-1|2|3|4}.{masonry|grid}
//       ul.eael-cat-tab[data-layout]          ← always rendered (show_all=yes default)
//         li > a.active.post-list-filter-item ← "All" tab
//       .woocommerce
//         ul.products.eael-post-appender[data-layout-mode="masonry|grid"]
//           li.product
//             .eael-product-wrap
//               .product-image-wrap
//                 .image-wrap > img
//               .image-hover-wrap > ul.icons-wrap.over-box-style
//                 li.add-to-cart           (if addtocart_show=yes)
//                 li.eael-product-quick-view (if quick_view=yes, non-preset-4)
//                 li.view-details          (if link_show=yes)
//             .product-details-wrap
//               .eael-product-price        (if price=yes)
//               .eael-product-title > a > h2
//         [.eael-load-more-button-wrap > .eael-load-more-button] (if load_more='true')

const gallery      = (hook: string) => `.${hook} .eael-product-gallery`;
const catTab       = (hook: string) => `.${hook} ul.eael-cat-tab`;
const activeFilter = (hook: string) => `.${hook} ul.eael-cat-tab a.active`;
const products     = (hook: string) => `.${hook} ul.products.eael-post-appender`;
const product      = (hook: string) => `.${hook} li.product`;
const productWrap  = (hook: string) => `.${hook} .eael-product-wrap`;
const imgWrap      = (hook: string) => `.${hook} .product-image-wrap`;
const price        = (hook: string) => `.${hook} .eael-product-price`;
const title        = (hook: string) => `.${hook} .eael-product-title`;
const addToCart    = (hook: string) => `.${hook} li.add-to-cart`;
const quickView    = (hook: string) => `.${hook} li.eael-product-quick-view`;
const viewDetails  = (hook: string) => `.${hook} li.view-details`;
const loadMoreBtn  = (hook: string) => `.${hook} .eael-load-more-button`;

// ── layout preset map ─────────────────────────────────────────────────────
const PRESETS: Record<string, string> = {
  "test-wpg-default":  "eael-product-preset-1",
  "test-wpg-preset-2": "eael-product-preset-2",
  "test-wpg-preset-3": "eael-product-preset-3",
  "test-wpg-preset-4": "eael-product-preset-4",
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

// ══════════════════════════════════════════════════════════════════════════
// 1. Page health
// ══════════════════════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════════════════════
// 2. Layout presets
// ══════════════════════════════════════════════════════════════════════════

test.describe("Layout presets", () => {
  for (const [hook, preset] of Object.entries(PRESETS)) {
    test(`${preset}: wrapper has preset class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(gallery(hook)).first()).toHaveClass(
        new RegExp(preset)
      );
    });

    test(`${preset}: at least one product renders`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(product(hook)).first()).toBeVisible({ timeout: 8000 });
    });

    test(`${preset}: product title is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(title(hook)).first()).toBeVisible();
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 3. Product layout
// ══════════════════════════════════════════════════════════════════════════

test.describe("Product layout", () => {
  test("default: data-layout-mode='masonry' on products list", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(products("test-wpg-default")).first()).toHaveAttribute(
      "data-layout-mode",
      "masonry"
    );
  });

  test("grid: data-layout-mode='grid' on products list", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(products("test-wpg-grid")).first()).toHaveAttribute(
      "data-layout-mode",
      "grid"
    );
  });

  test("grid: wrapper has 'grid' class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(gallery("test-wpg-grid")).first()).toHaveClass(/grid/);
  });

  test("default: wrapper has 'masonry' class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(gallery("test-wpg-default")).first()).toHaveClass(/masonry/);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 4. Category filter tab
// ══════════════════════════════════════════════════════════════════════════

test.describe("Category filter tab", () => {
  test("ul.eael-cat-tab is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(catTab("test-wpg-default")).first()).toBeAttached();
  });

  test("'All' tab link is present and active by default", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(activeFilter("test-wpg-default")).first()).toBeVisible();
  });

  test("eael-cat-tab has data-layout attribute", async ({ page }) => {
    await openPage(page);
    const attr = await page.locator(catTab("test-wpg-default")).first().getAttribute("data-layout");
    expect(attr).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 5. Content toggles
// ══════════════════════════════════════════════════════════════════════════

test.describe("Content toggles — price", () => {
  test("default: .eael-product-price is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(price("test-wpg-default")).first()).toBeVisible();
  });

  test("no-price: .eael-product-price is absent", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(price("test-wpg-no-price")).first()).not.toBeAttached();
  });
});

test.describe("Content toggles — add to cart", () => {
  test("default: li.add-to-cart is present in icons-wrap", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(addToCart("test-wpg-default")).first()).toBeAttached();
  });

  test("no-atc: li.add-to-cart is absent", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(addToCart("test-wpg-no-atc")).first()).not.toBeAttached();
  });
});

test.describe("Content toggles — quick view", () => {
  test("default: li.eael-product-quick-view is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(quickView("test-wpg-default")).first()).toBeAttached();
  });

  test("no-quickview: li.eael-product-quick-view is absent", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(quickView("test-wpg-no-quickview")).first()).not.toBeAttached();
  });
});

test.describe("Content toggles — view details link", () => {
  test("default: li.view-details is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(viewDetails("test-wpg-default")).first()).toBeAttached();
  });

  test("no-link: li.view-details is absent", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(viewDetails("test-wpg-no-link")).first()).not.toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 6. Load more button
// ══════════════════════════════════════════════════════════════════════════

test.describe("Load more button", () => {
  test("default: .eael-load-more-button is absent", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(loadMoreBtn("test-wpg-default")).first()).not.toBeAttached();
  });

  test("load-more: .eael-load-more-button is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(loadMoreBtn("test-wpg-load-more")).first()).toBeVisible();
  });

  test("load-more: button text is 'Load More'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(loadMoreBtn("test-wpg-load-more")).first()).toContainText("Load More");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 7. Product filters
// ══════════════════════════════════════════════════════════════════════════

test.describe("Product filters", () => {
  test("featured filter: .eael-product-gallery renders without error", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(gallery("test-wpg-filter-featured")).first()).toBeAttached();
  });

  test("sale filter: .eael-product-gallery renders without error", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(gallery("test-wpg-filter-sale")).first()).toBeAttached();
  });

  test("featured filter: ul.products is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(products("test-wpg-filter-featured")).first()).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 8. Element structure
// ══════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test(".eael-product-gallery wrapper is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(gallery("test-wpg-default")).first()).toBeAttached();
  });

  test("ul.products.eael-post-appender is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(products("test-wpg-default")).first()).toBeAttached();
  });

  test("li.product items are present", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(product("test-wpg-default")).count();
    expect(count).toBeGreaterThan(0);
  });

  test(".eael-product-wrap is present inside li.product", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(productWrap("test-wpg-default")).first()).toBeAttached();
  });

  test(".product-image-wrap img is present", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-wpg-default .product-image-wrap img").first()
    ).toBeAttached();
  });

  test("ul.icons-wrap.over-box-style is present inside image-hover-wrap", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-wpg-default .image-hover-wrap .icons-wrap.over-box-style").first()
    ).toBeAttached();
  });

  test(".eael-product-title link is present", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-wpg-default .eael-product-title a").first()
    ).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 9. Isotope JS init
// ══════════════════════════════════════════════════════════════════════════

test.describe("Isotope JS init", () => {
  test("masonry: li.product is visible after isotope init", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(product("test-wpg-default")).first()).toBeVisible({ timeout: 8000 });
  });

  test("masonry: multiple li.product items are rendered", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(product("test-wpg-default")).count();
    expect(count).toBeGreaterThan(1);
  });

  test("grid: li.product is visible after init", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(product("test-wpg-grid")).first()).toBeVisible({ timeout: 8000 });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 10. Interaction
// ══════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover on all preset variants triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    for (const hook of Object.keys(PRESETS)) {
      await page.locator(gallery(hook)).first().hover();
      await page.waitForTimeout(150);
    }
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover on content-toggle variants triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    for (const hook of ["test-wpg-no-price", "test-wpg-no-atc", "test-wpg-no-quickview", "test-wpg-no-link"]) {
      await page.locator(gallery(hook)).first().hover();
      await page.waitForTimeout(150);
    }
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking 'All' filter tab keeps active class on it", async ({ page }) => {
    await openPage(page);
    const allTab = page.locator(activeFilter("test-wpg-default")).first();
    await allTab.click();
    await expect(allTab).toHaveClass(/active/);
  });
});
