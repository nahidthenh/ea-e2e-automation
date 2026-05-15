/**
 * Covered: Essential Addons — Woo Product Carousel widget (Free)
 *
 * 1. Page health       — HTTP 200, no PHP errors, no JS errors
 * 2. Layout presets    — preset-1/2/3/4: container has correct class + data-type; slides visible
 * 3. Content toggles   — title on/off; price on/off; rating on/off;
 *                        add-to-cart on/off; buttons static vs hover
 * 4. Carousel effects  — slide (default): data-effect="slide";
 *                        coverflow: data-effect="coverflow"
 * 5. Slider controls   — arrows on: .swiper-button-next visible + data-arrows="1";
 *                        autoplay on: data-autoplay > 0; loop off: data-loop absent
 * 6. Element structure — .eael-woo-product-carousel-container; .eael-woo-product-carousel;
 *                        .swiper-wrapper; .swiper-slide; .eael-product-carousel; product image;
 *                        icons-wrap; quick-view; view-details
 * 7. Swiper JS init    — .swiper-slide.product is visible after Swiper initialises
 * 8. Interaction       — hover on each preset/variant triggers no JS errors
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.WOO_PRODUCT_CAROUSEL_PAGE_SLUG ?? "woo-product-carousel"}/`;

// -- selectors -----------------------------------------------------------
// DOM shape (from Woo_Product_Carousel::render() + preset-1.php):
//   .{hook}                                                   ← elementor-widget wrapper
//     .swiper-container-wrap.eael-woo-product-carousel-container.{preset}
//       .woocommerce.eael-woo-product-carousel.swiper         ← Swiper target
//         [data-type="preset-1|2|3|4"]
//         [data-effect="slide|coverflow"]
//         [data-autoplay="0|{ms}"]
//         [data-loop="1"]                                     ← only when loop enabled
//         [data-arrows="1"]                                   ← only when arrows enabled
//         .swiper-wrapper.products
//           .product.swiper-slide
//             .eael-product-carousel
//               .product-image-wrap > .image-wrap > img
//               .image-hover-wrap > .icons-wrap.box-style
//                 li.add-to-cart
//                 li.eael-product-quick-view
//                 li.view-details
//               .product-details-wrap > .product-details
//                 .eael-product-title h2
//                 .eael-product-price
//                 .star-rating
//                 .eael-product-excerpt p
//       .swiper-pagination                                    ← dots (default on)
//       .swiper-button-next / .swiper-button-prev             ← arrows (default off)

const container  = (hook: string) => `.${hook} .eael-woo-product-carousel-container`;
const swiper     = (hook: string) => `.${hook} .eael-woo-product-carousel`;
const slide      = (hook: string) => `.${hook} .swiper-slide.product`;
const productBox = (hook: string) => `.${hook} .eael-product-carousel`;
const title      = (hook: string) => `.${hook} .eael-product-title`;
const price      = (hook: string) => `.${hook} .eael-product-price`;
const rating     = (hook: string) => `.${hook} .star-rating`;
const addToCart  = (hook: string) => `.${hook} li.add-to-cart`;
const nextBtn    = (hook: string) => `.${hook} .swiper-button-next`;
const prevBtn    = (hook: string) => `.${hook} .swiper-button-prev`;
const dots       = (hook: string) => `.${hook} .swiper-pagination`;

// -- layout preset map ---------------------------------------------------
const PRESETS: Record<string, string> = {
  "test-wpc-default":  "preset-1",
  "test-wpc-preset-2": "preset-2",
  "test-wpc-preset-3": "preset-3",
  "test-wpc-preset-4": "preset-4",
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

// ========================================================================
// 1. Page health
// ========================================================================

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

// ========================================================================
// 2. Layout presets
// ========================================================================

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

// ========================================================================
// 3. Content toggles
// ========================================================================

test.describe("Content toggles", () => {
  test("default: product title is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(title("test-wpc-default")).first()).toBeVisible();
  });

  test("no-title: .eael-product-title is absent", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(title("test-wpc-no-title")).first()).not.toBeAttached();
  });

  test("default: product price is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(price("test-wpc-default")).first()).toBeVisible();
  });

  test("no-price: .eael-product-price is absent", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(price("test-wpc-no-price")).first()).not.toBeAttached();
  });

  test("default: .star-rating is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(rating("test-wpc-default")).first()).toBeAttached();
  });

  test("no-rating: .star-rating is absent", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(rating("test-wpc-no-rating")).first()).not.toBeAttached();
  });

  test("default: add-to-cart button is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(addToCart("test-wpc-default")).first()).toBeAttached();
  });

  test("no-atc: add-to-cart li is absent", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(addToCart("test-wpc-no-atc")).first()).not.toBeAttached();
  });

  test("static-buttons: .icons-wrap has eael-static-buttons class on swiper", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(swiper("test-wpc-static-buttons")).first()).toHaveClass(
      /eael-static-buttons/
    );
  });

  test("default: .icons-wrap has eael-hover-buttons class on swiper", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(swiper("test-wpc-default")).first()).toHaveClass(
      /eael-hover-buttons/
    );
  });
});

// ========================================================================
// 4. Carousel effects
// ========================================================================

test.describe("Carousel effects", () => {
  test("default (slide): data-effect='slide'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(swiper("test-wpc-default")).first()).toHaveAttribute(
      "data-effect",
      "slide"
    );
  });

  test("coverflow: data-effect='coverflow'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(swiper("test-wpc-coverflow")).first()).toHaveAttribute(
      "data-effect",
      "coverflow"
    );
  });
});

// ========================================================================
// 5. Slider controls
// ========================================================================

test.describe("Slider controls", () => {
  test("default: dots (.swiper-pagination) is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(dots("test-wpc-default")).first()).toBeAttached();
  });

  test("arrows on: .swiper-button-next is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(nextBtn("test-wpc-arrows")).first()).toBeVisible();
  });

  test("arrows on: .swiper-button-prev is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(prevBtn("test-wpc-arrows")).first()).toBeVisible();
  });

  test("arrows on: data-arrows='1' on swiper element", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(swiper("test-wpc-arrows")).first()).toHaveAttribute(
      "data-arrows",
      "1"
    );
  });

  test("autoplay on: data-autoplay is non-zero", async ({ page }) => {
    await openPage(page);
    const val = await page
      .locator(swiper("test-wpc-autoplay"))
      .first()
      .getAttribute("data-autoplay");
    expect(parseInt(val ?? "0", 10)).toBeGreaterThan(0);
  });

  test("default: data-autoplay attribute is a valid non-negative integer", async ({ page }) => {
    await openPage(page);
    const val = await page.locator(swiper("test-wpc-default")).first().getAttribute("data-autoplay");
    // Widget default has autoplay enabled at 2000 ms; verify attribute is a valid number
    expect(val).not.toBeNull();
    expect(Number.isFinite(parseInt(val ?? "", 10))).toBe(true);
    expect(parseInt(val ?? "", 10)).toBeGreaterThanOrEqual(0);
  });

  test("loop on (default): data-loop='1' on swiper element", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(swiper("test-wpc-default")).first()).toHaveAttribute(
      "data-loop",
      "1"
    );
  });

  test("loop off: data-loop attribute is absent", async ({ page }) => {
    await openPage(page);
    const val = await page
      .locator(swiper("test-wpc-no-loop"))
      .first()
      .getAttribute("data-loop");
    expect(val).toBeNull();
  });
});

// ========================================================================
// 6. Element structure
// ========================================================================

test.describe("Element structure", () => {
  test(".eael-woo-product-carousel-container is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-wpc-default")).first()).toBeAttached();
  });

  test(".eael-woo-product-carousel swiper element is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(swiper("test-wpc-default")).first()).toBeAttached();
  });

  test(".eael-product-carousel product box is present inside slide", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(productBox("test-wpc-default")).first()).toBeAttached();
  });

  test("product image is rendered inside .product-image-wrap", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-wpc-default .product-image-wrap img").first()
    ).toBeAttached();
  });

  test("icons-wrap is present inside .image-hover-wrap", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-wpc-default .image-hover-wrap .icons-wrap").first()
    ).toBeAttached();
  });

  test("view-details link is present", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-wpc-default li.view-details a").first()
    ).toBeAttached();
  });

  test("quick-view element is present (default on)", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-wpc-default li.eael-product-quick-view").first()
    ).toBeAttached();
  });
});

// ========================================================================
// 7. Swiper JS initialisation
// ========================================================================

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
      .locator(".test-wpc-default .swiper-wrapper .swiper-slide.product")
      .count();
    expect(count).toBeGreaterThan(0);
  });

  test("coverflow: slides are visible after init", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(slide("test-wpc-coverflow")).first()).toBeVisible({
      timeout: 8000,
    });
  });
});

// ========================================================================
// 8. Interaction
// ========================================================================

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
    for (const hook of ["test-wpc-no-title", "test-wpc-no-price", "test-wpc-no-rating", "test-wpc-no-atc", "test-wpc-static-buttons"]) {
      await page.locator(container(hook)).first().hover();
      await page.waitForTimeout(150);
    }
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover on slider-control variants triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    for (const hook of ["test-wpc-arrows", "test-wpc-autoplay", "test-wpc-no-loop", "test-wpc-coverflow"]) {
      await page.locator(container(hook)).first().hover();
      await page.waitForTimeout(150);
    }
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
