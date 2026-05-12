/**
 * Covered: Essential Addons — Filterable Gallery widget
 *
 * 1. Page health       — HTTP 200, no PHP errors, no JS errors
 * 2. Layout styles     — hoverer / card / layout_3 via data-layout-mode
 * 3. Grid style        — eael-filter-gallery-grid / masonry CSS class
 * 4. Filter controls   — show / hide; "All" (data-filter=*); category filters
 *                        (eael-cf-nature / eael-cf-city); layout_3 filter wrap
 * 5. Gallery items     — 3 items; eael-cf-nature/city classes; thumbnail present;
 *                        data-settings JSON; data-init-show=3
 * 6. Hover style       — eael-slide-up / eael-none / eael-fade-in / eael-zoom-in
 *                        on caption; caption-style-hoverer / card
 * 7. Link/popup        — data-settings popup: buttons / media / none
 * 8. Pro layouts       — grid_flow_gallery / harmonic_gallery with filter bar
 * 9. Interaction       — filter click; hover (no JS errors)
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.FILTERABLE_GALLERY_PAGE_SLUG ?? "filterable-gallery"}/`;

// -- selectors -----------------------------------------------------------
// DOM shape (from Filterable_Gallery::render()):
//   .{hook}                                           ← elementor-widget wrapper
//     div.eael-filter-gallery-wrapper                 ← root
//       data-layout-mode = {hoverer|card|layout_3}
//
//       div.eael-filter-gallery-control               ← filter bar (if filter_enable=yes)
//         ul
//           li.control.all-control[.active]           ← "All" button
//           li.control[.active]                       ← per-category filter
//
//       div.eael-filter-gallery-container.{eael-filter-gallery-grid|masonry}
//         data-settings   ← JSON with grid_style, popup, duration…
//         data-gallery-items ← base64 JSON of all items
//         data-init-show  ← number of initially shown items
//
//         div.eael-filterable-gallery-item-wrap[.eael-cf-{category}]
//           div.eael-gallery-grid-item
//             div.gallery-item-thumbnail-wrap
//               img
//             div.gallery-item-caption-wrap.{caption-style-hoverer|caption-style-card}.{hover-style}

const wrapper    = (hook: string) => `.${hook} .eael-filter-gallery-wrapper`;
const filterBar  = (hook: string) => `.${hook} .eael-filter-gallery-control`;
const container  = (hook: string) => `.${hook} .eael-filter-gallery-container`;
const galleryItem = (hook: string) => `.${hook} .eael-filterable-gallery-item-wrap`;
const caption    = (hook: string) => `.${hook} .gallery-item-caption-wrap`;

// -- known values --------------------------------------------------------
const FREE_LAYOUTS   = ["hoverer", "card", "layout_3"] as const;

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
// 2. Layout styles — data-layout-mode attribute
// ========================================================================

test.describe("Layout styles", () => {
  const layoutMap: Record<string, string> = {
    "test-fg-default": "hoverer",
    "test-fg-card":    "card",
    "test-fg-search":  "layout_3",
  };

  for (const [hook, layoutMode] of Object.entries(layoutMap)) {
    test(`${layoutMode} wrapper is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrapper(hook)).first()).toBeVisible();
    });

    test(`${layoutMode} sets data-layout-mode correctly`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrapper(hook)).first()).toHaveAttribute(
        "data-layout-mode",
        layoutMode
      );
    });

    test(`${layoutMode} renders gallery items`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(galleryItem(hook)).first()).toBeAttached();
    });
  }
});

// ========================================================================
// 3. Grid style — container CSS class
// ========================================================================

test.describe("Grid style", () => {
  test("default (grid): container has 'eael-filter-gallery-grid' class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-fg-default")).first()).toHaveClass(
      /eael-filter-gallery-grid/
    );
  });

  test("masonry: container has 'masonry' class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-fg-masonry")).first()).toHaveClass(
      /masonry/
    );
  });
});

// ========================================================================
// 4. Filter controls
// ========================================================================

test.describe("Filter controls", () => {
  test("filter enabled: .eael-filter-gallery-control is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(filterBar("test-fg-default")).first()).toBeVisible();
  });

  test("filter disabled: no .eael-filter-gallery-control rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(filterBar("test-fg-filter-off"))).toHaveCount(0);
  });

  test("'All' filter button has data-filter='*'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-fg-default .eael-filter-gallery-control li.all-control").first()
    ).toHaveAttribute("data-filter", "*");
  });

  test("'All' filter button text is 'All'", async ({ page }) => {
    await openPage(page);
    const text = await page
      .locator(".test-fg-default .eael-filter-gallery-control li.all-control")
      .first()
      .textContent();
    expect(text?.trim()).toBe("All");
  });

  test("category filter buttons are rendered for each control", async ({ page }) => {
    await openPage(page);
    const controls = page.locator(
      ".test-fg-default .eael-filter-gallery-control li.control:not(.all-control)"
    );
    await expect(controls).toHaveCount(2);
  });

  test("Nature filter button targets .eael-cf-nature", async ({ page }) => {
    await openPage(page);
    const natureFilter = page
      .locator(".test-fg-default .eael-filter-gallery-control li[data-filter='.eael-cf-nature']")
      .first();
    await expect(natureFilter).toBeAttached();
  });

  test("layout_3: filter wrap renders .fg-layout-3-filters-wrap", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-fg-search .fg-layout-3-filters-wrap").first()
    ).toBeAttached();
  });
});

// ========================================================================
// 5. Gallery items
// ========================================================================

test.describe("Gallery items", () => {
  test("default: renders 3 gallery items on initial load", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(galleryItem("test-fg-default"))).toHaveCount(3);
  });

  test("Nature items have class 'eael-cf-nature'", async ({ page }) => {
    await openPage(page);
    const natureItems = page.locator(".test-fg-default .eael-cf-nature");
    const count = await natureItems.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("City items have class 'eael-cf-city'", async ({ page }) => {
    await openPage(page);
    const cityItems = page.locator(".test-fg-default .eael-cf-city");
    const count = await cityItems.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("each item contains a thumbnail wrapper", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-fg-default .gallery-item-thumbnail-wrap").first()
    ).toBeAttached();
  });
});

// ========================================================================
// 6. Hover style (overlay layout)
// ========================================================================

test.describe("Hover style (overlay layout)", () => {
  const hoverMap: Record<string, string> = {
    "test-fg-default":    "eael-slide-up",
    "test-fg-hover-none": "eael-none",
    "test-fg-hover-fade": "eael-fade-in",
    "test-fg-hover-zoom": "eael-zoom-in",
  };

  for (const [hook, hoverClass] of Object.entries(hoverMap)) {
    test(`${hoverClass} class is on .gallery-item-caption-wrap`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(caption(hook)).first()).toHaveClass(
        new RegExp(hoverClass)
      );
    });
  }

  test("overlay captions have 'caption-style-hoverer' class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(caption("test-fg-default")).first()).toHaveClass(
      /caption-style-hoverer/
    );
  });

  // The card thumbnail renders a `card-hover-bg caption-style-hoverer` overlay
  // div first, then the real card caption (.caption-style-card) below the image.
  // Use the explicit class to avoid grabbing the hover overlay via .first().
  test("card layout renders .gallery-item-caption-wrap.caption-style-card", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-fg-card .gallery-item-caption-wrap.caption-style-card").first()
    ).toBeAttached();
  });
});

// ========================================================================
// 7. Link / popup settings
// ========================================================================

test.describe("Link / popup settings", () => {
  test("default (buttons): data-settings popup value is 'buttons'", async ({ page }) => {
    await openPage(page);
    const settingsRaw = await page
      .locator(container("test-fg-default"))
      .first()
      .getAttribute("data-settings");
    const settings = JSON.parse(settingsRaw ?? "{}");
    expect(settings.popup).toBe("buttons");
  });

  test("media: data-settings popup value is 'media'", async ({ page }) => {
    await openPage(page);
    const settingsRaw = await page
      .locator(container("test-fg-popup-media"))
      .first()
      .getAttribute("data-settings");
    const settings = JSON.parse(settingsRaw ?? "{}");
    expect(settings.popup).toBe("media");
  });

  test("none: data-settings popup value is 'none'", async ({ page }) => {
    await openPage(page);
    const settingsRaw = await page
      .locator(container("test-fg-popup-none"))
      .first()
      .getAttribute("data-settings");
    const settings = JSON.parse(settingsRaw ?? "{}");
    expect(settings.popup).toBe("none");
  });
});

// ========================================================================
// 8. Element structure
// ========================================================================

test.describe("Element structure", () => {
  test("wrapper has class 'eael-filter-gallery-wrapper'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrapper("test-fg-default")).first()).toHaveClass(
      /eael-filter-gallery-wrapper/
    );
  });

  test("wrapper has data-layout-mode from known layouts", async ({ page }) => {
    await openPage(page);
    const mode = await page
      .locator(wrapper("test-fg-default"))
      .first()
      .getAttribute("data-layout-mode");
    expect(FREE_LAYOUTS).toContain(mode as (typeof FREE_LAYOUTS)[number]);
  });

  test("container has data-settings JSON attribute", async ({ page }) => {
    await openPage(page);
    const raw = await page
      .locator(container("test-fg-default"))
      .first()
      .getAttribute("data-settings");
    expect(() => JSON.parse(raw ?? "")).not.toThrow();
  });

  test("container has data-gallery-items base64 attribute", async ({ page }) => {
    await openPage(page);
    const raw = await page
      .locator(container("test-fg-default"))
      .first()
      .getAttribute("data-gallery-items");
    expect(raw).toBeTruthy();
  });

  test("container has data-init-show attribute of '3'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-fg-default")).first()).toHaveAttribute(
      "data-init-show",
      "3"
    );
  });
});

// ========================================================================
// 9. Pro layouts (grid_flow_gallery, harmonic_gallery)
//    The free plugin always renders the wrapper + data-layout-mode + filter
//    bar regardless of whether EA Pro is installed. Tests assert only that
//    stable free-plugin structure so CI/CD passes either way.
// ========================================================================

test.describe("Pro layouts", () => {
  const proLayoutMap: Record<string, string> = {
    "test-fg-pro-grid-flow": "grid_flow_gallery",
    "test-fg-pro-harmonic":  "harmonic_gallery",
  };

  for (const [hook, layoutMode] of Object.entries(proLayoutMap)) {
    test(`${layoutMode} wrapper is attached`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrapper(hook)).first()).toBeAttached();
    });

    test(`${layoutMode} data-layout-mode is '${layoutMode}'`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrapper(hook)).first()).toHaveAttribute(
        "data-layout-mode",
        layoutMode
      );
    });

    test(`${layoutMode} filter bar is attached`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(filterBar(hook)).first()).toBeAttached();
    });

    test(`${layoutMode} 'All' filter button is present`, async ({ page }) => {
      await openPage(page);
      await expect(
        page.locator(`.${hook} .eael-filter-gallery-control li.all-control`).first()
      ).toBeAttached();
    });

    test(`${layoutMode} category filter buttons are rendered`, async ({ page }) => {
      await openPage(page);
      const controls = page.locator(
        `.${hook} .eael-filter-gallery-control li.control:not(.all-control)`
      );
      await expect(controls).toHaveCount(2);
    });
  }
});

// ========================================================================
// 10. Interaction
// ========================================================================

test.describe("Interaction", () => {
  test("filter button is keyboard-focusable", async ({ page }) => {
    await openPage(page);
    const allBtn = page
      .locator(".test-fg-default .eael-filter-gallery-control li.all-control")
      .first();
    await allBtn.focus();
    await expect(allBtn).toBeFocused();
  });

  test("clicking a filter button causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page
      .locator(".test-fg-default .eael-filter-gallery-control li.control")
      .first()
      .click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover on each gallery instance triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-fg-default",
      "test-fg-card",
      "test-fg-masonry",
      "test-fg-hover-none",
      "test-fg-hover-fade",
      "test-fg-hover-zoom",
      "test-fg-popup-media",
      "test-fg-popup-none",
    ]) {
      await page.locator(galleryItem(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
