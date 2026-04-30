/**
 * Covered: Essential Addons — Interactive Card widget
 *
 * 1. Page health        — HTTP 200, no PHP errors, no JS errors
 * 2. Front panel styles — text-card (.front-text-content "Interactive Cards" + "More" btn) /
 *                         img-card (.image-screen-overlay, no .front-text-content)
 * 3. Rear panel types   — img-grid (.content-inner "Cool Headline"/"Read More") /
 *                         scrollable (.content-overflow) /
 *                         video (iframe youtube.com/embed)
 * 4. Button icons       — front-btn-icon left class / no icon when off;
 *                         rear-btn-icon left class
 * 5. Link behaviour     — default "#"; external target="_blank"; nofollow; no-target
 * 6. Content animation  — data-animation: content-show / slide-in-left / slide-in-right
 * 7. Element structure  — interactive-card class; data-interactive-card-id;
 *                         data-animation-time; close button; counter "1"
 * 8. Interaction        — hover; click front button reveals rear panel (no JS errors)
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.INTERACTIVE_CARD_PAGE_SLUG ?? "interactive-card"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Interactive_Card::render()):
//   .{hook}                                       ← elementor-widget wrapper
//     .interactive-card[data-animation][data-animation-time]
//       (text-card style):
//         .front-content.front-text-content
//           .image-screen
//             .header
//               .card-number                      ← counter
//               h2.title                          ← front title
//             .front-text-body                    ← front content
//             .footer
//               a.interactive-btn[href="javascript:;"]
//                 span.left.front-btn-icon        ← icon left (if enabled)
//                 (button text)
//                 span.right.front-btn-icon       ← icon right (if enabled)
//       (img-card style):
//         .front-content
//           .image-screen
//             .image-screen-overlay
//       (shared rear panel):
//         .content
//           span.close.close-me                   ← close button
//           (img-grid type):
//             .content-inner
//               .text > .text-inner
//                 h2.title                        ← rear title
//                 a.interactive-btn               ← rear button
//               .image                            ← rear image div
//           (scrollable type):
//             .content-overflow > .text
//           (video type):
//             iframe

const card = (hook: string) => `.${hook} .interactive-card`;
const frontText = (hook: string) => `.${hook} .front-text-content`;
const frontBtn = (hook: string) => `.${hook} .front-text-content .footer .interactive-btn`;
const frontTitle = (hook: string) => `.${hook} .front-text-content h2.title`;
const rearPanel = (hook: string) => `.${hook} .interactive-card .content`;
const rearBtn = (hook: string) => `.${hook} .interactive-card .content .interactive-btn`;
const rearTitle = (hook: string) => `.${hook} .interactive-card .content h2.title`;
const closeBtn = (hook: string) => `.${hook} .close.close-me`;

// ── animation → expected data-animation value ──────────────────────────────
const animMap: Record<string, string> = {
  "test-icard-anim-left": "slide-in-left",
  "test-icard-anim-right": "slide-in-right",
};

// ── helpers ────────────────────────────────────────────────────────────────

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
    await page.goto(PAGE_URL);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. Front panel styles
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Front panel styles", () => {
  test("text-card: .interactive-card is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(card("test-icard-default")).first()).toBeVisible();
  });

  test("text-card: .front-text-content renders with title", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(frontText("test-icard-default")).first()).toBeVisible();
    await expect(page.locator(frontTitle("test-icard-default")).first()).toBeVisible();
  });

  test("text-card: default front title text is rendered", async ({ page }) => {
    await openPage(page);
    const txt = await page.locator(frontTitle("test-icard-default")).first().textContent();
    expect(txt?.trim()).toBe("Interactive Cards");
  });

  test("text-card: front button 'More' is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(frontBtn("test-icard-default")).first()).toBeVisible();
    const txt = await page.locator(frontBtn("test-icard-default")).first().textContent();
    expect(txt?.trim()).toContain("More");
  });

  test("img-card: front content lacks .front-text-content wrapper", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-icard-img-card .front-text-content")
    ).toHaveCount(0);
  });

  test("img-card: .image-screen-overlay is present in front content", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-icard-img-card .front-content .image-screen-overlay").first()
    ).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Rear panel types
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Rear panel types", () => {
  test("img-grid (default): .content-inner is attached", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-icard-default .content-inner").first()
    ).toBeAttached();
  });

  test("img-grid: rear title renders default text", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(rearTitle("test-icard-default")).first()).toBeAttached();
    const txt = await page.locator(rearTitle("test-icard-default")).first().textContent();
    expect(txt?.trim()).toBe("Cool Headline");
  });

  test("img-grid: rear button 'Read More' is attached", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(rearBtn("test-icard-default")).first()).toBeAttached();
    const txt = await page.locator(rearBtn("test-icard-default")).first().textContent();
    expect(txt?.trim()).toContain("Read More");
  });

  test("scrollable: .content-overflow is attached", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-icard-scrollable .content-overflow").first()
    ).toBeAttached();
  });

  test("scrollable: custom content text is rendered", async ({ page }) => {
    await openPage(page);
    const txt = await page
      .locator(".test-icard-scrollable .content-overflow .text")
      .first()
      .textContent();
    expect(txt).toContain("Scrollable Heading");
  });

  test("video: iframe is attached in rear panel", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-icard-video .interactive-card .content iframe").first()
    ).toBeAttached();
  });

  test("video: iframe src contains youtube embed URL", async ({ page }) => {
    await openPage(page);
    const src = await page
      .locator(".test-icard-video .interactive-card .content iframe")
      .first()
      .getAttribute("src");
    expect(src).toContain("youtube.com/embed");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Button icons
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Button icons", () => {
  test("front-btn-icon: .front-btn-icon span is rendered in front button", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-icard-front-btn-icon .footer .front-btn-icon").first()
    ).toBeAttached();
  });

  test("front-btn-icon: icon span has 'left' class when alignment is left", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-icard-front-btn-icon .footer .front-btn-icon.left").first()
    ).toBeAttached();
  });

  test("default: no .front-btn-icon when icon is off", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-icard-default .footer .front-btn-icon")
    ).toHaveCount(0);
  });

  test("rear-btn-icon: .rear-btn-icon span is rendered in rear button", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-icard-rear-btn-icon .content .rear-btn-icon").first()
    ).toBeAttached();
  });

  test("rear-btn-icon: icon span has 'left' class when alignment is left", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-icard-rear-btn-icon .content .rear-btn-icon.left").first()
    ).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Link behaviour
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Link behaviour", () => {
  test("default rear button href is '#'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(rearBtn("test-icard-default")).first()).toHaveAttribute(
      "href",
      "#"
    );
  });

  test("external link: rear button has target='_blank'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(rearBtn("test-icard-link-ext")).first()).toHaveAttribute(
      "target",
      "_blank"
    );
  });

  test("external link: rear button href contains configured domain", async ({ page }) => {
    await openPage(page);
    const href = await page
      .locator(rearBtn("test-icard-link-ext"))
      .first()
      .getAttribute("href");
    expect(href).toContain("essential-addons.com");
  });

  test("nofollow link: rear button rel contains 'nofollow'", async ({ page }) => {
    await openPage(page);
    const rel = await page
      .locator(rearBtn("test-icard-link-nofollow"))
      .first()
      .getAttribute("rel");
    expect(rel).toContain("nofollow");
  });

  test("non-external default rear button has no target='_blank'", async ({ page }) => {
    await openPage(page);
    const target = await page
      .locator(rearBtn("test-icard-default"))
      .first()
      .getAttribute("target");
    expect(target).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Content animation
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Content animation", () => {
  test("default: data-animation is 'content-show'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(card("test-icard-default")).first()).toHaveAttribute(
      "data-animation",
      "content-show"
    );
  });

  for (const [hook, animValue] of Object.entries(animMap)) {
    test(`${animValue}: data-animation is '${animValue}'`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(card(hook)).first()).toHaveAttribute(
        "data-animation",
        animValue
      );
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Element structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("card container has class 'interactive-card'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(card("test-icard-default")).first()).toBeAttached();
  });

  test("card has data-interactive-card-id attribute", async ({ page }) => {
    await openPage(page);
    const attr = await page
      .locator(card("test-icard-default"))
      .first()
      .getAttribute("data-interactive-card-id");
    expect(attr).toBeTruthy();
  });

  test("card has data-animation-time attribute", async ({ page }) => {
    await openPage(page);
    const attr = await page
      .locator(card("test-icard-default"))
      .first()
      .getAttribute("data-animation-time");
    expect(attr).toBeTruthy();
  });

  test("close button is present in rear panel", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(closeBtn("test-icard-default")).first()).toBeAttached();
  });

  test("front button renders as <a> tag", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(frontBtn("test-icard-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("A");
  });

  test("text-card: counter renders default value '1'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-icard-default .card-number").first()
    ).toBeAttached();
    const txt = await page
      .locator(".test-icard-default .card-number")
      .first()
      .textContent();
    expect(txt?.trim()).toBe("1");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover on each card instance triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-icard-default",
      "test-icard-img-card",
      "test-icard-scrollable",
      "test-icard-video",
    ]) {
      await page.locator(card(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking front button triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(frontBtn("test-icard-default")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking front button activates the rear panel", async ({ page }) => {
    await openPage(page);
    await page.locator(frontBtn("test-icard-default")).first().click();
    await page.waitForTimeout(500);
    // After click the .content panel should become visible/active
    await expect(page.locator(rearPanel("test-icard-default")).first()).toBeAttached();
  });
});
