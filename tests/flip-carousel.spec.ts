/**
 * Covered: Essential Addons — Flip Carousel widget
 *
 * 1. Page health      — HTTP 200, no PHP errors, no JS errors
 * 2. Carousel types   — coverflow / carousel / flat / wheel via data-style
 * 3. Slide text       — .flip-carousel-text "Slide Alpha" / "Slide Beta"
 * 4. Content view     — hover class / always class with content element / none without
 * 5. Slide links      — external target="_blank"; nofollow rel; no-target default
 * 6. Element structure — div/ul/li tags; img inside slide; data-fadein; data-start
 * 7. Interaction      — hover (no JS errors); click (no JS errors)
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.FLIP_CAROUSEL_PAGE_SLUG ?? "flip-carousel"}/`;

// -- selectors -----------------------------------------------------------
// DOM shape (from Flip_Carousel::render()):
//
//   .{hook}
//     .eael-flip-carousel[data-style="coverflow|carousel|flat|wheel"]
//       class "show-all|show-active-only"   ← always present
//       class "hover|always"                ← present when content_view != none
//       ul.flip-items.eael-flip-container
//         li.eael-flip-item
//           (a > img)                       ← when slide link is enabled
//           (img)                           ← when no link
//           (.eael-flip-carousel-content)   ← when content_view != none
//           (p.flip-carousel-text)          ← when slide_text is set

const wrap      = (hook: string) => `.${hook} .eael-flip-carousel`;
const container = (hook: string) => `.${hook} .eael-flip-container`;
const slide     = (hook: string) => `.${hook} .eael-flip-item`;
const slideLink = (hook: string) => `.${hook} .eael-flip-item a`;
const slideText = (hook: string) => `.${hook} .flip-carousel-text`;
const content   = (hook: string) => `.${hook} .eael-flip-carousel-content`;

// -- known carousel types -------------------------------------------------
const CAROUSEL_TYPE_MAP: Record<string, string> = {
  "test-fc-coverflow": "coverflow",
  "test-fc-carousel":  "carousel",
  "test-fc-flat":      "flat",
  "test-fc-wheel":     "wheel",
};

// -- helpers -------------------------------------------------------------

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
// 2. Carousel types — data-style attribute and visibility
// ========================================================================

test.describe("Carousel types", () => {
  for (const [hook, type] of Object.entries(CAROUSEL_TYPE_MAP)) {
    test(`${type}: .eael-flip-carousel wrapper is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrap(hook)).first()).toBeVisible();
    });

    test(`${type}: data-style="${type}" is applied`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrap(hook)).first()).toHaveAttribute("data-style", type);
    });

    test(`${type}: ul.eael-flip-container is rendered`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(container(hook)).first()).toBeAttached();
    });

    test(`${type}: slide items are rendered`, async ({ page }) => {
      await openPage(page);
      const count = await page.locator(slide(hook)).count();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  }
});

// ========================================================================
// 3. Slide text (footer text)
//    Slide text renders as p.flip-carousel-text inside each li.eael-flip-item.
// ========================================================================

test.describe("Slide text (footer label)", () => {
  test("coverflow: .flip-carousel-text elements are rendered", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(slideText("test-fc-coverflow")).count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("coverflow: first slide text reads 'Slide Alpha'", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(slideText("test-fc-coverflow")).first().textContent();
    expect(text?.trim()).toBe("Slide Alpha");
  });

  test("coverflow: second slide text reads 'Slide Beta'", async ({ page }) => {
    await openPage(page);
    const texts = await page.locator(slideText("test-fc-coverflow")).allTextContents();
    expect(texts.map((t) => t.trim())).toContain("Slide Beta");
  });
});

// ========================================================================
// 4. Content view — hover and always-show modes
// ========================================================================

test.describe("Content view", () => {
  test("hover: .eael-flip-carousel has class 'hover'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrap("test-fc-content-hover")).first()).toHaveClass(/\bhover\b/);
  });

  test("hover: .eael-flip-carousel-content elements are rendered inside slides", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(content("test-fc-content-hover")).count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("hover: content text is present in first slide", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(content("test-fc-content-hover")).first().textContent();
    expect(text?.trim()).toBeTruthy();
  });

  test("always: .eael-flip-carousel has class 'always'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrap("test-fc-content-always")).first()).toHaveClass(/\balways\b/);
  });

  test("always: .eael-flip-carousel-content elements are rendered", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(content("test-fc-content-always")).count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("none (default): no .eael-flip-carousel-content in type instances", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(content("test-fc-coverflow"))).toHaveCount(0);
  });

  test("always: wrapper also has class 'show-all' (content_active_only off)", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrap("test-fc-content-always")).first()).toHaveClass(/\bshow-all\b/);
  });
});

// ========================================================================
// 5. Slide links — external and nofollow
// ========================================================================

test.describe("Slide links", () => {
  test("external: anchor tag is rendered inside slide items", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(slideLink("test-fc-link-ext")).count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("external: anchor has target='_blank'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(slideLink("test-fc-link-ext")).first()).toHaveAttribute(
      "target",
      "_blank"
    );
  });

  test("external: anchor href points to configured URL", async ({ page }) => {
    await openPage(page);
    const href = await page
      .locator(slideLink("test-fc-link-ext"))
      .first()
      .getAttribute("href");
    expect(href).toContain("essential-addons.com");
  });

  test("nofollow: anchor tag is rendered inside slide items", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(slideLink("test-fc-link-nofollow")).count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("nofollow: anchor has rel containing 'nofollow'", async ({ page }) => {
    await openPage(page);
    const rel = await page
      .locator(slideLink("test-fc-link-nofollow"))
      .first()
      .getAttribute("rel");
    expect(rel).toContain("nofollow");
  });

  test("nofollow: anchor does not have target='_blank'", async ({ page }) => {
    await openPage(page);
    const target = await page
      .locator(slideLink("test-fc-link-nofollow"))
      .first()
      .getAttribute("target");
    expect(target).toBeNull();
  });
});

// ========================================================================
// 6. Element structure
// ========================================================================

test.describe("Element structure", () => {
  test(".eael-flip-carousel is a div", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(wrap("test-fc-coverflow"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("DIV");
  });

  test(".eael-flip-container is a ul", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(container("test-fc-coverflow"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("UL");
  });

  test("each slide is an li.eael-flip-item", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(slide("test-fc-coverflow"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("LI");
  });

  test("each slide contains an img element", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-fc-coverflow .eael-flip-item img").first()
    ).toBeAttached();
  });

  test("coverflow: data-fadein attribute is present", async ({ page }) => {
    await openPage(page);
    const fadein = await page
      .locator(wrap("test-fc-coverflow"))
      .first()
      .getAttribute("data-fadein");
    expect(fadein).not.toBeNull();
  });

  test("coverflow: data-start attribute is present", async ({ page }) => {
    await openPage(page);
    const start = await page
      .locator(wrap("test-fc-coverflow"))
      .first()
      .getAttribute("data-start");
    expect(start).not.toBeNull();
  });
});

// ========================================================================
// 7. Interaction
// ========================================================================

test.describe("Interaction", () => {
  test("hover over all carousel instances causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-fc-coverflow",
      "test-fc-carousel",
      "test-fc-flat",
      "test-fc-wheel",
      "test-fc-content-hover",
      "test-fc-content-always",
      "test-fc-link-ext",
      "test-fc-link-nofollow",
    ]) {
      await page.locator(wrap(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking the carousel container causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    // Click the container rather than a specific slide — the 3D coverflow layout
    // stacks slides in Z-space, so individual slide items may be occluded.
    await page.locator(wrap("test-fc-coverflow")).first().click({ force: true });
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
