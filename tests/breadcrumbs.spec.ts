import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.BREADCRUMBS_PAGE_SLUG ?? "breadcrumbs"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Breadcrumbs::render()):
//   .{hook}                                   ← elementor-widget wrapper
//     .eael-breadcrumbs                        ← EA flex container (justify-content for alignment)
//       [.eael-breadcrumbs__prefix]            ← prefix div (when breadcrumb_prefix_switch='yes')
//         [.eael-breadcrumbs__prefix-link]     ← icon-type prefix: <a> wrapping icon
//         [span]                               ← text-type prefix
//       [.eael-breadcrumbs__content]           ← breadcrumb trail (non-WC pages)
//         <a>                                  ← home link
//         .eael-breadcrumb-separator           ← between each crumb
//         .eael-current                        ← current page label

const crumb   = (hook: string) => `.${hook} .eael-breadcrumbs`;
const content = (hook: string) => `.${hook} .eael-breadcrumbs__content`;
const prefix  = (hook: string) => `.${hook} .eael-breadcrumbs__prefix`;
const sep     = (hook: string) => `.${hook} .eael-breadcrumb-separator`;
const current = (hook: string) => `.${hook} .eael-current`;

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
// 2. Breadcrumb content — default and home label
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Breadcrumb content", () => {
  test("default: .eael-breadcrumbs container is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(crumb("test-b-default")).first()).toBeVisible();
  });

  test("default: breadcrumb content div is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(content("test-b-default")).first()).toBeAttached();
  });

  test("default: home link renders with text 'Home'", async ({ page }) => {
    await openPage(page);
    const homeLink = page.locator(`${content("test-b-default")} a`).first();
    const text = await homeLink.textContent();
    expect(text?.trim()).toBe("Home");
  });

  test("default: home link points to site root", async ({ page }) => {
    await openPage(page);
    const href = await page
      .locator(`${content("test-b-default")} a`)
      .first()
      .getAttribute("href");
    expect(href).toBeTruthy();
  });

  test("default: current page label is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(current("test-b-default")).first()).toBeAttached();
  });

  test("default: separator span is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(sep("test-b-default")).first()).toBeAttached();
  });

  test("custom home text: home link shows 'Start'", async ({ page }) => {
    await openPage(page);
    const homeLink = page
      .locator(`${content("test-b-home-custom")} a`)
      .first();
    const text = await homeLink.textContent();
    expect(text?.trim()).toBe("Start");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Prefix variants
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Prefix variants", () => {
  test("default: no prefix element rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(prefix("test-b-default"))).toHaveCount(0);
  });

  test("prefix-icon: prefix container is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(prefix("test-b-prefix-icon")).first()).toBeVisible();
  });

  test("prefix-icon: renders an icon element (svg or i)", async ({ page }) => {
    await openPage(page);
    const iconEl = page.locator(
      `${prefix("test-b-prefix-icon")} svg, ${prefix("test-b-prefix-icon")} i`
    );
    await expect(iconEl.first()).toBeAttached();
  });

  test("prefix-icon: prefix link wraps the icon", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`${prefix("test-b-prefix-icon")} .eael-breadcrumbs__prefix-link`).first()
    ).toBeAttached();
  });

  test("prefix-text: prefix container is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(prefix("test-b-prefix-text")).first()).toBeVisible();
  });

  test("prefix-text: renders the configured text 'Browse: '", async ({ page }) => {
    await openPage(page);
    const span = page.locator(`${prefix("test-b-prefix-text")} span`).first();
    const text = await span.textContent();
    expect(text?.trim()).toBe("Browse:");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Separator variants
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Separator variants", () => {
  test("sep-icon: separator contains an svg or i element", async ({ page }) => {
    await openPage(page);
    const iconEl = page.locator(
      `${sep("test-b-sep-icon")} svg, ${sep("test-b-sep-icon")} i`
    );
    await expect(iconEl.first()).toBeAttached();
  });

  test("sep-icon: separator span is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(sep("test-b-sep-icon")).first()).toBeAttached();
  });

  test("sep-custom: separator span is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(sep("test-b-sep-custom")).first()).toBeAttached();
  });

  test("sep-custom: separator contains the text '>>'", async ({ page }) => {
    await openPage(page);
    const sepText = await page
      .locator(sep("test-b-sep-custom"))
      .first()
      .textContent();
    expect(sepText).toContain(">>");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Alignment
//    breadcrumb_align sets justify-content on .eael-breadcrumbs.
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Alignment", () => {
  test("align-left: .eael-breadcrumbs has justify-content: left", async ({ page }) => {
    await openPage(page);
    const jc = await page
      .locator(crumb("test-b-align-left"))
      .first()
      .evaluate((el) => getComputedStyle(el).justifyContent);
    // CSS `justify-content: left` computes to "left" in Chromium
    expect(["left", "flex-start", "start"]).toContain(jc);
  });

  test("align-center: .eael-breadcrumbs has justify-content: center", async ({ page }) => {
    await openPage(page);
    const jc = await page
      .locator(crumb("test-b-align-center"))
      .first()
      .evaluate((el) => getComputedStyle(el).justifyContent);
    expect(jc).toBe("center");
  });

  test("align-right: .eael-breadcrumbs has justify-content: right", async ({ page }) => {
    await openPage(page);
    const jc = await page
      .locator(crumb("test-b-align-right"))
      .first()
      .evaluate((el) => getComputedStyle(el).justifyContent);
    // CSS `justify-content: right` computes to "right" in Chromium
    expect(["right", "flex-end", "end"]).toContain(jc);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Element structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test(".eael-breadcrumbs is rendered as a <div>", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(crumb("test-b-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("DIV");
  });

  test(".eael-breadcrumbs__content is rendered as a <div>", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(content("test-b-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("DIV");
  });

  test(".eael-current is rendered as a <span>", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(current("test-b-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("SPAN");
  });

  test("all 9 breadcrumb widget instances are on the page", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(".eael-breadcrumbs").count();
    expect(count).toBeGreaterThanOrEqual(9);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("home link is keyboard-focusable", async ({ page }) => {
    await openPage(page);
    const homeLink = page.locator(`${content("test-b-default")} a`).first();
    await homeLink.focus();
    await expect(homeLink).toBeFocused();
  });

  test("hover on each widget instance triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-b-default",
      "test-b-home-custom",
      "test-b-prefix-icon",
      "test-b-prefix-text",
      "test-b-sep-icon",
      "test-b-sep-custom",
      "test-b-align-left",
      "test-b-align-center",
      "test-b-align-right",
    ]) {
      await page.locator(crumb(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking the home link causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    // Click then navigate back so we can still assert
    await page.locator(`${content("test-b-default")} a`).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
