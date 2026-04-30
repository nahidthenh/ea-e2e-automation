import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.POST_GRID_PAGE_SLUG ?? "post-grid"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Post_Grid::render() + Template/Post-Grid/default.php):
//   .{hook}                                         ← elementor-widget wrapper
//     .eael-post-grid-container                     ← outer wrapper
//       .eael-post-grid                             ← isotope grid
//       .eael-post-grid-style-{one|two|three}       ← skin class
//       [data-layout-mode="grid|masonry"]
//         article.eael-grid-post                    ← per-post card
//           .eael-grid-post-holder > .eael-grid-post-holder-inner
//             .eael-entry-wrapper
//               header.eael-entry-header
//                 .eael-entry-title > a.eael-grid-post-link
//               .eael-entry-meta
//               .eael-entry-content
//                 .eael-grid-post-excerpt > p
//                 a.eael-post-elements-readmore-btn
//             .eael-entry-media
//               .eael-entry-thumbnail > img

const gridContainer = (hook: string) => `.${hook} .eael-post-grid`;
const skinClass = (hook: string, skin: string) =>
  `.${hook} .eael-post-grid-style-${skin}`;
const gridPost = (hook: string) => `.${hook} article.eael-grid-post`;
const postTitle = (hook: string) =>
  `.${hook} .eael-entry-title a.eael-grid-post-link`;
const postExcerpt = (hook: string) =>
  `.${hook} .eael-grid-post-excerpt p`;
const readMoreBtn = (hook: string) =>
  `.${hook} a.eael-post-elements-readmore-btn`;
const entryMeta = (hook: string) => `.${hook} .eael-entry-meta`;
const thumbnail = (hook: string) => `.${hook} .eael-entry-thumbnail img`;
const loadMoreBtn = (hook: string) =>
  `.${hook} .eael-post-grid-load-more-button`;

// ── skin map ──────────────────────────────────────────────────────────────
const SKIN_MAP: Record<string, string> = {
  "test-pg-default":    "one",
  "test-pg-skin-two":   "two",
  "test-pg-skin-three": "three",
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
// 2. Skins / Presets
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Skins", () => {
  for (const [hook, skin] of Object.entries(SKIN_MAP)) {
    test(`${skin} — grid container is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(gridContainer(hook)).first()).toBeVisible();
    });

    test(`${skin} — carries eael-post-grid-style-${skin} class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(skinClass(hook, skin)).first()).toBeAttached();
    });

    test(`${skin} — post cards render`, async ({ page }) => {
      await openPage(page);
      const count = await page.locator(gridPost(hook)).count();
      expect(count).toBeGreaterThan(0);
    });

    test(`${skin} — post title link is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(postTitle(hook)).first()).toBeVisible();
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Layout modes
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Layout modes", () => {
  test("grid — data-layout-mode is 'grid'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(gridContainer("test-pg-grid")).first()).toHaveAttribute(
      "data-layout-mode",
      "grid"
    );
  });

  test("masonry — data-layout-mode is 'masonry'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(gridContainer("test-pg-masonry")).first()).toHaveAttribute(
      "data-layout-mode",
      "masonry"
    );
  });

  test("grid — post cards render", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(gridPost("test-pg-grid")).count();
    expect(count).toBeGreaterThan(0);
  });

  test("masonry — post cards render", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(gridPost("test-pg-masonry")).count();
    expect(count).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Content toggles
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Content toggle — title", () => {
  test("title renders when eael_show_title=yes", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(postTitle("test-pg-default")).first()).toBeVisible();
  });

  test("title is absent when eael_show_title=''", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(postTitle("test-pg-no-title"))).toHaveCount(0);
  });
});

test.describe("Content toggle — excerpt", () => {
  test("excerpt renders when eael_show_excerpt=yes", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(postExcerpt("test-pg-default")).first()).toBeVisible();
  });

  test("excerpt is absent when eael_show_excerpt=''", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(postExcerpt("test-pg-no-excerpt"))).toHaveCount(0);
  });
});

test.describe("Content toggle — read more", () => {
  test("read more button renders when eael_show_read_more_button=yes", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(readMoreBtn("test-pg-default")).first()).toBeVisible();
  });

  test("read more button is absent when eael_show_read_more_button=''", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(readMoreBtn("test-pg-no-readmore"))).toHaveCount(0);
  });
});

test.describe("Content toggle — meta", () => {
  test("meta renders when eael_show_meta=yes", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(entryMeta("test-pg-default")).first()).toBeAttached();
  });

  test("meta is absent when eael_show_meta=''", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(entryMeta("test-pg-no-meta"))).toHaveCount(0);
  });
});

test.describe("Content toggle — image", () => {
  test("thumbnail renders when eael_show_image=yes", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(thumbnail("test-pg-default")).first()).toBeAttached();
  });

  test("thumbnail is absent when eael_show_image=''", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(thumbnail("test-pg-no-image"))).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Post card structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Post card structure", () => {
  test("each card is an <article> element", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(gridPost("test-pg-default"))
      .first()
      .evaluate((el) => el.tagName.toLowerCase());
    expect(tag).toBe("article");
  });

  test("each card has a data-id attribute", async ({ page }) => {
    await openPage(page);
    const id = await page
      .locator(gridPost("test-pg-default"))
      .first()
      .getAttribute("data-id");
    expect(id).toBeTruthy();
  });

  test("title link href points to a post URL", async ({ page }) => {
    await openPage(page);
    const href = await page
      .locator(postTitle("test-pg-default"))
      .first()
      .getAttribute("href");
    expect(href).toBeTruthy();
    expect(href).not.toBe("#");
  });

  test("read more link href points to a post URL", async ({ page }) => {
    await openPage(page);
    const href = await page
      .locator(readMoreBtn("test-pg-default"))
      .first()
      .getAttribute("href");
    expect(href).toBeTruthy();
    expect(href).not.toBe("#");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Load more
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Load more", () => {
  test("load more button is rendered when show_load_more=yes", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(loadMoreBtn("test-pg-load-more")).first()).toBeAttached();
  });

  test("load more button is absent on default (show_load_more=no)", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(loadMoreBtn("test-pg-default"))).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover on each widget instance triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-pg-default",
      "test-pg-skin-two",
      "test-pg-skin-three",
      "test-pg-grid",
      "test-pg-masonry",
      "test-pg-no-title",
      "test-pg-no-excerpt",
      "test-pg-no-readmore",
      "test-pg-no-meta",
      "test-pg-no-image",
      "test-pg-load-more",
    ]) {
      const el = page.locator(gridContainer(hook)).first();
      if (await el.count()) {
        await el.hover();
        await page.waitForTimeout(150);
      }
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("title link is keyboard-focusable", async ({ page }) => {
    await openPage(page);
    const link = page.locator(postTitle("test-pg-default")).first();
    await link.focus();
    await expect(link).toBeFocused();
  });

  test("read more link is keyboard-focusable", async ({ page }) => {
    await openPage(page);
    const link = page.locator(readMoreBtn("test-pg-default")).first();
    await link.focus();
    await expect(link).toBeFocused();
  });
});

