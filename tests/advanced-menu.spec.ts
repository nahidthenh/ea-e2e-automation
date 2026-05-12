/**
 * Covered: Essential Addons — Advanced Menu widget
 *
 * 1. Page health       — HTTP 200, no PHP errors, no JS errors
 * 2. Skin variants     — 8 skins (default through skin-seven); skin class on wrapper
 * 3. Layout variants   — horizontal / vertical layout class
 * 4. Item alignment    — left / center / right alignment class
 * 5. Hamburger options — left / center / right position; toggle button;
 *                        data-hamburger-device attribute
 * 6. Full-width option — eael-advanced-menu--stretch class applied
 * 7. Menu item content — hrefs and link text rendered correctly
 * 8. Element structure — ul/li/button tag structure
 * 9. Interaction       — hover and click (no JS errors)
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.ADVANCED_MENU_PAGE_SLUG ?? "advanced-menu"}/`;

// -- selectors -----------------------------------------------------------
// DOM shape (from Skin_Default::render() — identical across all skins):
//   .{hook}                                  ← elementor-widget wrapper
//     <style>...</style>                     ← inline responsive breakpoint CSS
//     div.eael-advanced-menu-container       ← main container
//       class: eael-advanced-menu-container {item-align-class} {dropdown-align-class}
//       data-hamburger-device="tablet"
//       data-hamburger-breakpoints="..."
//       ul.eael-advanced-menu               ← wp_nav_menu() output
//         class includes: eael-advanced-menu-horizontal (or -vertical)
//                         {dropdown-animation-class}
//                         eael-advanced-menu-indicator
//         li.menu-item > a                  ← top-level items (Alpha, Beta, Gamma)
//       button.eael-advanced-menu-toggle    ← hamburger button

const container = (hook: string) => `.${hook} .eael-advanced-menu-container`;
const menu      = (hook: string) => `.${hook} .eael-advanced-menu`;
const menuItem  = (hook: string) => `.${hook} .eael-advanced-menu > li`;
const menuLink  = (hook: string) => `.${hook} .eael-advanced-menu > li > a`;
const toggle    = (hook: string) => `.${hook} .eael-advanced-menu-toggle`;

// -- skin map ------------------------------------------------------------
// All 8 skins registered by Advanced_Menu::register_skins()
const SKIN_MAP: Record<string, string> = {
  "test-am-default":   "default",
  "test-am-skin-one":  "skin-one",
  "test-am-skin-two":  "skin-two",
  "test-am-skin-three": "skin-three",
  "test-am-skin-four": "skin-four",
  "test-am-skin-five": "skin-five",
  "test-am-skin-six":  "skin-six",
  "test-am-skin-seven": "skin-seven",
};

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
// 2. Skin variants — one instance per skin
// ========================================================================

test.describe("Skin variants", () => {
  for (const [hook, skinId] of Object.entries(SKIN_MAP)) {
    test(`${skinId} — container is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(container(hook)).first()).toBeVisible();
    });

    test(`${skinId} — menu list is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(menu(hook)).first()).toBeVisible();
    });

    test(`${skinId} — renders 3 menu items`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(menuItem(hook))).toHaveCount(3);
    });
  }
});

// ========================================================================
// 3. Layout variants
// ========================================================================

test.describe("Layout variants", () => {
  test("horizontal (default): menu has eael-advanced-menu-horizontal class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(menu("test-am-default")).first()).toHaveClass(
      /eael-advanced-menu-horizontal/
    );
  });

  test("vertical: menu has eael-advanced-menu-vertical class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(menu("test-am-vertical")).first()).toHaveClass(
      /eael-advanced-menu-vertical/
    );
  });

  test("vertical: menu list is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(menu("test-am-vertical")).first()).toBeVisible();
  });

  test("vertical: renders 3 menu items", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(menuItem("test-am-vertical"))).toHaveCount(3);
  });
});

// ========================================================================
// 4. Item alignment
// ========================================================================

test.describe("Item alignment", () => {
  test("default (left): container has eael-advanced-menu-align-left class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-am-default")).first()).toHaveClass(
      /eael-advanced-menu-align-left/
    );
  });

  test("center: container has eael-advanced-menu-align-center class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-am-align-center")).first()).toHaveClass(
      /eael-advanced-menu-align-center/
    );
  });

  test("right: container has eael-advanced-menu-align-right class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-am-align-right")).first()).toHaveClass(
      /eael-advanced-menu-align-right/
    );
  });
});

// ========================================================================
// 5. Hamburger options
// ========================================================================

test.describe("Hamburger options", () => {
  test("default (right): widget wrapper has eael-advanced-menu-hamburger-align-right class", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(".test-am-default").first().getAttribute("class") ?? "";
    expect(cls).toContain("eael-advanced-menu-hamburger-align-right");
  });

  test("left: widget wrapper has eael-advanced-menu-hamburger-align-left class", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(".test-am-hamburger-left").first().getAttribute("class") ?? "";
    expect(cls).toContain("eael-advanced-menu-hamburger-align-left");
  });

  test("center: widget wrapper has eael-advanced-menu-hamburger-align-center class", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(".test-am-hamburger-center").first().getAttribute("class") ?? "";
    expect(cls).toContain("eael-advanced-menu-hamburger-align-center");
  });

  test("toggle button is present in each hamburger variant", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(toggle("test-am-hamburger-left")).first()).toBeAttached();
    await expect(page.locator(toggle("test-am-hamburger-center")).first()).toBeAttached();
  });
});

// ========================================================================
// 6. Full-width option
// ========================================================================

test.describe("Full-width option", () => {
  test("full-width: widget wrapper has eael-advanced-menu--stretch class", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(".test-am-full-width").first().getAttribute("class") ?? "";
    expect(cls).toContain("eael-advanced-menu--stretch");
  });

  test("default: widget wrapper does NOT have eael-advanced-menu--stretch", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(".test-am-default").first().getAttribute("class") ?? "";
    expect(cls).not.toContain("eael-advanced-menu--stretch");
  });
});

// ========================================================================
// 7. Menu item content
// ========================================================================

test.describe("Menu item content", () => {
  test("first item link has href='#alpha'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`${menuLink("test-am-default")}[href="#alpha"]`).first()
    ).toBeAttached();
  });

  test("second item link has href='#beta'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`${menuLink("test-am-default")}[href="#beta"]`).first()
    ).toBeAttached();
  });

  test("third item link has href='#gamma'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`${menuLink("test-am-default")}[href="#gamma"]`).first()
    ).toBeAttached();
  });

  test("first item text is 'Alpha'", async ({ page }) => {
    await openPage(page);
    const text = await page
      .locator(`${menuLink("test-am-default")}[href="#alpha"]`)
      .first()
      .textContent();
    expect(text?.trim()).toBe("Alpha");
  });
});

// ========================================================================
// 8. Element structure
// ========================================================================

test.describe("Element structure", () => {
  test("menu is a <ul> element", async ({ page }) => {
    await openPage(page);
    const tag = await page.locator(menu("test-am-default")).first().evaluate((el) => el.tagName);
    expect(tag).toBe("UL");
  });

  test("menu items are <li> elements", async ({ page }) => {
    await openPage(page);
    const tag = await page.locator(menuItem("test-am-default")).first().evaluate((el) => el.tagName);
    expect(tag).toBe("LI");
  });

  test("toggle button is present in default widget", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(toggle("test-am-default")).first()).toBeAttached();
  });

  test("toggle button has .eael-advanced-menu-toggle class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(toggle("test-am-default")).first()).toHaveClass(
      /eael-advanced-menu-toggle/
    );
  });

  test("toggle button is a <button> element", async ({ page }) => {
    await openPage(page);
    const tag = await page.locator(toggle("test-am-default")).first().evaluate((el) => el.tagName);
    expect(tag).toBe("BUTTON");
  });

  test("container has data-hamburger-device attribute", async ({ page }) => {
    await openPage(page);
    const device = await page
      .locator(container("test-am-default"))
      .first()
      .getAttribute("data-hamburger-device");
    expect(device).toBe("tablet");
  });

  test("default menu has dropdown animation class on ul", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(menu("test-am-default")).first()).toHaveClass(
      /eael-advanced-menu-dropdown-animate-to-top/
    );
  });

  test("default widget wrapper has eael-hamburger--tablet class", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(".test-am-default").first().getAttribute("class") ?? "";
    expect(cls).toContain("eael-hamburger--tablet");
  });
});

// ========================================================================
// 9. Interaction
// ========================================================================

test.describe("Interaction", () => {
  test("menu link is keyboard-focusable", async ({ page }) => {
    await openPage(page);
    const link = page.locator(menuLink("test-am-default")).first();
    await link.focus();
    await expect(link).toBeFocused();
  });

  test("hover on each skin instance triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of Object.keys(SKIN_MAP)) {
      await page.locator(menu(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking a menu item link causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(`${menuLink("test-am-default")}[href="#alpha"]`).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
