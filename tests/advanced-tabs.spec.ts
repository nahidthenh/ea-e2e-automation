import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.ADVANCED_TABS_PAGE_SLUG ?? "advanced-tabs"}/`;

// ── selectors ──────────────────────────────────────────────────────────────────
// DOM shape (from Adv_Tabs::render()):
//   .{hook}                                       ← elementor-widget wrapper
//     #eael-advance-tabs-{id}
//     .eael-advance-tabs
//     .eael-tabs-horizontal | .eael-tabs-vertical ← layout class
//     .eael-tab-auto-active                       ← when auto-active enabled
//     .eael-tab-toggle                            ← when toggle enabled
//       .eael-tabs-nav
//         ul.eael-tab-inline-icon | .eael-tab-top-icon   role="tablist"
//           li.active-default .eael-tab-item-trigger .eael-tab-nav-item
//             role="tab"  tabindex="0|-1"
//             aria-controls="{tab_id}-tab"
//             [span.eael-tab-title.title-before-icon  (icon-alignment=after)]
//             [i/svg icon if icon_show=yes and icon_type=icon]
//             [span.eael-tab-title.title-after-icon   (icon-alignment=before/top)]
//           li.eael-tab-item-trigger.eael-tab-nav-item ...
//       .eael-tabs-content
//         div.eael-tab-content-item.active-default  ← first tab (active)
//         div.eael-tab-content-item                 ← other tabs

const tabsEl   = (hook: string) => `.${hook} .eael-advance-tabs`;
const navList  = (hook: string) => `.${hook} .eael-tabs-nav ul`;
const navItem  = (hook: string, n: number) => `.${hook} .eael-tabs-nav ul li:nth-child(${n})`;
const tabPanel = (hook: string, n: number) =>
  `.${hook} .eael-tabs-content .eael-tab-content-item:nth-child(${n})`;

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
// 2. Layout variants
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Layout variants", () => {
  const layoutMap: Record<string, string> = {
    "test-at-default":  "eael-tabs-horizontal",
    "test-at-vertical": "eael-tabs-vertical",
  };

  for (const [hook, layoutClass] of Object.entries(layoutMap)) {
    test(`${layoutClass}: widget is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(tabsEl(hook)).first()).toBeVisible();
    });

    test(`${layoutClass}: correct layout class applied`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(tabsEl(hook)).first()).toHaveClass(
        new RegExp(layoutClass)
      );
    });

    test(`${layoutClass}: renders 3 tab nav items`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(`${navList(hook)} li`)).toHaveCount(3);
    });

    test(`${layoutClass}: renders 3 content panels`, async ({ page }) => {
      await openPage(page);
      await expect(
        page.locator(`${tabPanel(hook, 1)}, ${tabPanel(hook, 2)}, ${tabPanel(hook, 3)}`)
      ).toHaveCount(3);
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Icon variants
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Icon variants", () => {
  test("inline icon (default): nav ul has eael-tab-inline-icon class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(navList("test-at-default")).first()).toHaveClass(
      /eael-tab-inline-icon/
    );
  });

  test("stacked icon: nav ul has eael-tab-top-icon class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(navList("test-at-icon-stacked")).first()).toHaveClass(
      /eael-tab-top-icon/
    );
  });

  test("icon-off: no icon element in first tab nav item", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.test-at-icon-off .eael-tabs-nav ul li:first-child i`)
    ).toHaveCount(0);
    await expect(
      page.locator(`.test-at-icon-off .eael-tabs-nav ul li:first-child svg`)
    ).toHaveCount(0);
  });

  test("icon-off: tab titles still render", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-at-icon-off .eael-tabs-nav ul li .eael-tab-title").first()
    ).toBeVisible();
  });

  test("icon-alignment before (default): title has title-after-icon class", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-at-default .eael-tabs-nav ul li:first-child .eael-tab-title").first()
    ).toHaveClass(/title-after-icon/);
  });

  test("icon-alignment after: title has title-before-icon class", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-at-icon-after .eael-tabs-nav ul li:first-child .eael-tab-title").first()
    ).toHaveClass(/title-before-icon/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Tab navigation
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Tab navigation", () => {
  test("first tab nav item has active-default class on load", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(navItem("test-at-default", 1)).first()).toHaveClass(
      /active-default/
    );
  });

  test("first content panel has active-default class on load", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(tabPanel("test-at-default", 1)).first()).toHaveClass(
      /active-default/
    );
  });

  test("first content panel contains 'Alpha tab content.'", async ({ page }) => {
    await openPage(page);
    const txt = await page.locator(tabPanel("test-at-default", 1)).first().textContent();
    expect(txt).toContain("Alpha tab content.");
  });

  test("second content panel contains 'Beta tab content.'", async ({ page }) => {
    await openPage(page);
    const txt = await page.locator(tabPanel("test-at-default", 2)).first().textContent();
    expect(txt).toContain("Beta tab content.");
  });

  test("clicking second tab shows second content panel", async ({ page }) => {
    await openPage(page);
    await page.locator(navItem("test-at-default", 2)).first().click();
    await expect(
      page.locator(tabPanel("test-at-default", 2)).first()
    ).toBeVisible();
  });

  test("clicking second tab activates second nav item", async ({ page }) => {
    await openPage(page);
    await page.locator(navItem("test-at-default", 2)).first().click();
    await expect(page.locator(navItem("test-at-default", 2)).first()).toHaveClass(
      /active/
    );
  });

  test("tab titles render: Alpha, Beta, Gamma", async ({ page }) => {
    await openPage(page);
    const titles = await page
      .locator(".test-at-default .eael-tabs-nav ul li .eael-tab-title")
      .allTextContents();
    expect(titles.map((t) => t.trim())).toEqual(
      expect.arrayContaining(["Alpha", "Beta", "Gamma"])
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Behaviour — toggle tab
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Behaviour — toggle tab", () => {
  test("toggle tab widget has eael-tab-toggle class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(tabsEl("test-at-toggle")).first()).toHaveClass(
      /eael-tab-toggle/
    );
  });

  test("toggle tab: clicking active tab collapses it (inactive class added)", async ({ page }) => {
    await openPage(page);
    const firstTab = page.locator(navItem("test-at-toggle", 1)).first();
    await firstTab.click();
    await expect(firstTab).toHaveClass(/inactive/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Element structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("widget wrapper has id starting with eael-advance-tabs-", async ({ page }) => {
    await openPage(page);
    const id = await page.locator(tabsEl("test-at-default")).first().getAttribute("id");
    expect(id).toMatch(/^eael-advance-tabs-/);
  });

  test("nav ul has role='tablist'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(navList("test-at-default")).first()).toHaveAttribute(
      "role",
      "tablist"
    );
  });

  test("tab nav items have role='tab'", async ({ page }) => {
    await openPage(page);
    const items = page.locator(".test-at-default .eael-tabs-nav ul li");
    for (const item of await items.all()) {
      await expect(item).toHaveAttribute("role", "tab");
    }
  });

  test("first tab nav item has tabindex='0'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(navItem("test-at-default", 1)).first()).toHaveAttribute(
      "tabindex",
      "0"
    );
  });

  test("non-first tab nav items have tabindex='-1'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(navItem("test-at-default", 2)).first()).toHaveAttribute(
      "tabindex",
      "-1"
    );
  });

  test("first tab nav item aria-controls matches first content panel id", async ({ page }) => {
    await openPage(page);
    const ariaControls = await page
      .locator(navItem("test-at-default", 1))
      .first()
      .getAttribute("aria-controls");
    const panelId = await page
      .locator(tabPanel("test-at-default", 1))
      .first()
      .getAttribute("id");
    expect(ariaControls).toBe(panelId);
  });

  test("auto-active widget has eael-tab-auto-active class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(tabsEl("test-at-default")).first()).toHaveClass(
      /eael-tab-auto-active/
    );
  });

  test("content panels have eael-tab-content-item class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(tabPanel("test-at-default", 1)).first()).toHaveClass(
      /eael-tab-content-item/
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("first tab nav item is keyboard-focusable (tabindex=0)", async ({ page }) => {
    await openPage(page);
    const firstTab = page.locator(navItem("test-at-default", 1)).first();
    await firstTab.focus();
    await expect(firstTab).toBeFocused();
  });

  test("hover on each tab widget triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of Object.keys({
      "test-at-default":      1,
      "test-at-vertical":     1,
      "test-at-icon-stacked": 1,
      "test-at-icon-off":     1,
    })) {
      await page.locator(tabsEl(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking through all 3 tabs causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (let i = 1; i <= 3; i++) {
      await page.locator(navItem("test-at-default", i)).first().click();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});

  }
});
