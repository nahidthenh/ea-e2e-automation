/**
 * Covered: Essential Addons — Woo Product Rating widget (Free)
 *
 * NOTE: Free widget. Requires WooCommerce active. The widget resolves the
 * product from the global $post, so the test URL must be a WC product
 * permalink (seeded by setup-woo-single-product-widgets-page.php).
 * The setup script adds a 4-star review to the test product so the
 * rating widget renders real filled stars.
 *
 * 1. Page health          — HTTP 200, no PHP errors, no JS errors
 * 2. Widget wrapper       — .eael-single-product-rating renders per instance
 * 3. WC rating container  — .woocommerce-product-rating renders
 * 4. Star row             — .eael-product-rating-wrap with 5 star spans
 * 5. Filled stars         — at least 1 .eael-product-rating.filled (4-star review)
 * 6. Review count link    — .woocommerce-review-link present/absent
 * 7. Caption text         — before/after caption text and custom caption
 * 8. Interaction          — hover triggers no JS errors
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.WOO_PRODUCT_RATING_PAGE_SLUG ?? "product/ea-widget-test-product"}/`;

// ── DOM shape ─────────────────────────────────────────────────────────────
//
//   .{hook}
//     .eael-single-product-rating
//       .woocommerce-product-rating
//         .eael-product-rating-wrap
//           span.eael-product-rating.filled   × N  (N = ceil(avg_rating))
//           span.eael-product-rating.unfilled × (5 - N)
//         a.woocommerce-review-link[href="#reviews"]  ← only when show_review_count=yes
//           span.before-rating
//           span.count > span.count_number + span.count_text
//           span.after-rating

const wrapper     = (hook: string) => `.${hook} .eael-single-product-rating`;
const ratingBox   = (hook: string) => `.${hook} .woocommerce-product-rating`;
const starWrap    = (hook: string) => `.${hook} .eael-product-rating-wrap`;
const stars       = (hook: string) => `.${hook} .eael-product-rating-wrap .eael-product-rating`;
const filledStars = (hook: string) => `.${hook} .eael-product-rating-wrap .eael-product-rating.filled`;
const reviewLink  = (hook: string) => `.${hook} .woocommerce-review-link`;
const beforeCap   = (hook: string) => `.${hook} .woocommerce-review-link .before-rating`;
const afterCap    = (hook: string) => `.${hook} .woocommerce-review-link .after-rating`;

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
    "test-wpr-default",
    "test-wpr-no-count",
    "test-wpr-style-2",
    "test-wpr-style-3",
    "test-wpr-custom-caption",
  ];

  for (const hook of hooks) {
    test(`${hook}: .eael-single-product-rating is attached`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrapper(hook)).first()).toBeAttached();
    });
  }
});

// ============================================================================
// 3. WC rating container
// ============================================================================

test.describe("WC rating container", () => {
  test("test-wpr-default: .woocommerce-product-rating is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(ratingBox("test-wpr-default")).first()).toBeAttached();
  });
});

// ============================================================================
// 4. Star row — 5 total stars
// ============================================================================

test.describe("Star row", () => {
  const hooks = [
    "test-wpr-default",
    "test-wpr-no-count",
    "test-wpr-style-2",
    "test-wpr-style-3",
  ];

  for (const hook of hooks) {
    test(`${hook}: .eael-product-rating-wrap is rendered`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(starWrap(hook)).first()).toBeAttached();
    });

    test(`${hook}: exactly 5 star spans are rendered`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(stars(hook))).toHaveCount(5);
    });
  }
});

// ============================================================================
// 5. Filled stars (product has a 4-star review)
// ============================================================================

test.describe("Filled stars", () => {
  const hooks = [
    "test-wpr-default",
    "test-wpr-no-count",
    "test-wpr-style-2",
    "test-wpr-style-3",
  ];

  for (const hook of hooks) {
    test(`${hook}: at least 1 filled star is rendered`, async ({ page }) => {
      await openPage(page);
      const count = await page.locator(filledStars(hook)).count();
      expect(count, `${hook}: expected at least one filled star`).toBeGreaterThanOrEqual(1);
    });

    test(`${hook}: at least 1 unfilled star is rendered`, async ({ page }) => {
      await openPage(page);
      const total    = await page.locator(stars(hook)).count();
      const filled   = await page.locator(filledStars(hook)).count();
      const unfilled = total - filled;
      expect(unfilled, `${hook}: expected at least one unfilled star`).toBeGreaterThanOrEqual(1);
    });
  }
});

// ============================================================================
// 6. Review count link present / absent
// ============================================================================

test.describe("Review count link", () => {
  test("test-wpr-default: .woocommerce-review-link is rendered when show_review_count=yes", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(reviewLink("test-wpr-default")).first()).toBeAttached();
  });

  test("test-wpr-default: review link href points to #reviews", async ({ page }) => {
    await openPage(page);
    const href = await page.locator(reviewLink("test-wpr-default")).first().getAttribute("href");
    expect(href).toContain("#reviews");
  });

  test("test-wpr-no-count: .woocommerce-review-link is absent when show_review_count=''", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(reviewLink("test-wpr-no-count"))).toHaveCount(0);
  });
});

// ============================================================================
// 7. Caption text
// ============================================================================

test.describe("Caption text", () => {
  test("test-wpr-default: before-rating span shows '( '", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(beforeCap("test-wpr-default")).first().textContent();
    expect(text?.trim()).toBe("(");
  });

  test("test-wpr-default: after-rating span shows ' )'", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(afterCap("test-wpr-default")).first().textContent();
    expect(text?.trim()).toBe(")");
  });

  test("test-wpr-custom-caption: before-rating shows '[ '", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(beforeCap("test-wpr-custom-caption")).first().textContent();
    expect(text?.trim()).toBe("[");
  });

  test("test-wpr-custom-caption: after-rating shows ' ]'", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(afterCap("test-wpr-custom-caption")).first().textContent();
    expect(text?.trim()).toBe("]");
  });
});

// ============================================================================
// 8. Interaction
// ============================================================================

test.describe("Interaction", () => {
  const hooks = [
    "test-wpr-default",
    "test-wpr-no-count",
    "test-wpr-style-2",
    "test-wpr-style-3",
    "test-wpr-custom-caption",
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
