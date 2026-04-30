import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.LOGO_CAROUSEL_PAGE_SLUG ?? "logo-carousel"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Logo_Carousel::render()):
//   .{hook}                                        ← elementor-widget wrapper
//     .swiper-container-wrap.eael-logo-carousel-wrap
//       .swiper.eael-logo-carousel                 ← swiper instance
//         [data-effect] [data-items] [data-autoplay] [data-loop] [data-arrows]
//         [class: grayscale-normal | eael-marquee-carousel] [dir="rtl"]
//         .swiper-wrapper
//           .swiper-slide
//             .eael-lc-logo-wrap
//               .eael-lc-logo[.eael-lc-tooltip]   ← logo box
//                 [<a target="_blank" | rel="nofollow">]
//                   <img class="eael-lc-img-src">
//               [<h4 class="eael-logo-carousel-title">] ← visible title
//       [.swiper-pagination]                       ← dots
//       [.swiper-button-next]                      ← next arrow
//       [.swiper-button-prev]                      ← prev arrow

const carousel   = (hook: string) => `.${hook} .eael-logo-carousel`;
const wrap       = (hook: string) => `.${hook} .eael-logo-carousel-wrap`;
const slide      = (hook: string) => `.${hook} .swiper-slide`;
const logoBox    = (hook: string) => `.${hook} .eael-lc-logo`;
const logoImg    = (hook: string) => `.${hook} .eael-lc-img-src`;
const logoTitle  = (hook: string) => `.${hook} .eael-logo-carousel-title`;
const nextArrow  = (hook: string) => `.${hook} .swiper-button-next`;
const prevArrow  = (hook: string) => `.${hook} .swiper-button-prev`;
const pagination = (hook: string) => `.${hook} .swiper-pagination`;

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
// 2. Carousel structure — smoke tests
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Carousel structure", () => {
  test("default carousel wrapper is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrap("test-lc-default")).first()).toBeAttached();
  });

  test("default carousel swiper container is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(carousel("test-lc-default")).first()).toBeAttached();
  });

  test("default carousel has swiper slides", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(slide("test-lc-default")).count();
    expect(count).toBeGreaterThan(0);
  });

  test("default carousel renders logo images", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(logoImg("test-lc-default")).count();
    expect(count).toBeGreaterThan(0);
  });

  test("logo images have eael-lc-img-src class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(logoImg("test-lc-default")).first()).toBeAttached();
  });

  test("logo boxes have eael-lc-logo class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(logoBox("test-lc-default")).first()).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Carousel effects — data-effect attribute
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Carousel effects", () => {
  const effectMap: Record<string, string> = {
    "test-lc-default":         "slide",
    "test-lc-effect-fade":     "fade",
    "test-lc-effect-coverflow":"coverflow",
  };

  for (const [hook, effect] of Object.entries(effectMap)) {
    test(`${effect} effect: data-effect="${effect}" is set`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(carousel(hook)).first()).toHaveAttribute(
        "data-effect",
        effect
      );
    });
  }

  test("fade carousel has swiper slides", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(slide("test-lc-effect-fade")).count();
    expect(count).toBeGreaterThan(0);
  });

  test("coverflow carousel has swiper slides", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(slide("test-lc-effect-coverflow")).count();
    expect(count).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Marquee mode
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Marquee mode", () => {
  test("marquee carousel has eael-marquee-carousel class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(carousel("test-lc-marquee")).first()).toHaveClass(
      /eael-marquee-carousel/
    );
  });

  test("marquee carousel data-autoplay is 0", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(carousel("test-lc-marquee")).first()).toHaveAttribute(
      "data-autoplay",
      "0"
    );
  });

  test("marquee carousel has no navigation arrows", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(nextArrow("test-lc-marquee"))).toHaveCount(0);
    await expect(page.locator(prevArrow("test-lc-marquee"))).toHaveCount(0);
  });

  test("marquee carousel has no dots pagination", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(pagination("test-lc-marquee"))).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Navigation variants — arrows and dots
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Navigation variants", () => {
  test("default carousel shows next arrow", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(nextArrow("test-lc-default")).first()).toBeAttached();
  });

  test("default carousel shows prev arrow", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(prevArrow("test-lc-default")).first()).toBeAttached();
  });

  test("default carousel shows dots pagination", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(pagination("test-lc-default")).first()).toBeAttached();
  });

  test("no-arrows carousel omits swiper-button-next", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(nextArrow("test-lc-no-arrows"))).toHaveCount(0);
  });

  test("no-arrows carousel omits swiper-button-prev", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(prevArrow("test-lc-no-arrows"))).toHaveCount(0);
  });

  test("no-arrows carousel still renders slides", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(slide("test-lc-no-arrows")).count();
    expect(count).toBeGreaterThan(0);
  });

  test("no-dots carousel omits swiper-pagination", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(pagination("test-lc-no-dots"))).toHaveCount(0);
  });

  test("no-dots carousel still renders slides", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(slide("test-lc-no-dots")).count();
    expect(count).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Title visibility
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Title visibility", () => {
  test("titles hidden by default: no .eael-logo-carousel-title elements", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(logoTitle("test-lc-default"))).toHaveCount(0);
  });

  test("titles visible: .eael-logo-carousel-title elements are present", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(logoTitle("test-lc-title-visible")).count();
    expect(count).toBeGreaterThan(0);
  });

  test("title-visible: first title contains expected text", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(logoTitle("test-lc-title-visible")).first().textContent();
    expect(text?.trim()).toBeTruthy();
  });

  test("title-visible: title tag defaults to h4", async ({ page }) => {
    await openPage(page);
    const tag = await page.locator(logoTitle("test-lc-title-visible")).first().evaluate((el) => el.tagName);
    expect(tag).toBe("H4");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Grayscale
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Grayscale", () => {
  test("grayscale-normal: carousel has grayscale-normal class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(carousel("test-lc-grayscale")).first()).toHaveClass(
      /grayscale-normal/
    );
  });

  test("default carousel does not have grayscale-normal class", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(carousel("test-lc-default")).first().getAttribute("class") ?? "";
    expect(cls).not.toContain("grayscale-normal");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Link behaviour
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Link behaviour", () => {
  test("external link: logo anchor has target='_blank'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.test-lc-link-external .eael-lc-logo a`).first()
    ).toHaveAttribute("target", "_blank");
  });

  test("external link: logo anchor href points to configured URL", async ({ page }) => {
    await openPage(page);
    const href = await page.locator(`.test-lc-link-external .eael-lc-logo a`).first().getAttribute("href");
    expect(href).toContain("essential-addons.com");
  });

  test("nofollow link: logo anchor has rel containing 'nofollow'", async ({ page }) => {
    await openPage(page);
    const rel = await page.locator(`.test-lc-link-nofollow .eael-lc-logo a`).first().getAttribute("rel");
    expect(rel).toContain("nofollow");
  });

  test("default carousel logos have no anchor wrapper", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(`.test-lc-default .eael-lc-logo a`)).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. Tooltip
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Tooltip", () => {
  test("tooltip-enabled logo has eael-lc-tooltip class", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.test-lc-tooltip .eael-lc-tooltip`).first()
    ).toBeAttached();
  });

  test("tooltip logo has data-content attribute", async ({ page }) => {
    await openPage(page);
    const content = await page.locator(`.test-lc-tooltip .eael-lc-tooltip`).first().getAttribute("data-content");
    expect(content).toBeTruthy();
  });

  test("tooltip logo has data-side attribute", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.test-lc-tooltip .eael-lc-tooltip`).first()
    ).toHaveAttribute("data-side", "top");
  });

  test("tooltip logo has data-trigger attribute", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.test-lc-tooltip .eael-lc-tooltip`).first()
    ).toHaveAttribute("data-trigger", "hover");
  });

  test("non-tooltip logos do not have eael-lc-tooltip class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(`.test-lc-default .eael-lc-tooltip`)).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. Direction (RTL)
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Direction", () => {
  test("RTL direction: carousel has dir='rtl'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(carousel("test-lc-direction-rtl")).first()).toHaveAttribute(
      "dir",
      "rtl"
    );
  });

  test("default (LTR) carousel has no dir attribute", async ({ page }) => {
    await openPage(page);
    const dir = await page.locator(carousel("test-lc-default")).first().getAttribute("dir");
    expect(dir).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. Autoplay
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Autoplay", () => {
  test("autoplay-on: data-autoplay is set to a numeric value", async ({ page }) => {
    await openPage(page);
    const val = await page.locator(carousel("test-lc-default")).first().getAttribute("data-autoplay");
    expect(Number(val)).toBeGreaterThan(0);
  });

  test("autoplay-off: data-autoplay is 999999 (sentinel for disabled)", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(carousel("test-lc-autoplay-off")).first()).toHaveAttribute(
      "data-autoplay",
      "999999"
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. Element structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("logo image is rendered as an <img> tag", async ({ page }) => {
    await openPage(page);
    const tag = await page.locator(logoImg("test-lc-default")).first().evaluate((el) => el.tagName);
    expect(tag).toBe("IMG");
  });

  test("logo image has eael-lc-img-src class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(logoImg("test-lc-default")).first()).toHaveClass(/eael-lc-img-src/);
  });

  test("carousel has swiper-container-wrap class on outer wrapper", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrap("test-lc-default")).first()).toHaveClass(/swiper-container-wrap/);
  });

  test("carousel swiper container has eael-logo-carousel class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(carousel("test-lc-default")).first()).toHaveClass(/eael-logo-carousel/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 13. Interaction
// ══════════════════════════════════════════════════════════════════════════════

// test.describe("Interaction", () => {
//   test("hover on each carousel instance triggers no JS errors", async ({ page }) => {
//     const errs = watchErrors(page);
//     await openPage(page);

//     for (const hook of [
//       "test-lc-default",
//       "test-lc-effect-fade",
//       "test-lc-effect-coverflow",
//       "test-lc-marquee",
//       "test-lc-no-arrows",
//       "test-lc-no-dots",
//       "test-lc-title-visible",
//       "test-lc-grayscale",
//     ]) {
//       const el = page.locator(logoImg(hook)).first();
//       if (await el.count() > 0) {
//         await el.hover({ force: true });
//         await page.waitForTimeout(150);
//       }
//     }

//     expect(errs, errs.join(" | ")).toHaveLength(0);
//   });

//   test("clicking an unlinked logo causes no JS errors", async ({ page }) => {
//     const errs = watchErrors(page);
//     await openPage(page);
//     await page.locator(logoImg("test-lc-default")).first().click({ force: true });
//     await page.waitForTimeout(300);
//     expect(errs, errs.join(" | ")).toHaveLength(0);
//   });

//   test("clicking an external-linked logo causes no JS errors", async ({ page }) => {
//     const errs = watchErrors(page);
//     await openPage(page);
//     const anchor = page.locator(`.test-lc-link-external .eael-lc-logo a`).first();
//     if (await anchor.count() > 0) {
//       await anchor.evaluate((el: HTMLElement) => el.removeAttribute("target"));
//       await anchor.click({ force: true });
//       await page.waitForTimeout(300);
//     }
//     expect(errs, errs.join(" | ")).toHaveLength(0);
//   });
// });
