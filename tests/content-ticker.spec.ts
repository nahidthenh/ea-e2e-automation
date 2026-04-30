import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.CONTENT_TICKER_PAGE_SLUG ?? "content-ticker"}/`;

// ── selectors ─────────────────────────────────────────────────────────────────
// DOM shape (from Content_Ticker::render()):
//   .{hook}                              ← elementor-widget wrapper
//     .eael-ticker-wrap                  ← EA main wrapper
//       .ticker-badge                    ← (optional) tag label
//         span                           ← tag text
//       .eael-ticker                     ← inner ticker wrapper
//         .swiper.swiper-8.eael-content-ticker  ← swiper container
//           data-effect="slide|fade"
//           data-arrows="1"             (if arrows on)
//           data-loop="true"            (if infinite loop)
//           data-grab-cursor="true"     (if grab cursor)
//           data-pause-on-hover="true"  (if pause on hover)
//           dir="rtl"                   (if direction right)
//           .swiper-wrapper
//             .swiper-slide > .ticker-content > a.ticker-content-link (dynamic)
//             .swiper-slide > .ticker-content > a                     (custom/pro)
//       .content-ticker-pagination      ← (optional) arrows container
//         .swiper-button-next
//         .swiper-button-prev

const tickerWrap    = (hook: string) => `.${hook} .eael-ticker-wrap`;
const badge         = (hook: string) => `.${hook} .ticker-badge`;
const badgeText     = (hook: string) => `.${hook} .ticker-badge span`;
const slider        = (hook: string) => `.${hook} .eael-content-ticker`;
const slidesWrapper = (hook: string) => `.${hook} .eael-content-ticker .swiper-wrapper`;
const arrowsWrap    = (hook: string) => `.${hook} .content-ticker-pagination`;
const nextBtn       = (hook: string) => `.${hook} .content-ticker-pagination .swiper-button-next`;
const prevBtn       = (hook: string) => `.${hook} .content-ticker-pagination .swiper-button-prev`;

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

// ══════════════════════════════════════════════════════════════════════════════
// 1. Page health
// ══════════════════════════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════════════════════════
// 2. Animation effects
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Animation effects", () => {
  test("default instance has data-effect='slide'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(slider("test-ct-default")).first()).toHaveAttribute(
      "data-effect",
      "slide"
    );
  });

  test("fade instance has data-effect='fade'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(slider("test-ct-effect-fade")).first()).toHaveAttribute(
      "data-effect",
      "fade"
    );
  });

  test("direction-right instance has dir='rtl' on swiper container", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(slider("test-ct-direction-right")).first()).toHaveAttribute(
      "dir",
      "rtl"
    );
  });

  test("default instance (left direction) does not have dir='rtl'", async ({ page }) => {
    await openPage(page);
    const dir = await page
      .locator(slider("test-ct-default"))
      .first()
      .getAttribute("dir");
    expect(dir).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Ticker structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Ticker structure", () => {
  test("eael-ticker-wrap is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(tickerWrap("test-ct-default")).first()).toBeAttached();
  });

  test("swiper container (.eael-content-ticker) is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(slider("test-ct-default")).first()).toBeAttached();
  });

  test("swiper-wrapper is present inside swiper container", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(slidesWrapper("test-ct-default")).first()).toBeAttached();
  });

  test("at least one swiper-slide is rendered (pro-custom has guaranteed content)", async ({ page }) => {
    await openPage(page);
    const slides = page.locator(
      `.test-ct-pro-custom .eael-content-ticker .swiper-wrapper .swiper-slide:not(.swiper-slide-duplicate)`
    );
    await expect(slides.first()).toBeAttached();
  });

  test("slide content has .ticker-content node (pro-custom)", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ct-pro-custom .ticker-content").first()
    ).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Arrows configuration
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Arrows configuration", () => {
  test("default instance renders arrows container", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(arrowsWrap("test-ct-default")).first()).toBeAttached();
  });

  test("default instance has data-arrows='1' on swiper container", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(slider("test-ct-default")).first()).toHaveAttribute(
      "data-arrows",
      "1"
    );
  });

  test("default instance renders next-arrow button", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(nextBtn("test-ct-default")).first()).toBeAttached();
  });

  test("default instance renders prev-arrow button", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(prevBtn("test-ct-default")).first()).toBeAttached();
  });

  test("arrows-off instance does not render arrows container", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(arrowsWrap("test-ct-arrows-off"))).toHaveCount(0);
  });

  test("arrows-off instance does not have data-arrows attribute", async ({ page }) => {
    await openPage(page);
    const attr = await page
      .locator(slider("test-ct-arrows-off"))
      .first()
      .getAttribute("data-arrows");
    expect(attr).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Playback controls
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Playback controls", () => {
  test("default instance has data-loop='1' (infinite loop on)", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(slider("test-ct-default")).first()).toHaveAttribute(
      "data-loop",
      "1"
    );
  });

  test("loop-off instance does not have data-loop attribute", async ({ page }) => {
    await openPage(page);
    const attr = await page
      .locator(slider("test-ct-loop-off"))
      .first()
      .getAttribute("data-loop");
    expect(attr).toBeNull();
  });

  test("autoplay-off instance data-autoplay is '999999' (disabled sentinel)", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(slider("test-ct-autoplay-off")).first()).toHaveAttribute(
      "data-autoplay",
      "999999"
    );
  });

  test("pause-on-hover instance has data-pause-on-hover='true'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(slider("test-ct-pause-hover")).first()).toHaveAttribute(
      "data-pause-on-hover",
      "true"
    );
  });

  test("default instance does not have data-pause-on-hover", async ({ page }) => {
    await openPage(page);
    const attr = await page
      .locator(slider("test-ct-default"))
      .first()
      .getAttribute("data-pause-on-hover");
    expect(attr).toBeNull();
  });

  test("grab-cursor instance has data-grab-cursor='1'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(slider("test-ct-grab-cursor")).first()).toHaveAttribute(
      "data-grab-cursor",
      "1"
    );
  });

  test("default instance does not have data-grab-cursor", async ({ page }) => {
    await openPage(page);
    const attr = await page
      .locator(slider("test-ct-default"))
      .first()
      .getAttribute("data-grab-cursor");
    expect(attr).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Tag variants
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Tag variants", () => {
  test("default instance renders .ticker-badge with text 'Trending Today'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(badge("test-ct-default")).first()).toBeVisible();
    const text = await page.locator(badgeText("test-ct-default")).first().textContent();
    expect(text?.trim()).toBe("Trending Today");
  });

  test("custom-tag instance renders .ticker-badge with text 'Latest News'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(badge("test-ct-custom-tag")).first()).toBeVisible();
    const text = await page.locator(badgeText("test-ct-custom-tag")).first().textContent();
    expect(text?.trim()).toBe("Latest News");
  });

  test("no-tag instance does not render .ticker-badge", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(badge("test-ct-no-tag"))).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Pro custom content
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Pro custom content", () => {
  test("pro-custom instance renders 'Breaking' tag", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(badgeText("test-ct-pro-custom")).first().textContent();
    expect(text?.trim()).toBe("Breaking");
  });

  test("pro-custom instance renders 3 original slides (excluding Swiper loop duplicates)", async ({ page }) => {
    await openPage(page);
    const slides = page.locator(
      ".test-ct-pro-custom .eael-content-ticker .swiper-wrapper .swiper-slide:not(.swiper-slide-duplicate)"
    );
    expect(await slides.count()).toBe(3);
  });

  test("pro-custom first slide contains 'Breaking: New Feature Launched!'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator('.test-ct-pro-custom .swiper-slide:not(.swiper-slide-duplicate)[data-swiper-slide-index="0"]')
    ).toContainText("Breaking: New Feature Launched!");
  });

  test("pro-custom second slide has external link (target=_blank)", async ({ page }) => {
    await openPage(page);
    const link = page
      .locator('.test-ct-pro-custom .swiper-slide:not(.swiper-slide-duplicate)[data-swiper-slide-index="1"] a')
      .first();
    await expect(link).toHaveAttribute("target", "_blank");
  });

  test("pro-custom third slide has nofollow link", async ({ page }) => {
    await openPage(page);
    const rel = await page
      .locator('.test-ct-pro-custom .swiper-slide:not(.swiper-slide-duplicate)[data-swiper-slide-index="2"] a')
      .first()
      .getAttribute("rel");
    expect(rel).toContain("nofollow");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("ticker content link is keyboard-focusable (pro-custom has guaranteed links)", async ({ page }) => {
    await openPage(page);
    const link = page
      .locator('.test-ct-pro-custom .swiper-slide:not(.swiper-slide-duplicate) .ticker-content a')
      .first();
    await link.focus();
    await expect(link).toBeFocused();
  });

  test("hover over each ticker instance triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    // test-ct-no-tag is excluded: no badge + empty dynamic swiper = zero-height element
    const hooks = [
      "test-ct-default",
      "test-ct-effect-fade",
      "test-ct-direction-right",
      "test-ct-arrows-off",
      "test-ct-autoplay-off",
      "test-ct-loop-off",
      "test-ct-pause-hover",
      "test-ct-grab-cursor",
      "test-ct-custom-tag",
      "test-ct-pro-custom",
    ];

    for (const hook of hooks) {
      await page.locator(tickerWrap(hook)).first().hover({ force: true });
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking next arrow in default instance causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(nextBtn("test-ct-default")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});

  }
});
