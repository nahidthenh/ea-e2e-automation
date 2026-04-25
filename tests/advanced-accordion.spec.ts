import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.ADVANCED_ACCORDION_PAGE_SLUG ?? "advanced-accordion"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Adv_Accordion::render()):
//   .{hook}
//     div.eael-adv-accordion[data-accordion-type][data-toogle-speed]
//       div.eael-accordion-list                    ← one per tab
//         div.elementor-tab-title.eael-accordion-header[data-tab=N][.active-default?]
//           span.eael-advanced-accordion-icon-closed  ← per-tab closed icon
//           span.eael-advanced-accordion-icon-opened  ← per-tab opened icon
//           {span|hN}.eael-accordion-tab-title        ← title (tag set by eael_adv_accordion_title_tag)
//           <i|svg class="fa-toggle">                 ← global toggle icon (right position, default)
//         div.eael-accordion-content.clearfix[data-tab=N][.active-default?]
//           <content>

const accordion     = (hook: string) => `.${hook} .eael-adv-accordion`;
const list          = (hook: string) => `.${hook} .eael-accordion-list`;
const header        = (hook: string) => `.${hook} .eael-accordion-header`;
const tabTitle      = (hook: string) => `.${hook} .eael-accordion-tab-title`;
const content       = (hook: string) => `.${hook} .eael-accordion-content`;
const toggleIcon    = (hook: string) => `.${hook} .fa-toggle`;
const tabIconClosed = (hook: string) => `.${hook} .eael-advanced-accordion-icon-closed`;
const tabIconOpened = (hook: string) => `.${hook} .eael-advanced-accordion-icon-opened`;

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
// 2. Accordion types
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Accordion types", () => {
  test("accordion — data-accordion-type is 'accordion'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(accordion("test-aa-default")).first()).toHaveAttribute(
      "data-accordion-type",
      "accordion"
    );
  });

  test("toggle — data-accordion-type is 'toggle'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(accordion("test-aa-toggle")).first()).toHaveAttribute(
      "data-accordion-type",
      "toggle"
    );
  });

  test("accordion — renders 3 .eael-accordion-list items", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(list("test-aa-default"))).toHaveCount(3);
  });

  test("accordion — all tab headers are present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(header("test-aa-default"))).toHaveCount(3);
  });

  test("accordion — .eael-adv-accordion has data-toogle-speed attribute", async ({ page }) => {
    await openPage(page);
    const speed = await page
      .locator(accordion("test-aa-default"))
      .first()
      .getAttribute("data-toogle-speed");
    expect(speed).not.toBeNull();
    expect(Number(speed)).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Toggle icon
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Toggle icon", () => {
  test("icon on (default) — .fa-toggle elements are rendered", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(toggleIcon("test-aa-default")).count();
    expect(count).toBeGreaterThan(0);
  });

  test("icon off — no .fa-toggle rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(toggleIcon("test-aa-icon-off"))).toHaveCount(0);
  });

  test("icon left — toggle icon precedes title in header DOM", async ({ page }) => {
    await openPage(page);
    const firstHeader = page.locator(header("test-aa-icon-left")).first();
    const toggleIdx = await firstHeader.evaluate((el) => {
      const toggle = el.querySelector(".fa-toggle, .fa-toggle-svg");
      const title  = el.querySelector(".eael-accordion-tab-title");
      if (!toggle || !title) return -1;
      const children = Array.from(el.children);
      return children.indexOf(toggle as HTMLElement) < children.indexOf(title as HTMLElement) ? 0 : 1;
    });
    expect(toggleIdx).toBe(0);
  });

  test("icon right (default) — toggle icon follows title in header DOM", async ({ page }) => {
    await openPage(page);
    const firstHeader = page.locator(header("test-aa-default")).first();
    const toggleIdx = await firstHeader.evaluate((el) => {
      const toggle = el.querySelector(".fa-toggle, .fa-toggle-svg");
      const title  = el.querySelector(".eael-accordion-tab-title");
      if (!toggle || !title) return -1;
      const children = Array.from(el.children);
      return children.indexOf(toggle as HTMLElement) > children.indexOf(title as HTMLElement) ? 0 : 1;
    });
    expect(toggleIdx).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Per-tab icon
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Per-tab icon", () => {
  test("tab icon on (default) — .eael-advanced-accordion-icon-closed rendered", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(tabIconClosed("test-aa-default")).count();
    expect(count).toBeGreaterThan(0);
  });

  test("tab icon on (default) — .eael-advanced-accordion-icon-opened rendered", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(tabIconOpened("test-aa-default")).count();
    expect(count).toBeGreaterThan(0);
  });

  test("tab icon off — no .eael-advanced-accordion-icon-closed rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(tabIconClosed("test-aa-tab-icon-off"))).toHaveCount(0);
  });

  test("tab icon off — no .eael-advanced-accordion-icon-opened rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(tabIconOpened("test-aa-tab-icon-off"))).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Default active tab
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Default active tab", () => {
  test("first tab header has active-default class", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(header("test-aa-active-default")).first()
    ).toHaveClass(/active-default/);
  });

  test("first tab content has active-default class", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(content("test-aa-active-default")).first()
    ).toHaveClass(/active-default/);
  });

  test("non-active tabs do not have active-default class", async ({ page }) => {
    await openPage(page);
    const secondHeader = page.locator(header("test-aa-active-default")).nth(1);
    const cls = (await secondHeader.getAttribute("class")) ?? "";
    expect(cls).not.toMatch(/active-default/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Element structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("tab title text is rendered correctly", async ({ page }) => {
    await openPage(page);
    const titles = await page.locator(tabTitle("test-aa-default")).allTextContents();
    expect(titles.map((t) => t.trim())).toEqual(["Tab One", "Tab Two", "Tab Three"]);
  });

  test("tab title renders as default tag (span)", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(tabTitle("test-aa-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("SPAN");
  });

  test("title tag h3 — tab title renders as h3", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(tabTitle("test-aa-h3-title"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H3");
  });

  test("each accordion-header has tabindex attribute", async ({ page }) => {
    await openPage(page);
    const tabindexVal = await page
      .locator(header("test-aa-default"))
      .first()
      .getAttribute("tabindex");
    expect(tabindexVal).not.toBeNull();
  });

  test("each accordion-header has data-tab attribute", async ({ page }) => {
    await openPage(page);
    const dataTabs = await page
      .locator(header("test-aa-default"))
      .evaluateAll((els) => els.map((el) => el.getAttribute("data-tab")));
    expect(dataTabs).toEqual(["1", "2", "3"]);
  });

  test("accordion content divs have matching data-tab attributes", async ({ page }) => {
    await openPage(page);
    const dataTabs = await page
      .locator(content("test-aa-default"))
      .evaluateAll((els) => els.map((el) => el.getAttribute("data-tab")));
    expect(dataTabs).toEqual(["1", "2", "3"]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("clicking a tab header triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(header("test-aa-default")).first().click();
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking first tab header on accordion type opens it", async ({ page }) => {
    await openPage(page);
    await page.locator(header("test-aa-default")).first().click();
    await expect(
      page.locator(content("test-aa-default")).first()
    ).toBeVisible({ timeout: 2000 });
  });

  test("hover on all accordion instances triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-aa-default", "test-aa-toggle", "test-aa-icon-off",
      "test-aa-icon-left", "test-aa-tab-icon-off", "test-aa-active-default", "test-aa-h3-title",
    ]) {
      await page.locator(accordion(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("tab headers are keyboard-focusable (tabindex=0)", async ({ page }) => {
    await openPage(page);
    const tabindexVal = await page
      .locator(header("test-aa-default"))
      .first()
      .getAttribute("tabindex");
    expect(tabindexVal).toBe("0");
  });
});
