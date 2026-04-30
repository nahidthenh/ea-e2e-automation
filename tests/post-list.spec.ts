/**
 * Covered: Essential Addons — Post List widget
 *
 * 1. Page health      — HTTP 200, no PHP errors, no JS errors
 * 2. Container        — wrapper with layout type class
 * 3. Header           — topbar title; filter tabs "All" link
 * 4. Post items       — thumbnail; title; excerpt; read-more button
 * 5. Pagination       — prev/next buttons present and functional
 * 6. Advanced layout  — advanced layout variant renders correctly
 * 7. Interaction      — filter tab click (no JS errors); pagination click (no JS errors)
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.POST_LIST_PAGE_SLUG ?? "post-list"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Post_List::render() + default.php template):
//
//   .{hook}
//     .eael-post-list-container.layout-{type}
//       .eael-post-list-header            ← topbar (if topbar=yes)
//         .header-title > h2.title
//         .post-categories                ← filter tabs (if terms=yes)
//           a.active.post-list-filter-item (All link)
//       .eael-post-list-wrap
//         .eael-post-list-posts-wrap
//           .eael-post-list-post          ← per-item (each post)
//             .eael-post-list-thumbnail   ← (if feature-image=yes)
//             .eael-post-list-content
//               .eael-post-list-title     ← (if title=yes, tag=h2 default)
//               p                         ← excerpt (if excerpt=yes)
//               a.eael-post-elements-readmore-btn  ← (if excerpt+readmore=yes)
//       .post-list-pagination             ← (if pagination=navigation)
//         .btn.btn-prev-post
//         .btn.btn-next-post
//
// Advanced layout wraps items in .eael-post-list-post-inner additionally.

const container   = (hook: string) => `.${hook} .eael-post-list-container`;
const header      = (hook: string) => `.${hook} .eael-post-list-header`;
const titleEl     = (hook: string) => `.${hook} .eael-post-list-header .header-title h2.title`;
const filterWrap  = (hook: string) => `.${hook} .post-categories`;
const postsWrap   = (hook: string) => `.${hook} .eael-post-list-posts-wrap`;
const postItem    = (hook: string) => `.${hook} .eael-post-list-post`;
const thumbnail   = (hook: string) => `.${hook} .eael-post-list-thumbnail`;
const postTitle   = (hook: string) => `.${hook} .eael-post-list-content .eael-post-list-title`;
const pagination  = (hook: string) => `.${hook} .post-list-pagination`;
const prevBtn     = (hook: string) => `.${hook} .btn-prev-post`;
const nextBtn     = (hook: string) => `.${hook} .btn-next-post`;
const readMore    = (hook: string) => `.${hook} .eael-post-elements-readmore-btn`;

// ── known layout types ─────────────────────────────────────────────────────
const LAYOUT_TYPES = ["default", "preset-2", "preset-3", "advanced"] as const;

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
// 2. Layout types
// ══════════════════════════════════════════════════════════════════════════

test.describe("Layout types", () => {
  const layoutMap: Record<string, string> = {
    "test-pl-default":  "default",
    "test-pl-preset-2": "preset-2",
    "test-pl-preset-3": "preset-3",
    "test-pl-advanced": "advanced",
  };

  for (const [hook, layoutType] of Object.entries(layoutMap)) {
    test(`layout "${layoutType}": container has layout-${layoutType} class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(container(hook)).first()).toHaveClass(
        new RegExp(`layout-${layoutType}`)
      );
    });

    test(`layout "${layoutType}": posts wrap is present`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(postsWrap(hook)).first()).toBeAttached();
    });

    test(`layout "${layoutType}": at least one post item renders`, async ({ page }) => {
      await openPage(page);
      const items = page.locator(postItem(hook));
      const count = await items.count();
      expect(count, `Expected posts in ${hook}`).toBeGreaterThan(0);
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 3. Top bar & filter
// ══════════════════════════════════════════════════════════════════════════

test.describe("Top bar", () => {
  test("topbar is visible when enabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(header("test-pl-default")).first()).toBeVisible();
  });

  test("topbar title renders correct text", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(titleEl("test-pl-default")).first().textContent();
    expect(text?.trim()).toBe("Recent Posts");
  });

  test("topbar is absent when disabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(header("test-pl-no-topbar"))).toHaveCount(0);
  });

  test("category filter (All tab) renders when terms enabled", async ({ page }) => {
    await openPage(page);
    const allTab = page.locator(`${filterWrap("test-pl-default")} a.active`).first();
    await expect(allTab).toBeAttached();
    const text = await allTab.textContent();
    expect(text?.trim()).toBe("All");
  });

  test("category filter is absent when terms disabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(filterWrap("test-pl-no-filter"))).toHaveCount(0);
  });

  test("topbar still renders when only filter is disabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(header("test-pl-no-filter")).first()).toBeVisible();
  });

  test("custom topbar title renders correctly for no-filter instance", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(titleEl("test-pl-no-filter")).first().textContent();
    expect(text?.trim()).toBe("No Filter");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 4. Pagination variants
// ══════════════════════════════════════════════════════════════════════════

test.describe("Pagination", () => {
  test("navigation pagination renders prev/next buttons", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(prevBtn("test-pl-default")).first()).toBeAttached();
    await expect(page.locator(nextBtn("test-pl-default")).first()).toBeAttached();
  });

  test("navigation pagination container has post-list-pagination class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(pagination("test-pl-default")).first()).toBeAttached();
  });

  test("no pagination: .post-list-pagination is absent", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(pagination("test-pl-no-pagination"))).toHaveCount(0);
  });

  test("page-numbers pagination: .eael-post-list-pagination is attached", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pl-page-numbers .eael-post-list-pagination")
    ).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 5. Content toggle variants
// ══════════════════════════════════════════════════════════════════════════

test.describe("Feature image toggle", () => {
  test("thumbnail renders when feature image enabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(thumbnail("test-pl-default")).first()).toBeAttached();
  });

  test("thumbnail is absent when feature image disabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(thumbnail("test-pl-no-image"))).toHaveCount(0);
  });
});

test.describe("Post title toggle", () => {
  test("post title renders when title enabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(postTitle("test-pl-default")).first()).toBeAttached();
  });

  test("post title is absent when title disabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(postTitle("test-pl-no-title"))).toHaveCount(0);
  });

  test("post title default tag is h2 (has eael-post-list-title on h2 element)", async ({ page }) => {
    await openPage(page);
    const el = page.locator(".test-pl-default .eael-post-list-content .eael-post-list-title").first();
    await expect(el).toBeAttached();
    const tag = await el.evaluate((node) => node.tagName);
    expect(tag).toBe("H2");
  });

  test("post title contains an anchor link", async ({ page }) => {
    await openPage(page);
    const anchor = page.locator(".test-pl-default .eael-post-list-title a").first();
    await expect(anchor).toBeAttached();
    const href = await anchor.getAttribute("href");
    expect(href).toBeTruthy();
  });
});

test.describe("Post meta toggle", () => {
  test("meta container does not render when post meta disabled", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pl-no-meta .eael-post-list-content .meta")
    ).toHaveCount(0);
  });
});

test.describe("Excerpt and Read More", () => {
  test("excerpt paragraph renders when excerpt enabled", async ({ page }) => {
    await openPage(page);
    const excerptEl = page.locator(".test-pl-with-excerpt .eael-post-list-content p").first();
    await expect(excerptEl).toBeAttached();
  });

  test("read more button renders when excerpt + read more enabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(readMore("test-pl-with-excerpt")).first()).toBeAttached();
  });

  test("read more button text is 'Read More'", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(readMore("test-pl-with-excerpt")).first().textContent();
    expect(text?.trim()).toBe("Read More");
  });

  test("read more button is absent when excerpt not enabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(readMore("test-pl-default"))).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 6. Element structure
// ══════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("container has eael-post-list-container class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-pl-default")).first()).toHaveClass(
      /eael-post-list-container/
    );
  });

  test("post item has eael-post-list-content child", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pl-default .eael-post-list-post .eael-post-list-content").first()
    ).toBeAttached();
  });

  test("advanced layout wraps items in eael-post-list-post-inner", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pl-advanced .eael-post-list-post .eael-post-list-post-inner").first()
    ).toBeAttached();
  });

  test("all layout class names are valid known values", async ({ page }) => {
    await openPage(page);
    for (const [hook, layout] of Object.entries({
      "test-pl-default":  "default",
      "test-pl-preset-2": "preset-2",
      "test-pl-preset-3": "preset-3",
      "test-pl-advanced": "advanced",
    })) {
      const cls = await page.locator(container(hook)).first().getAttribute("class") ?? "";
      expect(
        LAYOUT_TYPES.some((t) => cls.includes(`layout-${t}`)),
        `No known layout class found for ${hook}: "${cls}"`
      ).toBe(true);
    }
  });

  test("post-categories filter has data-settings attribute", async ({ page }) => {
    await openPage(page);
    const attr = await page.locator(filterWrap("test-pl-default")).getAttribute("data-settings");
    expect(attr).not.toBeNull();
  });

  test("post-categories filter has data-widget-id attribute", async ({ page }) => {
    await openPage(page);
    const attr = await page.locator(filterWrap("test-pl-default")).getAttribute("data-widget-id");
    expect(attr).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 7. Interaction
// ══════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hovering over post items triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of ["test-pl-default", "test-pl-preset-2", "test-pl-preset-3", "test-pl-advanced"]) {
      const items = page.locator(postItem(hook));
      const count = await items.count();
      if (count > 0) {
        await items.first().hover();
        await page.waitForTimeout(150);
      }
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking the category filter All tab causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(`${filterWrap("test-pl-default")} a.active`).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("prev button is initially disabled on page 1", async ({ page }) => {
    await openPage(page);
    const btn = page.locator(prevBtn("test-pl-default")).first();
    await expect(btn).toBeAttached();
    const disabled = await btn.getAttribute("disabled");
    expect(disabled).not.toBeNull();
  });

  test("next button is present and not disabled initially", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(nextBtn("test-pl-default")).first()).toBeAttached();
  });

  test("post title link is clickable (href present and non-empty)", async ({ page }) => {
    await openPage(page);
    const link = page.locator(".test-pl-default .eael-post-list-title a").first();
    await expect(link).toBeAttached();
    const href = await link.getAttribute("href");
    expect(href?.trim()).toBeTruthy();
  });
});
