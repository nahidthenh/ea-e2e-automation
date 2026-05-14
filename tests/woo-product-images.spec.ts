/**
 * Covered: Essential Addons — Woo Product Images widget (Free)
 *
 * NOTE: Free widget. Requires WooCommerce active. The widget resolves the
 * product from the global $post, so the test URL must be a WC product
 * permalink (seeded by setup-woo-single-product-widgets-page.php).
 *
 * 1. Page health         — HTTP 200, no PHP errors, no JS errors
 * 2. Widget wrapper      — .eael-single-product-images renders per instance
 * 3. Main slider         — .product_image_slider and swiper container present
 * 4. Thumbnail position  — eael-pi-thumb-{bottom|left|right} class on wrapper
 * 5. Thumbnail strip     — .product_image_slider__thumbs present/absent
 * 6. Zoom trigger        — .product_image_slider__trigger present/absent
 * 7. Pagination dots     — .swiper-pagination present when enabled
 * 8. Sale flash          — span.onsale present/absent (product has sale price)
 * 9. Interaction         — hover triggers no JS errors
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.WOO_PRODUCT_IMAGES_PAGE_SLUG ?? "product/ea-widget-test-product"}/`;

// ── DOM shape ─────────────────────────────────────────────────────────────
//
//   .{hook}
//     .eael-single-product-images.eael-pi-thumb-{position}
//       .product_image_slider
//         .product_image_slider__container
//           span.onsale            ← only when sale flash on AND product on sale
//           .swiper                ← main slider
//             .product_image_slider__trigger  ← only when zoom enabled
//             .swiper-wrapper > .swiper-slide > .image_slider__image > img
//             .swiper-pagination   ← only when pagination on
//             .swiper-button-prev / .swiper-button-next  ← only when nav on
//         .product_image_slider__thumbs  ← only when thumbnails on

const wrapper   = (hook: string) => `.${hook} .eael-single-product-images`;
const slider    = (hook: string) => `.${hook} .product_image_slider`;
const swiper    = (hook: string) => `.${hook} .product_image_slider__container .swiper`;
const thumbs    = (hook: string) => `.${hook} .product_image_slider__thumbs`;
const zoom      = (hook: string) => `.${hook} .product_image_slider__trigger`;
const pagination = (hook: string) => `.${hook} .swiper-pagination`;
const saleFlash = (hook: string) => `.${hook} .eael-single-product-images span.onsale`;

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
    "test-wpi-default",
    "test-wpi-thumb-left",
    "test-wpi-thumb-right",
    "test-wpi-no-thumbs",
    "test-wpi-no-zoom",
    "test-wpi-pagination",
    "test-wpi-no-sale-flash",
  ];

  for (const hook of hooks) {
    test(`${hook}: .eael-single-product-images is attached`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrapper(hook)).first()).toBeAttached();
    });
  }
});

// ============================================================================
// 3. Main slider
// ============================================================================

test.describe("Main slider structure", () => {
  test("test-wpi-default: .product_image_slider is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(slider("test-wpi-default")).first()).toBeAttached();
  });

  test("test-wpi-default: swiper container is rendered inside slider", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(swiper("test-wpi-default")).first()).toBeAttached();
  });
});

// ============================================================================
// 4. Thumbnail position class
// ============================================================================

test.describe("Thumbnail position class", () => {
  const positionMap: Record<string, string> = {
    "test-wpi-default":    "eael-pi-thumb-bottom",
    "test-wpi-thumb-left": "eael-pi-thumb-left",
    "test-wpi-thumb-right":"eael-pi-thumb-right",
  };

  for (const [hook, expectedClass] of Object.entries(positionMap)) {
    test(`${hook}: .eael-single-product-images carries class "${expectedClass}"`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrapper(hook)).first()).toHaveClass(new RegExp(expectedClass));
    });
  }
});

// ============================================================================
// 5. Thumbnail strip present / absent
// ============================================================================

test.describe("Thumbnail strip", () => {
  test("test-wpi-default: .product_image_slider__thumbs is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(thumbs("test-wpi-default")).first()).toBeAttached();
  });

  test("test-wpi-thumb-left: .product_image_slider__thumbs is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(thumbs("test-wpi-thumb-left")).first()).toBeAttached();
  });

  test("test-wpi-no-thumbs: .product_image_slider__thumbs is not rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(thumbs("test-wpi-no-thumbs"))).toHaveCount(0);
  });
});

// ============================================================================
// 6. Zoom trigger
// ============================================================================

test.describe("Zoom trigger", () => {
  test("test-wpi-default: .product_image_slider__trigger is rendered when zoom enabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(zoom("test-wpi-default")).first()).toBeAttached();
  });

  test("test-wpi-no-zoom: .product_image_slider__trigger is not rendered when zoom disabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(zoom("test-wpi-no-zoom"))).toHaveCount(0);
  });
});

// ============================================================================
// 7. Pagination dots
// ============================================================================

test.describe("Pagination dots", () => {
  test("test-wpi-pagination: .swiper-pagination is rendered when enabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(pagination("test-wpi-pagination")).first()).toBeAttached();
  });

  test("test-wpi-default: .swiper-pagination is not rendered when disabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(pagination("test-wpi-default"))).toHaveCount(0);
  });
});

// ============================================================================
// 8. Sale flash
// ============================================================================

test.describe("Sale flash", () => {
  test("test-wpi-default: span.onsale is rendered (product has sale price, flash on)", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(saleFlash("test-wpi-default")).first()).toBeAttached();
  });

  test("test-wpi-no-sale-flash: span.onsale is not rendered when flash disabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(saleFlash("test-wpi-no-sale-flash"))).toHaveCount(0);
  });
});

// ============================================================================
// 9. Interaction
// ============================================================================

test.describe("Interaction", () => {
  const hooks = [
    "test-wpi-default",
    "test-wpi-thumb-left",
    "test-wpi-thumb-right",
    "test-wpi-no-thumbs",
    "test-wpi-no-zoom",
    "test-wpi-pagination",
    "test-wpi-no-sale-flash",
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
