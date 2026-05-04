/**
 * Covered: Essential Addons — Post Block widget (Pro)
 *
 * 1. Page health       — HTTP 200, no PHP errors, no JS errors
 * 2. Skins             — default (post-block-style-default) /
 *                        overlay (post-block-style-overlay); skin class on wrapper,
 *                        items rendered, title visible
 * 3. Layout modes      — block (post-block-layout-block) /
 *                        tiled presets 1/2/3 (eael-post-tiled-preset-N);
 *                        layout class on wrapper, grid container present
 * 4. Content toggles   — title / excerpt / read-more button / image / meta show/hide
 * 5. Meta position     — footer (default): .eael-entry-footer;
 *                        header: .eael-entry-header > .eael-entry-meta
 * 6. Title tag         — h2 default; h3 custom tag on .eael-entry-title
 * 7. Load more         — button present when enabled; "Load More" label
 * 8. Link settings     — image target=_blank / nofollow;
 *                        title target=_blank; read-more nofollow
 * 9. Post terms        — ul.post-meta-categories rendered when enabled
 * 10. Element structure — #eael-post-block-{id} wrapper; article.eael-post-block-item;
 *                         .eael-entry-media; .eael-entry-wrapper; .eael-post-block-grid
 * 11. Interaction      — hover (no JS errors); click title link (no JS errors)
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.POST_BLOCK_PAGE_SLUG ?? "post-block"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Post_Block::render() + default.php / overlay.php):
//   .{hook}
//     div#eael-post-block-{id}.eael-post-block
//       .post-block-style-{default|overlay}        ← skin class
//       .post-block-layout-{block|tiled}            ← layout class
//         .eael-post-block-grid.eael-post-appender  ← grid container
//           .{eael-post-tiled-preset-N}             ← tiled preset (if tiled)
//           article.eael-post-block-item.eael-post-block-column
//             .eael-post-block-item-holder
//               .eael-post-block-item-holder-inner
//                 .eael-entry-media                 ← (show_image=yes)
//                   .eael-entry-overlay.{hover_anim}
//                   .eael-entry-thumbnail > img
//                 .eael-entry-wrapper               ← content area
//                   header.eael-entry-header
//                     {title_tag}.eael-entry-title
//                       a.eael-grid-post-link
//                     .eael-entry-meta              ← (meta-entry-header)
//                   .eael-entry-content
//                     ul.post-meta-categories       ← (show_post_terms=yes)
//                     .eael-grid-post-excerpt > p
//                     a.eael-post-elements-readmore-btn
//                 .eael-entry-footer                ← (meta-entry-footer)
//                   .eael-author-avatar
//                   .eael-entry-meta
//                     .eael-posted-by
//                     .eael-posted-on > time

const wrapper  = (hook: string) => `.${hook} .eael-post-block`;
const grid     = (hook: string) => `.${hook} .eael-post-block-grid`;
const item     = (hook: string) => `.${hook} .eael-post-block-item`;
const media    = (hook: string) => `.${hook} .eael-entry-media`;
const title    = (hook: string) => `.${hook} .eael-entry-title`;
const titleLink = (hook: string) => `.${hook} .eael-grid-post-link`;
const excerpt  = (hook: string) => `.${hook} .eael-grid-post-excerpt`;
const readMore = (hook: string) => `.${hook} .eael-post-elements-readmore-btn`;
const footer   = (hook: string) => `.${hook} .eael-entry-footer`;
const metaEl   = (hook: string) => `.${hook} .eael-entry-meta`;
const avatar   = (hook: string) => `.${hook} .eael-author-avatar`;
const terms    = (hook: string) => `.${hook} ul.post-meta-categories`;

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
// 2. Skins
// ══════════════════════════════════════════════════════════════════════════

test.describe("Skins", () => {
  const skinMap: Record<string, string> = {
    "test-pb-default": "post-block-style-default",
    "test-pb-overlay": "post-block-style-overlay",
  };

  for (const [hook, skinClass] of Object.entries(skinMap)) {
    test(`${skinClass}: wrapper has correct skin class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrapper(hook)).first()).toHaveClass(
        new RegExp(skinClass)
      );
    });

    test(`${skinClass}: renders at least one post item`, async ({ page }) => {
      await openPage(page);
      const count = await page.locator(item(hook)).count();
      expect(count).toBeGreaterThan(0);
    });

    test(`${skinClass}: post title link is attached`, async ({ page }) => {
      await openPage(page);
      // overlay skin hides content behind CSS until hover — use toBeAttached()
      await expect(page.locator(titleLink(hook)).first()).toBeAttached();
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 3. Layout modes
// ══════════════════════════════════════════════════════════════════════════

test.describe("Layout modes", () => {
  test("block layout: wrapper has post-block-layout-block class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrapper("test-pb-layout-block")).first()).toHaveClass(
      /post-block-layout-block/
    );
  });

  test("block layout: .eael-post-block-grid is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(grid("test-pb-layout-block")).first()).toBeAttached();
  });

  test("tiled layout: wrapper has post-block-layout-tiled class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrapper("test-pb-tiled")).first()).toHaveClass(
      /post-block-layout-tiled/
    );
  });

  test("tiled layout preset-1: grid has eael-post-tiled-preset-1 class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(grid("test-pb-tiled")).first()).toHaveClass(
      /eael-post-tiled-preset-1/
    );
  });

  test("tiled layout preset-2: grid has eael-post-tiled-preset-2 class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(grid("test-pb-tiled-preset-2")).first()).toHaveClass(
      /eael-post-tiled-preset-2/
    );
  });

  test("tiled layout preset-3: grid has eael-post-tiled-preset-3 class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(grid("test-pb-tiled-preset-3")).first()).toHaveClass(
      /eael-post-tiled-preset-3/
    );
  });

  test("tiled layout: post items render", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(item("test-pb-tiled")).count();
    expect(count).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 4. Content toggles
// ══════════════════════════════════════════════════════════════════════════

test.describe("Title toggle", () => {
  test("title visible in default widget", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(title("test-pb-default")).first()).toBeVisible();
  });

  test("title absent when disabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(title("test-pb-no-title"))).not.toBeAttached();
  });
});

test.describe("Excerpt toggle", () => {
  test("excerpt visible in default widget", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(excerpt("test-pb-default")).first()).toBeVisible();
  });

  test("excerpt absent when disabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(excerpt("test-pb-no-excerpt"))).not.toBeAttached();
  });
});

test.describe("Read More toggle", () => {
  test("read-more button visible in default widget", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(readMore("test-pb-default")).first()).toBeVisible();
  });

  test("read-more button absent when disabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(readMore("test-pb-no-readmore"))).not.toBeAttached();
  });
});

test.describe("Image toggle", () => {
  test("image media block absent when disabled", async ({ page }) => {
    await openPage(page);
    // no featured images in test posts, so media only renders when show_image=yes AND thumbnail exists;
    // we test the negative: disabling the toggle removes the block entirely
    await expect(page.locator(media("test-pb-no-image"))).not.toBeAttached();
  });

  test("content wrapper always present regardless of image toggle", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pb-default .eael-entry-wrapper").first()
    ).toBeAttached();
    await expect(
      page.locator(".test-pb-no-image .eael-entry-wrapper").first()
    ).toBeAttached();
  });
});

test.describe("Meta toggle", () => {
  test("meta footer present in default widget", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(footer("test-pb-default")).first()).toBeAttached();
  });

  test("meta absent when disabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(footer("test-pb-no-meta"))).not.toBeAttached();
    await expect(page.locator(metaEl("test-pb-no-meta"))).not.toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 5. Meta position
// ══════════════════════════════════════════════════════════════════════════

test.describe("Meta position", () => {
  test("meta-entry-footer: .eael-entry-footer is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(footer("test-pb-meta-footer")).first()).toBeAttached();
  });

  test("meta-entry-footer: author avatar is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(avatar("test-pb-meta-footer")).first()).toBeAttached();
  });

  test("meta-entry-footer: posted-by is present", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pb-meta-footer .eael-posted-by").first()
    ).toBeAttached();
  });

  test("meta-entry-footer: posted-on date is present", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pb-meta-footer .eael-posted-on time").first()
    ).toBeAttached();
  });

  test("meta-entry-header: .eael-entry-meta inside header is present", async ({ page }) => {
    await openPage(page);
    await expect(
      page
        .locator(".test-pb-meta-header header.eael-entry-header .eael-entry-meta")
        .first()
    ).toBeAttached();
  });

  test("meta-entry-header: no .eael-entry-footer rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(footer("test-pb-meta-header"))).not.toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 6. Title tag
// ══════════════════════════════════════════════════════════════════════════

test.describe("Title tag", () => {
  test("h2 (default): title element is an H2", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(title("test-pb-title-h2"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H2");
  });

  test("h3 custom: title element is an H3", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(title("test-pb-title-h3"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H3");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 7. Load More button
// ══════════════════════════════════════════════════════════════════════════

test.describe("Load More button", () => {
  test("load-more button is present when enabled", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pb-load-more .eael-load-more-button").first()
    ).toBeAttached();
  });

  test("load-more button shows 'Load More' label", async ({ page }) => {
    await openPage(page);
    const text = await page
      .locator(".test-pb-load-more .eael-load-more-button")
      .first()
      .textContent();
    expect(text?.trim()).toContain("Load More");
  });

  test("load-more button is visible when enabled", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pb-load-more .eael-load-more-button").first()
    ).toBeVisible();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 8. Link settings
// ══════════════════════════════════════════════════════════════════════════

test.describe("Link settings", () => {
  test("title link target=_blank: title anchor has target='_blank'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pb-title-target-blank .eael-grid-post-link").first()
    ).toHaveAttribute("target", "_blank");
  });

  test("read-more link nofollow: read-more anchor has rel='nofollow'", async ({ page }) => {
    await openPage(page);
    const rel = await page
      .locator(".test-pb-readmore-nofollow .eael-post-elements-readmore-btn")
      .first()
      .getAttribute("rel");
    expect(rel).toContain("nofollow");
  });

  test("default: title link has href pointing to a post URL", async ({ page }) => {
    await openPage(page);
    const href = await page
      .locator(titleLink("test-pb-default"))
      .first()
      .getAttribute("href");
    expect(href).toBeTruthy();
    expect(href).not.toBe("#");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 9. Post terms
// ══════════════════════════════════════════════════════════════════════════

test.describe("Post terms", () => {
  test("terms absent in default widget", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(terms("test-pb-default"))).not.toBeAttached();
  });

  test("terms present when enabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(terms("test-pb-terms")).first()).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 10. Element structure
// ══════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("wrapper id starts with eael-post-block-", async ({ page }) => {
    await openPage(page);
    const id = await page
      .locator(wrapper("test-pb-default"))
      .first()
      .getAttribute("id");
    expect(id).toMatch(/^eael-post-block-/);
  });

  test("post item is an <article> element", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(item("test-pb-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("ARTICLE");
  });

  test("post item has eael-post-block-column class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(item("test-pb-default")).first()).toHaveClass(
      /eael-post-block-column/
    );
  });

  test(".eael-post-block-grid is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(grid("test-pb-default")).first()).toBeAttached();
  });

  test(".eael-entry-wrapper is present inside each item", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pb-default .eael-entry-wrapper").first()
    ).toBeAttached();
  });

  test("title link has .eael-grid-post-link class", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pb-default .eael-grid-post-link").first()
    ).toBeAttached();
  });

  test("overlay skin: wrapper has post-block-style-overlay class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrapper("test-pb-overlay")).first()).toHaveClass(
      /post-block-style-overlay/
    );
  });

  test("tiled layout: grid has eael-post-tiled-col-4 class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(grid("test-pb-tiled")).first()).toHaveClass(
      /eael-post-tiled-col-4/
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 11. Interaction
// ══════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover on each skin triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    // hover the wrapper for overlay skin — the item itself is CSS-hidden until hover
    for (const hook of ["test-pb-default", "test-pb-overlay"]) {
      await page.locator(wrapper(hook)).first().hover();
      await page.waitForTimeout(150);
    }
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover on tiled layouts triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    for (const hook of ["test-pb-tiled", "test-pb-tiled-preset-2", "test-pb-tiled-preset-3"]) {
      await page.locator(item(hook)).first().hover();
      await page.waitForTimeout(150);
    }
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking title link causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(titleLink("test-pb-default")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
