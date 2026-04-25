import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.DUAL_COLOR_HEADING_PAGE_SLUG ?? "dual-color-heading"}/`;

// ── selectors ─────────────────────────────────────────────────────────────────
// DOM shape (from Dual_Color_Header::render()):
//   .{hook}                              ← elementor-widget wrapper
//     .eael-dual-header                  ← EA main wrapper
//       (.eael-dch-separator-wrap)       ← separator (if enabled, before title)
//         .separator-one + .separator-two  ← line type
//       .title.eael-dch-title            ← heading element (tag from title_tag)
//         .eael-dch-title-text.lead      ← first part (single-title mode)
//         .eael-dch-title-text           ← last part (single-title mode)
//         .eael-dch-title-text.elementor-repeater-item-{id}  ← each span (multi mode)
//       (.eael-dch-separator-wrap)       ← separator (if enabled, after title)
//       .subtext                         ← sub text
//       .eael-dch-svg-icon               ← icon wrapper (dch-default: below subtext)

const header  = (hook: string) => `.${hook} .eael-dual-header`;
const title   = (hook: string) => `.${hook} .eael-dual-header .title`;
const subtext = (hook: string) => `.${hook} .eael-dual-header .subtext`;
const icon    = (hook: string) => `.${hook} .eael-dual-header .eael-dch-svg-icon`;
const sep     = (hook: string) => `.${hook} .eael-dual-header .eael-dch-separator-wrap`;

// ── layout style types (free) ─────────────────────────────────────────────────
const STYLE_MAP: Record<string, string> = {
  "test-dch-default":          "dch-default",
  "test-dch-icon-top":         "dch-icon-on-top",
  "test-dch-icon-subtext-top": "dch-icon-subtext-on-top",
  "test-dch-subtext-top":      "dch-subtext-on-top",
};

// ── helpers ───────────────────────────────────────────────────────────────────

async function openPage(page: Page) {
  await page.goto(PAGE_URL);
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
// 2. Layout style types — one instance per free style
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Layout style types", () => {
  for (const [hook] of Object.entries(STYLE_MAP)) {
    test(`${hook} — .eael-dual-header is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(header(hook)).first()).toBeVisible();
    });

    test(`${hook} — title element is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(title(hook)).first()).toBeVisible();
    });

    test(`${hook} — title contains expected text`, async ({ page }) => {
      await openPage(page);
      const text = await page.locator(title(hook)).first().textContent();
      expect(text?.trim()).toContain("Heading");
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Icon configuration
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Icon configuration", () => {
  test("icon-on: .eael-dch-svg-icon is rendered in default layout", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(icon("test-dch-default")).first()).toBeVisible();
  });

  test("icon-off: .eael-dch-svg-icon is not present when icon disabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(icon("test-dch-icon-off"))).toHaveCount(0);
  });

  test("icon-on-top style: icon appears before title in DOM", async ({ page }) => {
    await openPage(page);
    const wrapper = page.locator(".test-dch-icon-top .eael-dual-header").first();
    const iconEl  = wrapper.locator(".eael-dch-svg-icon").first();
    const titleEl = wrapper.locator(".title").first();
    const iconBox  = await iconEl.boundingBox();
    const titleBox = await titleEl.boundingBox();
    expect(iconBox?.y).toBeLessThan(titleBox?.y ?? 0);
  });

  test("icon-subtext-on-top style: icon appears before subtext in DOM", async ({ page }) => {
    await openPage(page);
    const wrapper   = page.locator(".test-dch-icon-subtext-top .eael-dual-header").first();
    const iconEl    = wrapper.locator(".eael-dch-svg-icon").first();
    const subtextEl = wrapper.locator(".subtext").first();
    const iconBox    = await iconEl.boundingBox();
    const subtextBox = await subtextEl.boundingBox();
    expect(iconBox?.y).toBeLessThan(subtextBox?.y ?? 0);
  });

  test("subtext-on-top style: icon appears after title in DOM", async ({ page }) => {
    await openPage(page);
    const wrapper  = page.locator(".test-dch-subtext-top .eael-dual-header").first();
    const iconEl   = wrapper.locator(".eael-dch-svg-icon").first();
    const titleEl  = wrapper.locator(".title").first();
    const iconBox  = await iconEl.boundingBox();
    const titleBox = await titleEl.boundingBox();
    expect(iconBox?.y).toBeGreaterThan(titleBox?.y ?? 0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Separator
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Separator", () => {
  test("separator hidden by default", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(sep("test-dch-default"))).toHaveCount(0);
  });

  test("line separator: .eael-dch-separator-wrap is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(sep("test-dch-separator")).first()).toBeVisible();
  });

  test("line separator: .separator-one element is present", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-dch-separator .separator-one").first()
    ).toBeAttached();
  });

  test("line separator: .separator-two element is present", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-dch-separator .separator-two").first()
    ).toBeAttached();
  });

  test("icon separator: .eael-dch-separator-wrap is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(sep("test-dch-separator-icon")).first()).toBeVisible();
  });

  test("icon separator: contains an <i> or <svg> element (no line spans)", async ({ page }) => {
    await openPage(page);
    const sepEl = page.locator(sep("test-dch-separator-icon")).first();
    const hasIcon = await sepEl.locator("i, svg").count();
    expect(hasIcon).toBeGreaterThan(0);
  });

  test("icon separator: no .separator-one / .separator-two spans", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-dch-separator-icon .separator-one")
    ).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Alignment
//    Alignment is applied as a prefix_class on the elementor widget wrapper:
//    .eael-dual-header-content-align-{value}
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Alignment", () => {
  test("left-aligned widget wrapper has eael-dual-header-content-align-left class", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-dch-align-left").first()
    ).toHaveClass(/eael-dual-header-content-align-left/);
  });

  test("right-aligned widget wrapper has eael-dual-header-content-align-right class", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-dch-align-right").first()
    ).toHaveClass(/eael-dual-header-content-align-right/);
  });

  test("default (center) widget wrapper has eael-dual-header-content-align-center class", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-dch-default").first()
    ).toHaveClass(/eael-dual-header-content-align-center/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Multiple titles mode
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Multiple titles mode", () => {
  const hook = "test-dch-multiple-titles";

  test("title element is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(title(hook)).first()).toBeVisible();
  });

  test("renders 'Alpha Title' span", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(title(hook)).first().textContent();
    expect(text).toContain("Alpha Title");
  });

  test("renders 'Beta Title' span", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(title(hook)).first().textContent();
    expect(text).toContain("Beta Title");
  });

  test("renders 'Gamma Title' span", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(title(hook)).first().textContent();
    expect(text).toContain("Gamma Title");
  });

  test("each title is a span inside .title.eael-dch-title", async ({ page }) => {
    await openPage(page);
    const spans = page.locator(`${title(hook)} span.eael-dch-title-text`);
    await expect(spans).toHaveCount(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Element structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("default title renders as <h2>", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(title("test-dch-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H2");
  });

  test("h4-variant title renders as <h4>", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(title("test-dch-tag-h4"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H4");
  });

  test("title has .eael-dch-title class", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(title("test-dch-default")).first()
    ).toHaveClass(/eael-dch-title/);
  });

  test("first title part has .lead class in single-title mode", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-dch-default .eael-dual-header .title .lead").first()
    ).toBeAttached();
  });

  test("subtext element is present inside .eael-dual-header", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(subtext("test-dch-default")).first()).toBeAttached();
  });

  test("gradient variant: first-part span has inline background style", async ({ page }) => {
    await openPage(page);
    const style = await page
      .locator(".test-dch-gradient .eael-dual-header .title .lead")
      .first()
      .getAttribute("style");
    expect(style).toContain("background");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover on each layout-type instance triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of Object.keys(STYLE_MAP)) {
      await page.locator(header(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover on separator instances triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of ["test-dch-separator", "test-dch-separator-icon"]) {
      await page.locator(header(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover on gradient variant triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(header("test-dch-gradient")).first().hover();
    await page.waitForTimeout(150);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
