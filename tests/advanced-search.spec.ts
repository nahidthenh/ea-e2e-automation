/**
 * Covered: Essential Addons — Advanced Search widget
 *
 * 1. Page health          — HTTP 200, no PHP errors, no JS errors
 * 2. Form layout styles   — 3 styles via eael-advanced-search-form-style-N class
 * 3. Result content styles — 3 styles via eael-item-style-N class
 * 4. Search button        — show / hide; default text / custom text
 * 5. Category dropdown    — show / hide; "All Categories" default option
 * 6. Search input attrs   — placeholder, autocomplete, name attributes
 * 7. Result container     — not-found element, load-more, data-settings JSON,
 *                           result_on_new_tab attribute
 * 8. Interaction          — typing in search input (no JS errors); form submit
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.ADVANCED_SEARCH_PAGE_SLUG ?? "advanced-search"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Advanced_Search::render()):
//   .{hook}                                     ← elementor-widget wrapper
//     .eael-adv-search-wrapper                  ← EA outer wrapper
//       .eael-advanced-search-widget            ← widget root
//         form.eael-advanced-search-form
//              .eael-advanced-search-form-style-{1|2|3}   ← layout style class
//           .eael-advanced-search-wrap
//             input.eael-advanced-search        ← search input
//           .eael-advance-search-select         ← category dropdown (conditional)
//             select.eael-adv-search-cate
//           button.eael-advanced-search-button  ← search button (conditional)
//         .eael-advanced-search-result          ← result container
//           .eael-advanced-search-content
//                .eael-item-style-{1|2|3}       ← content layout class

const wrapper    = (hook: string) => `.${hook} .eael-adv-search-wrapper`;
const form       = (hook: string) => `.${hook} .eael-advanced-search-form`;
const input      = (hook: string) => `.${hook} input.eael-advanced-search`;
const button     = (hook: string) => `.${hook} button.eael-advanced-search-button`;
const catSelect  = (hook: string) => `.${hook} select.eael-adv-search-cate`;
const resultArea = (hook: string) => `.${hook} .eael-advanced-search-result`;
const content    = (hook: string) => `.${hook} .eael-advanced-search-content`;

// ── known style values ────────────────────────────────────────────────────
const FORM_STYLES = ["1", "2", "3"] as const;
const RESULT_STYLES = ["1", "2", "3"] as const;

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
// 2. Form layout styles
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Form layout styles", () => {
  const styleMap: Record<string, string> = {
    "test-as-default":  "eael-advanced-search-form-style-1",
    "test-as-style-2":  "eael-advanced-search-form-style-2",
    "test-as-style-3":  "eael-advanced-search-form-style-3",
  };

  for (const [hook, styleClass] of Object.entries(styleMap)) {
    test(`${styleClass} — wrapper is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrapper(hook)).first()).toBeVisible();
    });

    test(`${styleClass} — form carries correct style class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(form(hook)).first()).toHaveClass(
        new RegExp(styleClass)
      );
    });

    test(`${styleClass} — search input is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(input(hook)).first()).toBeVisible();
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Result content styles
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Result content styles", () => {
  const contentStyleMap: Record<string, string> = {
    "test-as-default":   "eael-item-style-1",
    "test-as-result-2":  "eael-item-style-2",
    "test-as-result-3":  "eael-item-style-3",
  };

  for (const [hook, styleClass] of Object.entries(contentStyleMap)) {
    test(`${styleClass} — result container carries correct class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(content(hook)).first()).toHaveClass(
        new RegExp(styleClass)
      );
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Search button
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Search button", () => {
  test("button is visible when show_search_button=yes", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(button("test-as-default")).first()).toBeVisible();
  });

  test("button renders default text 'Search'", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(button("test-as-default")).first().textContent();
    expect(text?.trim()).toBe("Search");
  });

  test("button renders custom text 'Find Now'", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(button("test-as-btn-text")).first().textContent();
    expect(text?.trim()).toBe("Find Now");
  });

  test("button is absent when show_search_button=no", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(button("test-as-btn-hidden"))).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Category dropdown
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Category dropdown", () => {
  test("category select is absent by default", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(catSelect("test-as-default"))).toHaveCount(0);
  });

  test("category select is visible when show_category_list=yes", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(catSelect("test-as-category-on")).first()).toBeAttached();
  });

  test("category dropdown includes default 'All Categories' option", async ({ page }) => {
    await openPage(page);
    const firstOption = page
      .locator(`${catSelect("test-as-category-on")} option`)
      .first();
    const text = await firstOption.textContent();
    expect(text?.trim()).toBe("All Categories");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Search input attributes
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Search input attributes", () => {
  test("input has correct placeholder text", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(input("test-as-default")).first()).toHaveAttribute(
      "placeholder",
      "Enter Search Keyword"
    );
  });

  test("input has autocomplete='off'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(input("test-as-default")).first()).toHaveAttribute(
      "autocomplete",
      "off"
    );
  });

  test("input name is 'eael_advanced_search'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(input("test-as-default")).first()).toHaveAttribute(
      "name",
      "eael_advanced_search"
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Result container structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Result container structure", () => {
  test("result area is rendered for default widget", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(resultArea("test-as-default")).first()).toBeAttached();
  });

  test("not-found element is present in result area", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-as-default .eael-advanced-search-not-found").first()
    ).toBeAttached();
  });

  test("load-more element is present in result area", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-as-default .eael-advanced-search-load-more").first()
    ).toBeAttached();
  });

  test("load-more button has default 'View All Results' text", async ({ page }) => {
    await openPage(page);
    const text = await page
      .locator(".test-as-default .eael-advanced-search-load-more-button")
      .first()
      .textContent();
    expect(text?.trim()).toBe("View All Results");
  });

  test("data-settings attribute is present on the form", async ({ page }) => {
    await openPage(page);
    const attr = await page
      .locator(form("test-as-default"))
      .first()
      .getAttribute("data-settings");
    expect(attr).not.toBeNull();
    const parsed = JSON.parse(attr!);
    expect(parsed).toHaveProperty("post_per_page");
  });

  test("new-tab widget encodes result_on_new_tab=yes in data-settings", async ({ page }) => {
    await openPage(page);
    const attr = await page
      .locator(form("test-as-new-tab"))
      .first()
      .getAttribute("data-settings");
    const parsed = JSON.parse(attr!);
    expect(parsed.result_on_new_tab).toBe("yes");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("search input is keyboard-focusable", async ({ page }) => {
    await openPage(page);
    const field = page.locator(input("test-as-default")).first();
    await field.focus();
    await expect(field).toBeFocused();
  });

  test("typing in search input triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(input("test-as-default")).first().fill("hello");
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover on each widget instance triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-as-default",
      "test-as-style-2",
      "test-as-style-3",
      "test-as-result-2",
      "test-as-result-3",
      "test-as-btn-hidden",
      "test-as-category-on",
      "test-as-new-tab",
      "test-as-no-image",
    ]) {
      await page.locator(wrapper(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking search button causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(button("test-as-default")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
