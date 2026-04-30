import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.TESTIMONIAL_SLIDER_PAGE_SLUG ?? "testimonial-slider"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Testimonial_Slider::render()):
//   .{hook}                                              ← Elementor widget wrapper
//     .swiper-container-wrap.eael-testimonial-slider.{style}  ← outer wrap
//       .swiper.eael-testimonial-slider-main             ← Swiper container
//         .swiper-wrapper
//           .eael-testimonial-item.swiper-slide          ← per-item slide
//             .eael-testimonial-item-inner
//               .eael-testimonial-image                  ← avatar block
//                 figure > img
//               .eael-testimonial-content                ← content block
//                 .eael-testimonial-quote                ← quote icon span
//                 .eael-testimonial-text                 ← description
//                 .testimonial-star-rating               ← rating stars
//                 .eael-testimonial-user                 ← reviewer name
//                 .eael-testimonial-user-company         ← company name
//       .swiper-pagination
//       .swiper-button-next / .swiper-button-prev

const wrap  = (hook: string) => `.${hook} .eael-testimonial-slider`;
const slide = (hook: string) => `.${hook} .eael-testimonial-item`;
const name  = (hook: string) => `.${hook} .eael-testimonial-user`;
const desc  = (hook: string) => `.${hook} .eael-testimonial-text`;

// ── skin map: hook → skin CSS class applied to the outer wrap ─────────────
const SKIN_MAP: Record<string, string> = {
  "test-ts-default":              "default-style",
  "test-ts-classic":              "classic-style",
  "test-ts-simple":               "simple-layout",
  "test-ts-icon-right":           "icon-img-right-content",
  "test-ts-middle":               "middle-style",
  "test-ts-content-top-inline":   "content-top-icon-title-inline",
  "test-ts-icon-left":            "icon-img-left-content",
  "test-ts-content-bottom-inline":"content-bottom-icon-title-inline",
};

// ── helpers ───────────────────────────────────────────────────────────────

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
// 2. Testimonial Slider skins
// ══════════════════════════════════════════════════════════════════════════

test.describe("Testimonial Slider skins", () => {
  for (const [hook, skinClass] of Object.entries(SKIN_MAP)) {
    test(`${skinClass} — outer wrap has correct skin class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrap(hook)).first()).toHaveClass(
        new RegExp(skinClass)
      );
    });

    test(`${skinClass} — first slide is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(slide(hook)).first()).toBeVisible();
    });

    test(`${skinClass} — reviewer name "Alice Anderson" rendered`, async ({ page }) => {
      await openPage(page);
      // Swiper loop mode clones slides and prepends them, so .first() may be a
      // clone of the last item. Check that at least one name element holds the text.
      await expect(
        page.locator(name(hook)).filter({ hasText: "Alice Anderson" }).first()
      ).toBeAttached();
    });

    test(`${skinClass} — description text rendered`, async ({ page }) => {
      await openPage(page);
      const descText = await page.locator(desc(hook)).first().textContent();
      expect(descText?.trim().length).toBeGreaterThan(0);
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 3. Quote icon configuration
// ══════════════════════════════════════════════════════════════════════════

test.describe("Quote icon", () => {
  test("quote icon present when enabled (default style)", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ts-default .eael-testimonial-quote").first()
    ).toBeAttached();
  });

  test("quote icon absent when disabled (test-ts-no-quote)", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ts-no-quote .eael-testimonial-quote")
    ).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 4. Navigation — arrows and dots
// ══════════════════════════════════════════════════════════════════════════

test.describe("Navigation controls", () => {
  test("arrows present when enabled (default)", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ts-default .swiper-button-next").first()
    ).toBeAttached();
    await expect(
      page.locator(".test-ts-default .swiper-button-prev").first()
    ).toBeAttached();
  });

  test("arrows absent when disabled (test-ts-no-arrows)", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ts-no-arrows .swiper-button-next")
    ).toHaveCount(0);
    await expect(
      page.locator(".test-ts-no-arrows .swiper-button-prev")
    ).toHaveCount(0);
  });

  test("dots present when enabled (default)", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ts-default .swiper-pagination").first()
    ).toBeAttached();
  });

  test("dots absent when disabled (test-ts-no-dots)", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ts-no-dots .swiper-pagination")
    ).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 5. Alignment — CSS class applied to each slide
// ══════════════════════════════════════════════════════════════════════════

test.describe("Alignment", () => {
  test("center-aligned slides carry eael-testimonial-align-center class", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ts-align-center .eael-testimonial-item").first()
    ).toHaveClass(/eael-testimonial-align-center/);
  });

  test("right-aligned slides carry eael-testimonial-align-right class", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ts-align-right .eael-testimonial-item").first()
    ).toHaveClass(/eael-testimonial-align-right/);
  });

  test("default alignment carries eael-testimonial-align-left class", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ts-default .eael-testimonial-item").first()
    ).toHaveClass(/eael-testimonial-align-left/);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 6. Avatar
// ══════════════════════════════════════════════════════════════════════════

test.describe("Avatar", () => {
  test("avatar image block present when enabled", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ts-default .eael-testimonial-image").first()
    ).toBeAttached();
  });

  test("avatar image block absent when disabled (test-ts-no-avatar)", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ts-no-avatar .eael-testimonial-image")
    ).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 7. Rating stars
// ══════════════════════════════════════════════════════════════════════════

test.describe("Rating stars", () => {
  test("star rating element is present in default widget", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ts-default .testimonial-star-rating").first()
    ).toBeAttached();
  });

  test("five stars rendered in first slide (rating-five)", async ({ page }) => {
    await openPage(page);
    const stars = page.locator(
      ".test-ts-default .eael-testimonial-item:first-child .testimonial-star-rating li"
    );
    await expect(stars).toHaveCount(5);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 8. Carousel effect data attribute
// ══════════════════════════════════════════════════════════════════════════

test.describe("Carousel effect", () => {
  test("slide effect: data-effect is 'slide' by default", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ts-default .eael-testimonial-slider-main").first()
    ).toHaveAttribute("data-effect", "slide");
  });

  test("fade effect: data-effect is 'fade'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ts-effect-fade .eael-testimonial-slider-main").first()
    ).toHaveAttribute("data-effect", "fade");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 9. Element structure
// ══════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("outer wrap contains class eael-testimonial-slider", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ts-default .eael-testimonial-slider").first()
    ).toBeAttached();
  });

  test("Swiper wrapper is present inside the slider", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ts-default .swiper-wrapper").first()
    ).toBeAttached();
  });

  test("each widget has 3 repeater slides seeded", async ({ page }) => {
    await openPage(page);
    const slides = page.locator(".test-ts-default .eael-testimonial-item");
    const count = await slides.count();
    // Swiper may clone slides for looping; at minimum the 3 originals must exist.
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("user name element is a <p> tag", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(".test-ts-default .eael-testimonial-user")
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("P");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 10. Interaction
// ══════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover on each skin instance triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of Object.keys(SKIN_MAP)) {
      // Exclude Swiper loop-clone slides (.swiper-slide-duplicate) — they are
      // off-screen and hovering on them triggers internal Swiper errors.
      await page
        .locator(`.${hook} .eael-testimonial-item:not(.swiper-slide-duplicate)`)
        .first()
        .hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking prev/next arrows causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    const next = page.locator(".test-ts-default .swiper-button-next").first();
    const prev = page.locator(".test-ts-default .swiper-button-prev").first();

    await next.click();
    await page.waitForTimeout(300);
    await prev.click();
    await page.waitForTimeout(300);

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});

  }
});
