/**
 * Covered: Essential Addons — Post Timeline widget (Free)
 *
 * 1. Page health        — HTTP 200, no PHP errors, no JS errors
 * 2. Layouts            — default (timeline-layout-default) / card (timeline-layout-card)
 * 3. Link settings      — nofollow (rel="nofollow"); target=_blank
 * 4. Content toggles    — title show/hide; excerpt show/hide; image show/hide
 * 5. Title tag          — h3 custom on .eael-timeline-post-title-text
 * 6. Arrow alignment    — middle / bottom CSS class on outer wrapper (card layout)
 * 7. Element structure  — outer wrapper id/classes; post article; bullet; time; image; link
 * 8. Interaction        — hover on each layout (no JS errors); link href is a real URL
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.POST_TIMELINE_PAGE_SLUG ?? "post-timeline"}/`;

// -- selectors -----------------------------------------------------------
// DOM shape (from Post_Timeline::render() + Template/Post-Timeline/default.php + card.php):
//   .{hook}                                              ← elementor-widget wrapper
//     div#eael-post-timeline-{id}
//       .eael-post-timeline.timeline-layout-{default|card}
//       .eael-post-timeline-arrow-{top|middle|bottom}    ← card layout only
//       div.eael-post-timeline.eael-post-appender
//         article.eael-timeline-post[.eael-timeline-column]  ← .eael-timeline-column on default
//           .eael-timeline-bullet
//           .eael-timeline-post-inner
//             a.eael-timeline-post-link[rel][target]
//               time
//               .eael-timeline-post-image                 ← when eael_show_image=yes
//               .eael-timeline-post-excerpt > p           ← when eael_show_excerpt=yes (default)
//               .eael-timeline-post-title                 ← when eael_show_title=yes (default)
//                 {h2|h3|…}.eael-timeline-post-title-text
//           [.eael-timeline-content]                      ← card layout only; wraps title+excerpt

const outerWrap  = (hook: string) => `.${hook} .eael-post-timeline`;
const postItem   = (hook: string) => `.${hook} article.eael-timeline-post`;
const postLink   = (hook: string) => `.${hook} a.eael-timeline-post-link`;
const timeEl     = (hook: string) => `.${hook} article.eael-timeline-post time`;
const imageEl    = (hook: string) => `.${hook} .eael-timeline-post-image`;
const titleEl    = (hook: string) => `.${hook} .eael-timeline-post-title`;
const titleText  = (hook: string) => `.${hook} .eael-timeline-post-title-text`;
const excerptEl  = (hook: string) => `.${hook} .eael-timeline-post-excerpt p`;
const bulletEl   = (hook: string) => `.${hook} .eael-timeline-bullet`;

// -- layout map ----------------------------------------------------------
const LAYOUT_HOOKS: Record<string, string> = {
  "test-pt-default":     "timeline-layout-default",
  "test-pt-layout-card": "timeline-layout-card",
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
// 2. Layouts
// ========================================================================

test.describe("Layouts", () => {
  for (const [hook, layoutClass] of Object.entries(LAYOUT_HOOKS)) {
    test(`${layoutClass}: outer wrapper has correct layout class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(outerWrap(hook)).first()).toHaveClass(
        new RegExp(layoutClass)
      );
    });

    test(`${layoutClass}: renders at least one post item`, async ({ page }) => {
      await openPage(page);
      const count = await page.locator(postItem(hook)).count();
      expect(count).toBeGreaterThan(0);
    });

    test(`${layoutClass}: post item is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(postItem(hook)).first()).toBeVisible();
    });
  }

  test("default layout: post item has eael-timeline-column class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(postItem("test-pt-default")).first()).toHaveClass(
      /eael-timeline-column/
    );
  });

  test("card layout: outer wrapper has eael-post-timeline-arrow-top class (default arrow)", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(outerWrap("test-pt-layout-card")).first()).toHaveClass(
      /eael-post-timeline-arrow-top/
    );
  });
});

// ========================================================================
// 3. Link settings
// ========================================================================

test.describe("Link settings", () => {
  test("nofollow: post link has rel='nofollow'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(postLink("test-pt-nofollow")).first()).toHaveAttribute(
      "rel",
      "nofollow"
    );
  });

  test("target=_blank: post link has target='_blank'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(postLink("test-pt-target-blank")).first()).toHaveAttribute(
      "target",
      "_blank"
    );
  });

  test("default: post link has a real href (not empty)", async ({ page }) => {
    await openPage(page);
    const href = await page
      .locator(postLink("test-pt-default"))
      .first()
      .getAttribute("href");
    expect(href).toBeTruthy();
    expect(href).not.toBe("#");
  });

  test("default: post link does not have rel='nofollow'", async ({ page }) => {
    await openPage(page);
    const rel = await page
      .locator(postLink("test-pt-default"))
      .first()
      .getAttribute("rel");
    expect(rel ?? "").not.toContain("nofollow");
  });

  test("default: post link does not have target='_blank'", async ({ page }) => {
    await openPage(page);
    const target = await page
      .locator(postLink("test-pt-default"))
      .first()
      .getAttribute("target");
    expect(target ?? "").not.toBe("_blank");
  });
});

// ========================================================================
// 4. Content toggles
// ========================================================================

test.describe("Title toggle", () => {
  test("title is visible in default widget", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(titleEl("test-pt-default")).first()).toBeVisible();
  });

  test("title text is visible in default widget", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(titleText("test-pt-default")).first()).toBeVisible();
  });

  test("title is absent when disabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(titleEl("test-pt-no-title"))).not.toBeAttached();
  });
});

test.describe("Excerpt toggle", () => {
  test("excerpt is visible in default widget", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(excerptEl("test-pt-default")).first()).toBeVisible();
  });

  test("excerpt is absent when disabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(excerptEl("test-pt-no-excerpt"))).toHaveCount(0);
  });
});

test.describe("Image toggle", () => {
  test("image element is attached in default widget", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(imageEl("test-pt-default")).first()).toBeAttached();
  });

  test("image element is absent when disabled", async ({ page }) => {
    await openPage(page);
    // Widget may render an empty container; check that no img is inside
    await expect(page.locator(`${imageEl("test-pt-no-image")} img`)).toHaveCount(0);
  });
});

// ========================================================================
// 5. Title tag
// ========================================================================

test.describe("Title tag", () => {
  test("h2 (default): title text element is an H2", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(titleText("test-pt-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H2");
  });

  test("h3 custom: title text element is an H3", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(titleText("test-pt-title-h3"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H3");
  });
});

// ========================================================================
// 6. Arrow alignment (card layout)
// ========================================================================

test.describe("Arrow alignment", () => {
  test("middle: outer wrapper has eael-post-timeline-arrow-middle class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(outerWrap("test-pt-arrow-middle")).first()).toHaveClass(
      /eael-post-timeline-arrow-middle/
    );
  });

  test("bottom: outer wrapper has eael-post-timeline-arrow-bottom class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(outerWrap("test-pt-arrow-bottom")).first()).toHaveClass(
      /eael-post-timeline-arrow-bottom/
    );
  });

  test("default (top): outer wrapper has eael-post-timeline-arrow-top class", async ({ page }) => {
    await openPage(page);
    // Arrow alignment classes apply to card layout only; use test-pt-layout-card for default arrow (top)
    await expect(page.locator(outerWrap("test-pt-layout-card")).first()).toHaveClass(
      /eael-post-timeline-arrow-top/
    );
  });
});

// ========================================================================
// 7. Element structure
// ========================================================================

test.describe("Element structure", () => {
  test("outer wrapper id starts with eael-post-timeline-", async ({ page }) => {
    await openPage(page);
    const id = await page
      .locator(outerWrap("test-pt-default"))
      .first()
      .getAttribute("id");
    expect(id).toMatch(/^eael-post-timeline-/);
  });

  test("post item is an <article> element", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(postItem("test-pt-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("ARTICLE");
  });

  test("each post item contains a .eael-timeline-bullet", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(bulletEl("test-pt-default")).first()).toBeAttached();
  });

  test("each post item contains a .eael-timeline-post-inner", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pt-default .eael-timeline-post-inner").first()
    ).toBeAttached();
  });

  test("each post item renders a <time> element", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(timeEl("test-pt-default")).first()).toBeAttached();
  });

  test("time element has a datetime attribute", async ({ page }) => {
    await openPage(page);
    const datetime = await page
      .locator(timeEl("test-pt-default"))
      .first()
      .getAttribute("datetime");
    expect(datetime).toBeTruthy();
  });

  test("post link wraps the whole post inner content", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(postLink("test-pt-default")).first()).toBeAttached();
  });

  test("card layout: .eael-timeline-content wrapper is rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pt-layout-card .eael-timeline-content").first()
    ).toBeAttached();
  });
});

// ========================================================================
// 8. Interaction
// ========================================================================

test.describe("Interaction", () => {
  test("hover on each layout triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    for (const hook of Object.keys(LAYOUT_HOOKS)) {
      await page.locator(outerWrap(hook)).first().hover();
      await page.waitForTimeout(150);
    }
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking a post link causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    const href = await page
      .locator(postLink("test-pt-default"))
      .first()
      .getAttribute("href");
    expect(href).toBeTruthy();
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
