import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.DYNAMIC_FILTERABLE_GALLERY_PAGE_SLUG ?? "dynamic-filterable-gallery"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Dynamic_Filterable_Gallery::render() + hoverer.php template):
//   .{hook}                                           ← elementor-widget wrapper
//     .eael-filter-gallery-wrapper                   ← gallery root
//       .eael-filter-position-{top|left}             ← filter position class
//       .eael-filter-gallery-control                 ← filter nav (when filter enabled)
//         ul
//           li.control.active[data-filter='*']       ← "All" button
//           li.control[data-filter='.{slug}']        ← per-term filter button
//       .eael-filter-gallery-container               ← content container
//         .{grid|masonry}                            ← layout class
//         .eael-{hoverer|cards}                      ← style class
//         [data-settings='{"has_filter":true,...}']
//           .dynamic-gallery-item                    ← per-post card
//             .dynamic-gallery-item-inner[data-itemid]
//               .dynamic-gallery-thumbnail
//                 img
//                 .caption.{hover-style}             ← absent when eael_fg_grid_hover_style=eael-none
//                   .item-content
//                     h2.title > a                   ← when eael_show_hover_title=yes
//                     p                              ← excerpt when eael_show_hover_excerpt=yes
//                   .buttons                        ← zoom + link icons

const wrapper = (hook: string) => `.${hook} .eael-filter-gallery-wrapper`;
const container = (hook: string) => `.${hook} .eael-filter-gallery-container`;
const filterNav = (hook: string) => `.${hook} .eael-filter-gallery-control`;
const allBtn = (hook: string) =>
  `.${hook} .eael-filter-gallery-control li.control.active[data-filter="*"]`;
const filterPos = (hook: string, pos: string) =>
  `.${hook} .eael-filter-position-${pos}`;
const galleryItem = (hook: string) => `.${hook} .dynamic-gallery-item`;
const caption = (hook: string, style: string) =>
  `.${hook} .caption.${style}`;
const titleEl = (hook: string) => `.${hook} h2.title`;
const excerptEl = (hook: string) => `.${hook} .item-content p`;

// ── style class map ────────────────────────────────────────────────────────
const STYLE_MAP: Record<string, string> = {
  "test-dfg-default": "eael-hoverer",
  "test-dfg-cards": "eael-cards",
};

// ── hover style map ────────────────────────────────────────────────────────
const HOVER_MAP: Record<string, string> = {
  "test-dfg-default": "eael-fade-in",
  "test-dfg-hover-slide": "eael-slide-up",
  "test-dfg-hover-zoom": "eael-zoom-in",
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
// 2. Style presets
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Style presets", () => {
  for (const [hook, styleClass] of Object.entries(STYLE_MAP)) {
    test(`${styleClass} — container carries style class`, async ({ page }) => {
      await openPage(page);
      await expect(
        page.locator(`${container(hook)}.${styleClass}`).first()
      ).toBeAttached();
    });

    test(`${styleClass} — wrapper is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrapper(hook)).first()).toBeVisible();
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Layout modes
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Layout modes", () => {
  test("grid — container carries 'grid' class", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`${container("test-dfg-default")}.grid`).first()
    ).toBeAttached();
  });

  test("masonry — container carries 'masonry' class", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`${container("test-dfg-masonry")}.masonry`).first()
    ).toBeAttached();
  });

  test("grid — data-settings encodes layout_mode=grid", async ({ page }) => {
    await openPage(page);
    const raw = await page
      .locator(container("test-dfg-default"))
      .first()
      .getAttribute("data-settings");
    const ds = JSON.parse(raw ?? "{}");
    expect(ds.layout_mode).toBe("grid");
  });

  test("masonry — data-settings encodes layout_mode=masonry", async ({
    page,
  }) => {
    await openPage(page);
    const raw = await page
      .locator(container("test-dfg-masonry"))
      .first()
      .getAttribute("data-settings");
    const ds = JSON.parse(raw ?? "{}");
    expect(ds.layout_mode).toBe("masonry");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Filter controls
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Filter controls", () => {
  test("filter nav is visible when show_gallery_filter_controls=1", async ({
    page,
  }) => {
    await openPage(page);
    await expect(page.locator(filterNav("test-dfg-default")).first()).toBeVisible();
  });

  test("filter nav is absent when show_gallery_filter_controls=0", async ({
    page,
  }) => {
    await openPage(page);
    await expect(page.locator(filterNav("test-dfg-no-filter"))).toHaveCount(0);
  });

  test("'All' button is active by default", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(allBtn("test-dfg-default")).first()).toBeAttached();
  });

  test("'All' button text matches eael_fg_all_label_text", async ({ page }) => {
    await openPage(page);
    const text = await page
      .locator(allBtn("test-dfg-default"))
      .first()
      .textContent();
    expect(text?.trim()).toBe("All");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Filter position
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Filter position", () => {
  test("position top — wrapper carries eael-filter-position-top", async ({
    page,
  }) => {
    await openPage(page);
    await expect(
      page.locator(filterPos("test-dfg-default", "top")).first()
    ).toBeAttached();
  });

  test("position left — wrapper carries eael-filter-position-left", async ({
    page,
  }) => {
    await openPage(page);
    await expect(
      page.locator(filterPos("test-dfg-filter-left", "left")).first()
    ).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Content toggles
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Content visibility — title", () => {
  test("title renders when eael_show_hover_title=yes", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(titleEl("test-dfg-default")).first()).toBeAttached();
  });

  test("title is absent when eael_show_hover_title=''", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(titleEl("test-dfg-no-title"))).toHaveCount(0);
  });
});

test.describe("Content visibility — excerpt", () => {
  test("excerpt renders when eael_show_hover_excerpt=yes", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(excerptEl("test-dfg-default")).first()
    ).toBeAttached();
  });

  test("excerpt is absent when eael_show_hover_excerpt=''", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(excerptEl("test-dfg-no-excerpt"))).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Hover styles
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Hover styles", () => {
  for (const [hook, hoverClass] of Object.entries(HOVER_MAP)) {
    test(`${hoverClass} — caption carries correct hover class`, async ({
      page,
    }) => {
      await openPage(page);
      await expect(
        page.locator(caption(hook, hoverClass)).first()
      ).toBeAttached();
    });
  }

  test("eael-none — caption element is absent", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-dfg-hover-none .caption")
    ).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Gallery items
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Gallery items", () => {
  test("default — gallery items render (post query returns results)", async ({
    page,
  }) => {
    await openPage(page);
    const count = await page.locator(galleryItem("test-dfg-default")).count();
    expect(count).toBeGreaterThan(0);
  });

  test("default — each gallery item has a data-itemid attribute", async ({
    page,
  }) => {
    await openPage(page);
    const inner = page
      .locator(".test-dfg-default .dynamic-gallery-item-inner")
      .first();
    const id = await inner.getAttribute("data-itemid");
    expect(id).toBeTruthy();
  });

  test("default — thumbnail image is present in each item", async ({
    page,
  }) => {
    await openPage(page);
    await expect(
      page
        .locator(".test-dfg-default .dynamic-gallery-thumbnail img")
        .first()
    ).toBeAttached();
  });

  test("data-settings has_filter is true", async ({ page }) => {
    await openPage(page);
    const raw = await page
      .locator(container("test-dfg-default"))
      .first()
      .getAttribute("data-settings");
    const ds = JSON.parse(raw ?? "{}");
    expect(ds.has_filter).toBe(true);
  });

  test("cards — gallery items render", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(galleryItem("test-dfg-cards")).count();
    expect(count).toBeGreaterThan(0);
  });

  test("masonry — gallery items render", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(galleryItem("test-dfg-masonry")).count();
    expect(count).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover on each widget instance triggers no JS errors", async ({
    page,
  }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-dfg-default",
      "test-dfg-cards",
      "test-dfg-masonry",
      "test-dfg-no-filter",
      "test-dfg-filter-left",
      "test-dfg-no-title",
      "test-dfg-no-excerpt",
      "test-dfg-hover-slide",
      "test-dfg-hover-zoom",
      "test-dfg-hover-none",
    ]) {
      const el = page.locator(wrapper(hook)).first();
      if (await el.count()) {
        await el.hover();
        await page.waitForTimeout(150);
      }
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking the 'All' filter button causes no JS errors", async ({
    page,
  }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(allBtn("test-dfg-default")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("filter nav items are clickable without JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    const items = page.locator(
      ".test-dfg-default .eael-filter-gallery-control li.control"
    );
    const count = await items.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      await items.nth(i).click();
      await page.waitForTimeout(200);
    }
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Visual regression
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Visual regression", () => {
  const HOOKS = [
    "test-dfg-default",
    "test-dfg-cards",
    "test-dfg-masonry",
    "test-dfg-no-filter",
    "test-dfg-filter-left",
    "test-dfg-no-title",
    "test-dfg-no-excerpt",
    "test-dfg-hover-slide",
    "test-dfg-hover-zoom",
    "test-dfg-hover-none",
  ];

  for (const hook of HOOKS) {
    test(`${hook} matches visual snapshot`, async ({ page }) => {
      await openPage(page);
      await page.waitForLoadState("networkidle");
      await page.locator(`.${hook}`).first().scrollIntoViewIfNeeded();
      await expect(page.locator(`.${hook}`).first()).toHaveScreenshot(
        `${hook}.png`,
        { animations: "disabled" }
      );
    });
  }
});
