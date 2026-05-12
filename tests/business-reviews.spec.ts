/**
 * Covered: Essential Addons — Business Reviews widget
 *
 * 1. Page health       — HTTP 200, no PHP errors, no JS errors
 * 2. Widget wrapper    — .eael-business-reviews-wrapper present with data-source / data-layout attrs
 * 3. Items container   — .eael-business-reviews-items with layout + preset classes
 * 4. Slider layout     — Swiper container init, .eael-google-reviews-content.swiper rendered
 * 5. Slider presets    — preset-1 / preset-2 / preset-3 class applied on items container
 * 6. Slider navigation — arrows and dots rendered; absent when toggled off
 * 7. Grid layout       — .eael-google-reviews-grid-body rendered
 * 8. Grid presets      — preset class applied on items container
 * 9. Content toggles   — avatar, review text, review time present/absent
 * 10. Reviews rendered — slide items visible (API returned data); error div absent
 * 11. Interaction      — hover over items produces no JS errors
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.BUSINESS_REVIEWS_PAGE_SLUG ?? "business-reviews"}/`;

// -- selectors -----------------------------------------------------------
// DOM shape (from Business_Reviews::print_business_reviews()):
//   .{hook}
//     .eael-business-reviews-wrapper[data-source][data-layout]
//       .eael-business-reviews-items.eael-business-reviews-{slider|grid}.{preset}
//         (slider) .eael-google-reviews-wrapper.{preset}
//                    .eael-google-reviews-slider-header
//                    .eael-google-reviews-items.eael-google-reviews-slider
//                      .eael-google-reviews-content.swiper
//                        .eael-google-reviews-slider-body.swiper-wrapper
//                          .eael-google-reviews-slider-item.swiper-slide
//                            .eael-google-review-reviewer-with-text
//                              .eael-google-review-reviewer-photo (if avatar on)
//                              .eael-google-review-reviewer-name
//                              .eael-google-review-time (if time on)
//                              .eael-google-review-rating
//                              .eael-google-review-text (if text on)
//         (grid)   .eael-google-reviews-grid-header
//                  .eael-google-reviews-grid-body
//         (error)  .eael-business-reviews-error-message

const wrapper      = (hook: string) => `.${hook} .eael-business-reviews-wrapper`;
const itemsWrap    = (hook: string) => `.${hook} .eael-business-reviews-items`;
const swiperEl     = (hook: string) => `.${hook} .eael-google-reviews-content.swiper`;
const sliderBody   = (hook: string) => `.${hook} .eael-google-reviews-slider-body`;
const slideItem    = (hook: string) => `.${hook} .eael-google-reviews-slider-item`;
const arrowWrap    = (hook: string) => `.${hook} .eael-google-reviews-arrows`;
const paginationEl = (hook: string) => `.${hook} .swiper-pagination`;
const gridHeader   = (hook: string) => `.${hook} .eael-google-reviews-grid-header`;
const gridBody     = (hook: string) => `.${hook} .eael-google-reviews-grid-body`;
const reviewerPhoto = (hook: string) => `.${hook} .eael-google-review-reviewer-photo`;
const reviewText   = (hook: string) => `.${hook} .eael-google-review-text`;
const reviewTime   = (hook: string) => `.${hook} .eael-google-review-time`;
const errorMsg     = (hook: string) => `.${hook} .eael-business-reviews-error-message`;

async function openPage(page: Page) {
  await page.goto(PAGE_URL, { waitUntil: "domcontentloaded" });
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
    await page.waitForTimeout(2000);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});

// ============================================================================
// 2. Widget wrapper
// ============================================================================

test.describe("Widget wrapper", () => {
  test("test-br-default: .eael-business-reviews-wrapper is attached", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrapper("test-br-default")).first()).toBeAttached();
  });

  test("test-br-default: data-source = google-reviews", async ({ page }) => {
    await openPage(page);
    const src = await page.locator(wrapper("test-br-default")).first().getAttribute("data-source");
    expect(src).toBe("google-reviews");
  });

  test("test-br-default: data-layout = slider", async ({ page }) => {
    await openPage(page);
    const layout = await page.locator(wrapper("test-br-default")).first().getAttribute("data-layout");
    expect(layout).toBe("slider");
  });

  test("test-br-grid: data-layout = grid", async ({ page }) => {
    await openPage(page);
    const layout = await page.locator(wrapper("test-br-grid")).first().getAttribute("data-layout");
    expect(layout).toBe("grid");
  });
});

// ============================================================================
// 3. Items container
// ============================================================================

test.describe("Items container", () => {
  test("test-br-default: .eael-business-reviews-items has eael-business-reviews-slider class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(itemsWrap("test-br-default")).first()).toHaveClass(
      /eael-business-reviews-slider/
    );
  });

  test("test-br-grid: .eael-business-reviews-items has eael-business-reviews-grid class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(itemsWrap("test-br-grid")).first()).toHaveClass(
      /eael-business-reviews-grid/
    );
  });
});

// ============================================================================
// 4. Slider layout — Swiper init
// ============================================================================

test.describe("Slider layout — Swiper init", () => {
  const sliderHooks = [
    "test-br-default",
    "test-br-slider-p2",
    "test-br-slider-p3",
    "test-br-no-arrows",
    "test-br-no-dots",
    "test-br-no-avatar",
    "test-br-no-text",
    "test-br-no-time",
  ];

  for (const hook of sliderHooks) {
    test(`${hook}: .eael-google-reviews-content.swiper is attached`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(swiperEl(hook)).first()).toBeAttached();
    });

    test(`${hook}: .eael-google-reviews-slider-body.swiper-wrapper is attached`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(sliderBody(hook)).first()).toBeAttached();
    });
  }
});

// ============================================================================
// 5. Slider presets
// ============================================================================

const SLIDER_PRESET_MAP = {
  "test-br-default":   "preset-1",
  "test-br-slider-p2": "preset-2",
  "test-br-slider-p3": "preset-3",
} as const;

test.describe("Slider presets", () => {
  for (const [hook, preset] of Object.entries(SLIDER_PRESET_MAP)) {
    test(`${hook}: items container has class ${preset}`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(itemsWrap(hook)).first()).toHaveClass(new RegExp(preset));
    });
  }
});

// ============================================================================
// 6. Slider navigation
// ============================================================================

test.describe("Slider navigation", () => {
  test("test-br-default: arrows wrapper is attached", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(arrowWrap("test-br-default")).first()).toBeAttached();
  });

  test("test-br-default: swiper-pagination element is attached", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(paginationEl("test-br-default")).first()).toBeAttached();
  });

  test("test-br-no-arrows: .eael-google-reviews-arrows does not render nav buttons", async ({ page }) => {
    await openPage(page);
    // The arrows wrapper may still be in DOM but swiper-button-next should be absent or hidden
    const nextBtn = page.locator(".test-br-no-arrows .swiper-button-next");
    const count = await nextBtn.count();
    // Either absent entirely, or hidden — check visibility if present
    if (count > 0) {
      await expect(nextBtn.first()).not.toBeVisible();
    } else {
      expect(count).toBe(0);
    }
  });

  test("test-br-no-dots: swiper-pagination is absent or empty", async ({ page }) => {
    await openPage(page);
    const pag = page.locator(paginationEl("test-br-no-dots"));
    const count = await pag.count();
    if (count > 0) {
      const text = await pag.first().textContent();
      expect(text?.trim()).toBeFalsy();
    } else {
      expect(count).toBe(0);
    }
  });
});

// ============================================================================
// 7. Grid layout
// ============================================================================

const GRID_HOOKS = ["test-br-grid", "test-br-grid-p2", "test-br-grid-p3"];

test.describe("Grid layout", () => {
  for (const hook of GRID_HOOKS) {
    test(`${hook}: .eael-google-reviews-grid-header is attached`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(gridHeader(hook)).first()).toBeAttached();
    });

    test(`${hook}: .eael-google-reviews-grid-body is attached`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(gridBody(hook)).first()).toBeAttached();
    });
  }
});

// ============================================================================
// 8. Grid presets
// ============================================================================

const GRID_PRESET_MAP = {
  "test-br-grid":    "preset-1",
  "test-br-grid-p2": "preset-2",
  "test-br-grid-p3": "preset-3",
} as const;

test.describe("Grid presets", () => {
  for (const [hook, preset] of Object.entries(GRID_PRESET_MAP)) {
    test(`${hook}: items container has class ${preset}`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(itemsWrap(hook)).first()).toHaveClass(new RegExp(preset));
    });
  }
});

// ============================================================================
// 9. Content toggles
// ============================================================================

test.describe("Content toggles", () => {
  test("test-br-default: reviewer avatar is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(reviewerPhoto("test-br-default")).first()).toBeAttached();
  });

  test("test-br-no-avatar: reviewer avatar is absent", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(reviewerPhoto("test-br-no-avatar"))).toHaveCount(0);
  });

  test("test-br-default: review text is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(reviewText("test-br-default")).first()).toBeAttached();
  });

  test("test-br-no-text: review text is absent", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(reviewText("test-br-no-text"))).toHaveCount(0);
  });

  test("test-br-default: review time is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(reviewTime("test-br-default")).first()).toBeAttached();
  });

  test("test-br-no-time: review time is absent", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(reviewTime("test-br-no-time"))).toHaveCount(0);
  });
});

// ============================================================================
// 10. Reviews rendered (API returned data — no error state)
// ============================================================================

test.describe("Reviews rendered", () => {
  test("test-br-default: no error message div present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(errorMsg("test-br-default"))).toHaveCount(0);
  });

  test("test-br-default: at least one swiper-slide rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(slideItem("test-br-default")).first()).toBeAttached();
  });

  test("test-br-grid: no error message div present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(errorMsg("test-br-grid"))).toHaveCount(0);
  });

  test("test-br-grid: .eael-google-reviews-grid-body has at least one child", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(`${gridBody("test-br-grid")} > *`).count();
    expect(count).toBeGreaterThan(0);
  });
});

// ============================================================================
// 11. Interaction
// ============================================================================

test.describe("Interaction", () => {
  test("hover over slider items triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.waitForTimeout(1000);

    // Swiper slides may be translated off-screen; dispatch mouseover via JS to avoid viewport issues
    await page.evaluate(() => {
      document
        .querySelectorAll(".test-br-default .eael-google-reviews-slider-item")
        .forEach((el) =>
          el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }))
        );
    });
    await page.waitForTimeout(300);

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover over grid items triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    const items = page.locator(`${gridBody("test-br-grid")} > *`);
    const count = await items.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      await items.nth(i).hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
