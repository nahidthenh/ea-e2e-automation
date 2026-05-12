/**
 * Covered: Essential Addons — Content Timeline widget
 *
 * 1. Page health          — HTTP 200, no PHP errors, no JS errors
 * 2. Layout positions     — center / left / right class on container
 * 3. Circle icon variants — icon present; no bullet class
 * 4. Title visibility     — show / hide; text "Alpha Event"
 * 5. Excerpt visibility   — show / hide
 * 6. Read more visibility — show / hide; text "Read More"
 * 7. Element structure    — date "Jan 01, 2024"; h2/h3 title tag; card element; 3 blocks
 * 8. Link behaviour       — href "#"; target="_blank"; nofollow rel
 * 9. Interaction          — hover (no JS errors); click links (no JS errors)
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.CONTENT_TIMELINE_PAGE_SLUG ?? "content-timeline"}/`;

// -- selectors -----------------------------------------------------------
// DOM shape (from Content_Timeline::render() + default.php template):
//   .{hook}                                             ← elementor-widget wrapper
//     div#eael-content-timeline-{id}                   ← timeline root
//       .content-timeline-layout-{left|center|right}   ← position class
//       .horizontal-timeline-wrapper
//       .eael-content-timeline-container
//         .eael-content-timeline-container
//           .eael-content-timeline-block               ← per-item block
//             .eael-content-timeline-line
//               .eael-content-timeline-inner
//             .eael-content-timeline-img.eael-picture  ← circle (icon/bullet)
//               (optional) .eael-content-timeline-bullet  ← when bullet type
//             .eael-content-timeline-content           ← card content
//               span.eael-date                         ← date string
//               h2.eael-timeline-title                 ← title (h1-h6, tag varies)
//                 a[href]                              ← title link
//               .eael-timeline-excerpt                 ← excerpt (conditional)
//               a.eael-read-more                       ← read more btn (conditional)

const container = (hook: string) => `.${hook} .eael-content-timeline-container`;
const block = (hook: string) => `.${hook} .eael-content-timeline-block`;
const circle = (hook: string) => `.${hook} .eael-content-timeline-img`;
const card = (hook: string) => `.${hook} .eael-content-timeline-content`;
const dateEl = (hook: string) => `.${hook} .eael-date`;
const titleEl = (hook: string) => `.${hook} .eael-timeline-title`;
const excerpt = (hook: string) => `.${hook} .eael-timeline-excerpt`;
const readMore = (hook: string) => `.${hook} a.eael-read-more`;
const layoutCls = (hook: string, pos: string) =>
  `.${hook} .content-timeline-layout-${pos}`;

// -- known layout position values ------------------------------------------
const LAYOUT_POSITIONS = ["left", "center", "right"] as const;

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
// 2. Layout positions
// ============================================================================

test.describe("Layout positions", () => {
  const positionMap: Record<string, string> = {
    "test-ct-default": "center",
    "test-ct-layout-left": "left",
    "test-ct-layout-right": "right",
  };

  for (const [hook, pos] of Object.entries(positionMap)) {
    test(`content-timeline-layout-${pos} — container is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(container(hook)).first()).toBeVisible();
    });

    test(`content-timeline-layout-${pos} — carries correct layout class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(layoutCls(hook, pos)).first()).toBeAttached();
    });

    test(`content-timeline-layout-${pos} — timeline blocks render`, async ({ page }) => {
      await openPage(page);
      const count = await page.locator(block(hook)).count();
      expect(count).toBeGreaterThan(0);
    });
  }
});

// ============================================================================
// 3. Circle icon variants
// ============================================================================

test.describe("Circle icon variants", () => {
  test("default (icon) — circle element is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(circle("test-ct-default")).first()).toBeAttached();
  });

  // test("bullet — circle carries .eael-content-timeline-bullet class", async ({ page }) => {
  //   await openPage(page);
  //   await expect(
  //     page.locator(".test-ct-bullet .eael-content-timeline-img.eael-content-timeline-bullet").first()
  //   ).toBeAttached();
  // });

  test("bullet — circle does not carry bullet class on default instance", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ct-default .eael-content-timeline-bullet")
    ).toHaveCount(0);
  });
});

// ============================================================================
// 4. Content visibility toggles
// ============================================================================

test.describe("Content visibility — title", () => {
  test("title is visible when eael_show_title=yes", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(titleEl("test-ct-default")).first()).toBeVisible();
  });

  test("title text matches first repeater item", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(titleEl("test-ct-default")).first().textContent();
    expect(text?.trim()).toBe("Alpha Event");
  });

  test("title is absent when eael_show_title=no", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(titleEl("test-ct-no-title"))).toHaveCount(0);
  });
});

test.describe("Content visibility — excerpt", () => {
  test("excerpt is visible when eael_show_excerpt=yes", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(excerpt("test-ct-default")).first()).toBeVisible();
  });

  test("excerpt is absent when eael_show_excerpt=no", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(excerpt("test-ct-no-excerpt"))).toHaveCount(0);
  });
});

test.describe("Content visibility — read more", () => {
  test("read more button is present when eael_show_custom_read_more=1", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(readMore("test-ct-default")).first()).toBeVisible();
  });

  test("read more button text defaults to 'Read More'", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(readMore("test-ct-default")).first().textContent();
    expect(text?.trim()).toBe("Read More");
  });

  test("read more button is absent when eael_show_custom_read_more=0", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(readMore("test-ct-no-readmore"))).toHaveCount(0);
  });
});

// ============================================================================
// 5. Element structure
// ============================================================================

test.describe("Element structure", () => {
  test("date element renders in each block", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(dateEl("test-ct-default")).first()).toBeVisible();
  });

  test("date text matches first repeater item date", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(dateEl("test-ct-default")).first().textContent();
    expect(text?.trim()).toBe("Jan 01, 2024");
  });

  test("default title renders as <h2> tag", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(titleEl("test-ct-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H2");
  });

  test("title renders as <h3> when title_tag=h3", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(titleEl("test-ct-title-h3"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H3");
  });

  test("card content area is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(card("test-ct-default")).first()).toBeAttached();
  });

  test("default instance renders 3 timeline blocks", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(block("test-ct-default")).count();
    expect(count).toBe(3);
  });
});

// ============================================================================
// 6. Link behaviour
// ============================================================================

test.describe("Link behaviour", () => {
  test("default read-more href is '#'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(readMore("test-ct-default")).first()).toHaveAttribute(
      "href",
      "#"
    );
  });

  test("external link read-more has target='_blank'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(readMore("test-ct-external")).first()).toHaveAttribute(
      "target",
      "_blank"
    );
  });

  test("non-external read-more has no target='_blank'", async ({ page }) => {
    await openPage(page);
    const target = await page
      .locator(readMore("test-ct-default"))
      .first()
      .getAttribute("target");
    expect(target).toBeNull();
  });

  test("nofollow read-more has rel containing 'nofollow'", async ({ page }) => {
    await openPage(page);
    const rel = await page
      .locator(readMore("test-ct-nofollow"))
      .first()
      .getAttribute("rel");
    expect(rel).toContain("nofollow");
  });

  test("default read-more has no rel='nofollow'", async ({ page }) => {
    await openPage(page);
    const rel = await page
      .locator(readMore("test-ct-default"))
      .first()
      .getAttribute("rel");
    expect(rel ?? "").not.toContain("nofollow");
  });

  test("title link href points to repeater item URL", async ({ page }) => {
    await openPage(page);
    const href = await page
      .locator(".test-ct-default .eael-timeline-title a")
      .first()
      .getAttribute("href");
    expect(href).toBe("#");
  });
});

// ============================================================================
// 7. Interaction
// ============================================================================

test.describe("Interaction", () => {
  test("read-more link is keyboard-focusable", async ({ page }) => {
    await openPage(page);
    const link = page.locator(readMore("test-ct-default")).first();
    await link.focus();
    await expect(link).toBeFocused();
  });

  test("hover on each widget instance triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-ct-default",
      "test-ct-layout-left",
      "test-ct-layout-right",
      "test-ct-bullet",
      "test-ct-no-title",
      "test-ct-no-excerpt",
      "test-ct-no-readmore",
      "test-ct-title-h3",
      "test-ct-external",
      "test-ct-nofollow",
    ]) {
      await page.locator(container(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking default read-more causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(readMore("test-ct-default")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
