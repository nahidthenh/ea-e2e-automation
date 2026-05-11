/**
 * Covered: Essential Addons — Woo Product Slider widget (Pro)
 *
 * 1. Page health       — HTTP 200, no PHP errors, no JS errors
 * 2. Layout presets    — preset-1/2/3/4: container has correct layout class; slides visible
 * 3. Content toggles   — title on/off; price on/off; rating on/off; post terms on
 * 4. Slider controls   — arrows on: .swiper-button-next visible;
 *                        autoplay on: data-autoplay > 0; loop off: data-loop absent
 * 5. Element structure — .eael-woo-product-slider-container; .eael-woo-product-slider;
 *                        .swiper-wrapper; .swiper-slide; .eael-product-slider; product image
 * 6. Swiper JS init    — .swiper-slide is visible after Swiper initialises
 * 7. Interaction       — hover on each preset triggers no JS errors; add-to-cart button present
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.WOO_PRODUCT_SLIDER_PAGE_SLUG ?? "woo-product-slider"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Woo_Product_Slider::render() + preset-1.php):
//   .{hook}                                                ← elementor-widget wrapper
//     .swiper-container-wrap.eael-woo-product-slider-container.{preset}
//       .woocommerce.swiper.eael-woo-product-slider        ← Swiper target
//         [data-type="preset-1|2|3|4"]
//         [data-autoplay="0|{ms}"]
//         [data-loop="1"]                                  ← only when loop enabled
//         [data-arrows="1"]                                ← only when arrows enabled
//         .swiper-wrapper.products.eael-product-slider-wrapper
//           .product.swiper-slide
//             .eael-product-slider
//               .product-details-wrap
//                 .product-details
//                   .eael-product-title h2
//                   .eael-product-price
//                   .eael-product-excerpt p
//                   .star-rating
//               .icons-wrap.box-style > li.add-to-cart
//               .icons-wrap.box-style > li.eael-product-quick-view
//               .icons-wrap.box-style > li.view-details
//             .product-image-wrap > .image-wrap > img
//       .swiper-pagination                                  ← dots (default on)
//       .swiper-button-next / .swiper-button-prev          ← arrows (default off)

const container  = (hook: string) => `.${hook} .eael-woo-product-slider-container`;
const swiper     = (hook: string) => `.${hook} .eael-woo-product-slider`;
const slide      = (hook: string) => `.${hook} .swiper-slide.product`;
const productBox = (hook: string) => `.${hook} .eael-product-slider`;
const title      = (hook: string) => `.${hook} .eael-product-title`;
const price      = (hook: string) => `.${hook} .eael-product-price`;
const rating     = (hook: string) => `.${hook} .star-rating`;
const addToCart  = (hook: string) => `.${hook} li.add-to-cart`;
const nextBtn    = (hook: string) => `.${hook} .swiper-button-next`;
const prevBtn    = (hook: string) => `.${hook} .swiper-button-prev`;
const dots       = (hook: string) => `.${hook} .swiper-pagination`;
const terms      = (hook: string) => `.${hook} .eael-product-cats a`;

// ── layout preset map ─────────────────────────────────────────────────────
const PRESETS: Record<string, string> = {
  "test-wps-default":  "preset-1",
  "test-wps-preset-2": "preset-2",
  "test-wps-preset-3": "preset-3",
  "test-wps-preset-4": "preset-4",
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
    test(`${preset}: container has class ${preset}`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(container(hook)).first()).toHaveClass(
        new RegExp(preset)
      );
    });

    test(`${preset}: data-type="${preset}" on swiper element`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(swiper(hook)).first()).toHaveAttribute(
        "data-type",
        preset
      );
    });

    test(`${preset}: at least one .swiper-slide.product is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(slide(hook)).first()).toBeVisible({ timeout: 8000 });
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 3. Content toggles
// ══════════════════════════════════════════════════════════════════════════

test.describe("Content toggles", () => {
  test("default: product title is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(title("test-wps-default")).first()).toBeVisible();
  });

  test("no-title: .eael-product-title is absent", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(title("test-wps-no-title")).first()).not.toBeAttached();
  });

  test("default: product price is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(price("test-wps-default")).first()).toBeVisible();
  });

  test("no-price: .eael-product-price is absent", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(price("test-wps-no-price")).first()).not.toBeAttached();
  });

  test("default: .star-rating is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(rating("test-wps-default")).first()).toBeAttached();
  });

  test("no-rating: .star-rating is absent", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(rating("test-wps-no-rating")).first()).not.toBeAttached();
  });

  test("terms: .eael-product-cats a is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(terms("test-wps-terms")).first()).toBeVisible();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 4. Slider controls
// ══════════════════════════════════════════════════════════════════════════

test.describe("Slider controls", () => {
  test("default: dots (.swiper-pagination) is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(dots("test-wps-default")).first()).toBeAttached();
  });

  test("arrows on: .swiper-button-next is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(nextBtn("test-wps-arrows")).first()).toBeVisible();
  });

  test("arrows on: .swiper-button-prev is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(prevBtn("test-wps-arrows")).first()).toBeVisible();
  });

  test("arrows on: data-arrows='1' on swiper element", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(swiper("test-wps-arrows")).first()).toHaveAttribute(
      "data-arrows",
      "1"
    );
  });

  test("autoplay on: data-autoplay is non-zero", async ({ page }) => {
    await openPage(page);
    const val = await page
      .locator(swiper("test-wps-autoplay"))
      .first()
      .getAttribute("data-autoplay");
    expect(parseInt(val ?? "0", 10)).toBeGreaterThan(0);
  });

  test("autoplay off (default): data-autoplay is '0'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(swiper("test-wps-default")).first()).toHaveAttribute(
      "data-autoplay",
      "0"
    );
  });

  test("loop on (default): data-loop='1' on swiper element", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(swiper("test-wps-default")).first()).toHaveAttribute(
      "data-loop",
      "1"
    );
  });

  test("loop off: data-loop attribute is absent", async ({ page }) => {
    await openPage(page);
    const val = await page
      .locator(swiper("test-wps-no-loop"))
      .first()
      .getAttribute("data-loop");
    expect(val).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 5. Element structure
// ══════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test(".eael-woo-product-slider-container is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-wps-default")).first()).toBeAttached();
  });

  test(".eael-woo-product-slider swiper element is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(swiper("test-wps-default")).first()).toBeAttached();
  });

  test(".eael-product-slider product box is present inside slide", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(productBox("test-wps-default")).first()).toBeAttached();
  });

  test("product image is rendered inside .product-image-wrap", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-wps-default .product-image-wrap img").first()
    ).toBeAttached();
  });

  test("add-to-cart button is present inside icons-wrap", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(addToCart("test-wps-default")).first()).toBeAttached();
  });

  test("view-details link is present", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-wps-default li.view-details a").first()
    ).toBeAttached();
  });

  test("quick-view element is present (default on)", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-wps-default li.eael-product-quick-view").first()
    ).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 6. Swiper JS initialisation
// ══════════════════════════════════════════════════════════════════════════

test.describe("Swiper JS initialisation", () => {
  for (const [hook, preset] of Object.entries(PRESETS)) {
    test(`${preset}: at least one .swiper-slide.product is visible after init`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(slide(hook)).first()).toBeVisible({ timeout: 8000 });
    });
  }

  test("default: swiper-wrapper has product slides after init", async ({ page }) => {
    await openPage(page);
    const count = await page
      .locator(".test-wps-default .swiper-wrapper .swiper-slide.product")
      .count();
    expect(count).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 7. Interaction
// ══════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover on all preset variants triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    for (const hook of Object.keys(PRESETS)) {
      await page.locator(container(hook)).first().hover();
      await page.waitForTimeout(150);
    }
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover on content-toggle variants triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    for (const hook of ["test-wps-no-title", "test-wps-no-price", "test-wps-no-rating", "test-wps-terms"]) {
      await page.locator(container(hook)).first().hover();
      await page.waitForTimeout(150);
    }
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover on slider-control variants triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    for (const hook of ["test-wps-arrows", "test-wps-autoplay", "test-wps-no-loop"]) {
      await page.locator(container(hook)).first().hover();
      await page.waitForTimeout(150);
    }
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
