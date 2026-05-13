/**
 * Covered: Essential Addons — Woo Collections widget (Pro)
 *
 * NOTE: Pro-only widget. Requires WooCommerce active.
 * When no category/tag/attribute term is resolved the widget falls back to
 * link="#" and title "Collection Name" — this is the expected baseline state.
 *
 * 1. Page health         — HTTP 200, no PHP errors, no JS errors
 * 2. Layout styles       — default (layout-) and style-two (layout-two) class
 * 3. Collection type     — category term resolves real name and link
 * 4. Badge toggle        — badge present/absent, correct label text
 * 5. Horizontal align    — overlay carries the correct HR class
 * 6. Vertical align      — overlay-inner carries the correct VR class
 * 7. BG hover effects    — img carries the correct hover-effect class
 * 8. Element structure   — img, overlay, h2, span always rendered
 * 9. Interaction         — link is focusable; hover triggers no JS errors
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.WOO_COLLECTIONS_PAGE_SLUG ?? "woo-collections"}/`;

// ── selectors ──────────────────────────────────────────────────────────────
// DOM shape (from Woo_Collections::render()):
//
//   .{hook}
//     .eael-woo-collections.eael-woo-collections-layout-{layout}
//       <a href="{term_link | #}">
//         <img class="eael-woo-collections-bg {bg_hover_effect}" src="...">
//         <div class="eael-woo-collections-overlay {hr_class}">
//           <div class="eael-woo-collections-overlay-inner {vr_class}">
//             <div class="eael-woo-collection-badge">{badge}</div>  ← optional
//             <span>{subtitle}</span>
//             <h2>{name}</h2>
//           </div>
//         </div>
//       </a>

const container   = (hook: string) => `.${hook} .eael-woo-collections`;
const link        = (hook: string) => `.${hook} .eael-woo-collections > a`;
const bgImg       = (hook: string) => `.${hook} .eael-woo-collections-bg`;
const overlay     = (hook: string) => `.${hook} .eael-woo-collections-overlay`;
const overlayInner = (hook: string) => `.${hook} .eael-woo-collections-overlay-inner`;
const title       = (hook: string) => `.${hook} .eael-woo-collections-overlay-inner h2`;
const subtitle    = (hook: string) => `.${hook} .eael-woo-collections-overlay-inner span`;
const badge       = (hook: string) => `.${hook} .eael-woo-collection-badge`;

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
// 2. Layout styles
// ============================================================================

test.describe("Layout styles", () => {
  const layoutMap: Record<string, string> = {
    "test-wcol-default":   "eael-woo-collections-layout-",
    "test-wcol-style-two": "eael-woo-collections-layout-two",
  };

  for (const [hook, layoutClass] of Object.entries(layoutMap)) {
    test(`${hook}: .eael-woo-collections is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(container(hook)).first()).toBeVisible();
    });

    test(`${hook}: carries layout class "${layoutClass}"`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(container(hook)).first()).toHaveClass(
        new RegExp(layoutClass.replace("-", "\\-"))
      );
    });
  }
});

// ============================================================================
// 3. Collection type — category term resolves real name
// ============================================================================

test.describe("Collection type — category", () => {
  test("test-wcol-category: h2 shows resolved category name Clothing", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(title("test-wcol-category")).first()).toContainText("Clothing");
  });

  test("test-wcol-category: link href is not # (resolved to real term URL)", async ({ page }) => {
    await openPage(page);
    const href = await page.locator(link("test-wcol-category")).first().getAttribute("href");
    expect(href).not.toBe("#");
    expect(href).toBeTruthy();
  });

  test("test-wcol-category: subtitle shows custom text Shop Now", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(subtitle("test-wcol-category")).first()).toContainText("Shop Now");
  });

  test("test-wcol-default: h2 shows fallback Collection Name when no term set", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(title("test-wcol-default")).first()).toContainText("Collection Name");
  });

  test("test-wcol-default: link href is # (no term set)", async ({ page }) => {
    await openPage(page);
    const href = await page.locator(link("test-wcol-default")).first().getAttribute("href");
    expect(href).toBe("#");
  });
});

// ============================================================================
// 4. Badge toggle
// ============================================================================

test.describe("Badge toggle", () => {
  test("test-wcol-badge: .eael-woo-collection-badge is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(badge("test-wcol-badge")).first()).toBeVisible();
  });

  test("test-wcol-badge: badge text is New", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(badge("test-wcol-badge")).first()).toContainText("New");
  });

  test("test-wcol-no-badge: .eael-woo-collection-badge is not rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(badge("test-wcol-no-badge"))).toHaveCount(0);
  });

  test("test-wcol-default: .eael-woo-collection-badge is not rendered (default off)", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(badge("test-wcol-default"))).toHaveCount(0);
  });
});

// ============================================================================
// 5. Horizontal overlay alignment
// ============================================================================

test.describe("Horizontal alignment", () => {
  const hrMap: Record<string, string> = {
    "test-wcol-default":      "eael-woo-collections-overlay-left",
    "test-wcol-align-center": "eael-woo-collections-overlay-center",
    "test-wcol-align-right":  "eael-woo-collections-overlay-right",
  };

  for (const [hook, hrClass] of Object.entries(hrMap)) {
    test(`${hook}: overlay carries class "${hrClass}"`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(overlay(hook)).first()).toHaveClass(
        new RegExp(hrClass)
      );
    });
  }
});

// ============================================================================
// 6. Vertical overlay alignment
// ============================================================================

test.describe("Vertical alignment", () => {
  const vrMap: Record<string, string> = {
    "test-wcol-default":    "eael-woo-collections-overlay-inner-bottom",
    "test-wcol-vr-top":     "eael-woo-collections-overlay-inner-top",
    "test-wcol-vr-middle":  "eael-woo-collections-overlay-inner-middle",
  };

  for (const [hook, vrClass] of Object.entries(vrMap)) {
    test(`${hook}: overlay-inner carries class "${vrClass}"`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(overlayInner(hook)).first()).toHaveClass(
        new RegExp(vrClass)
      );
    });
  }
});

// ============================================================================
// 7. Background hover effects
// ============================================================================

test.describe("Background hover effects", () => {
  const hoverMap: Record<string, string> = {
    "test-wcol-default":        "eael-woo-collections-bg-hover-zoom-in",
    "test-wcol-hover-blur":     "eael-woo-collections-bg-hover-blur",
    "test-wcol-hover-zoom-out": "eael-woo-collections-bg-hover-zoom-out",
  };

  for (const [hook, effectClass] of Object.entries(hoverMap)) {
    test(`${hook}: bg img carries class "${effectClass}"`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(bgImg(hook)).first()).toHaveClass(
        new RegExp(effectClass)
      );
    });
  }
});

// ============================================================================
// 8. Element structure
// ============================================================================

test.describe("Element structure", () => {
  const allHooks = [
    "test-wcol-default",
    "test-wcol-style-two",
    "test-wcol-category",
    "test-wcol-badge",
  ];

  for (const hook of allHooks) {
    test(`${hook}: bg img tag is rendered`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(bgImg(hook)).first()).toBeAttached();
    });

    test(`${hook}: overlay div is rendered`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(overlay(hook)).first()).toBeAttached();
    });

    test(`${hook}: h2 title is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(title(hook)).first()).toBeVisible();
    });

    test(`${hook}: subtitle span is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(subtitle(hook)).first()).toBeVisible();
    });
  }

  test("test-wcol-default: subtitle text is Collections", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(subtitle("test-wcol-default")).first()).toContainText("Collections");
  });
});

// ============================================================================
// 9. Interaction
// ============================================================================

test.describe("Interaction", () => {
  const hoverHooks = [
    "test-wcol-default",
    "test-wcol-style-two",
    "test-wcol-category",
    "test-wcol-badge",
    "test-wcol-hover-blur",
  ];

  for (const hook of hoverHooks) {
    test(`${hook}: hover triggers no JS errors`, async ({ page }) => {
      const errs = watchErrors(page);
      await openPage(page);
      await page.locator(container(hook)).first().hover();
      await page.waitForTimeout(150);
      expect(errs, errs.join(" | ")).toHaveLength(0);
    });
  }

  test("test-wcol-default: link is keyboard-focusable", async ({ page }) => {
    await openPage(page);
    const anchor = page.locator(link("test-wcol-default")).first();
    await anchor.focus();
    await expect(anchor).toBeFocused();
  });
});
