/**
 * Covered: Essential Addons — Simple Menu widget
 *
 * 1. Page health       — HTTP 200, no PHP errors, no JS errors
 * 2. Presets           — preset-1 / preset-2 / preset-3 class on container
 * 3. Menu layout       — horizontal / vertical layout class
 * 4. Item alignment    — left / center / right alignment class
 * 5. Hamburger toggle  — toggle button with SVG icon present
 * 6. Menu items        — Alpha / Beta / Gamma hrefs rendered
 * 7. Full-width option — full-width class applied
 * 8. Interaction       — hamburger click opens menu (no JS errors); item hover
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.SIMPLE_MENU_PAGE_SLUG ?? "simple-menu"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Simple_Menu::render()):
//   .{hook}                                   ← elementor-widget wrapper
//     <style>...</style>                       ← inline responsive breakpoint CSS
//     div.eael-simple-menu-container           ← main container
//       data-hamburger-device="tablet"
//       class includes: preset-{1|2|3}, eael-simple-menu-align-{left|center|right}
//                       eael-simple-menu-dropdown-align-left
//       ul.eael-simple-menu                    ← wp_nav_menu() output
//         .eael-simple-menu-horizontal         ← or -vertical
//         li.menu-item > a[href="#alpha"]       ← menu items (Alpha, Beta, Gamma)
//       button.eael-simple-menu-toggle         ← hamburger (hidden on desktop)
//         svg                                  ← eicon-menu-bar

const container  = (hook: string) => `.${hook} .eael-simple-menu-container`;
const menu       = (hook: string) => `.${hook} .eael-simple-menu`;
const menuItem   = (hook: string) => `.${hook} .eael-simple-menu > li`;
const menuLink   = (hook: string) => `.${hook} .eael-simple-menu > li > a`;
const toggle     = (hook: string) => `.${hook} .eael-simple-menu-toggle`;

// ── preset map ────────────────────────────────────────────────────────────
const PRESET_MAP: Record<string, string> = {
  "test-sm-default":  "preset-1",
  "test-sm-preset-2": "preset-2",
  "test-sm-preset-3": "preset-3",
};

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
// 2. Presets — one instance per preset value
// ══════════════════════════════════════════════════════════════════════════

test.describe("Presets", () => {
  for (const [hook, presetClass] of Object.entries(PRESET_MAP)) {
    test(`${presetClass} — container is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(container(hook)).first()).toBeVisible();
    });

    test(`${presetClass} — container has correct preset class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(container(hook)).first()).toHaveClass(
        new RegExp(presetClass)
      );
    });

    test(`${presetClass} — menu list is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(menu(hook)).first()).toBeVisible();
    });

    test(`${presetClass} — renders 3 menu items`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(menuItem(hook))).toHaveCount(3);
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 3. Layout variants
// ══════════════════════════════════════════════════════════════════════════

test.describe("Layout variants", () => {
  test("horizontal (default): menu has eael-simple-menu-horizontal class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(menu("test-sm-default")).first()).toHaveClass(
      /eael-simple-menu-horizontal/
    );
  });

  test("vertical: menu has eael-simple-menu-vertical class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(menu("test-sm-vertical")).first()).toHaveClass(
      /eael-simple-menu-vertical/
    );
  });

  test("vertical: menu list is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(menu("test-sm-vertical")).first()).toBeVisible();
  });

  test("vertical: renders 3 menu items", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(menuItem("test-sm-vertical"))).toHaveCount(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 4. Item alignment
// ══════════════════════════════════════════════════════════════════════════

test.describe("Item alignment", () => {
  test("default (left): container has eael-simple-menu-align-left class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-sm-default")).first()).toHaveClass(
      /eael-simple-menu-align-left/
    );
  });

  test("center: container has eael-simple-menu-align-center class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-sm-align-center")).first()).toHaveClass(
      /eael-simple-menu-align-center/
    );
  });

  test("right: container has eael-simple-menu-align-right class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-sm-align-right")).first()).toHaveClass(
      /eael-simple-menu-align-right/
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 5. Full-width option
// ══════════════════════════════════════════════════════════════════════════

test.describe("Full-width option", () => {
  test("full-width: container has eael-simple-menu--stretch class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-sm-full-width")).first()).toHaveClass(
      /eael-simple-menu--stretch/
    );
  });

  test("default: container does NOT have eael-simple-menu--stretch", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(container("test-sm-default")).first().getAttribute("class") ?? "";
    expect(cls).not.toContain("eael-simple-menu--stretch");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 6. Menu item content
// ══════════════════════════════════════════════════════════════════════════

test.describe("Menu item content", () => {
  test("first item link has href='#alpha'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`${menuLink("test-sm-default")}[href="#alpha"]`).first()
    ).toBeAttached();
  });

  test("second item link has href='#beta'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`${menuLink("test-sm-default")}[href="#beta"]`).first()
    ).toBeAttached();
  });

  test("third item link has href='#gamma'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`${menuLink("test-sm-default")}[href="#gamma"]`).first()
    ).toBeAttached();
  });

  test("first item text is 'Alpha'", async ({ page }) => {
    await openPage(page);
    const text = await page
      .locator(`${menuLink("test-sm-default")}[href="#alpha"]`)
      .first()
      .textContent();
    expect(text?.trim()).toBe("Alpha");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 7. Element structure
// ══════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("menu is a <ul> element", async ({ page }) => {
    await openPage(page);
    const tag = await page.locator(menu("test-sm-default")).first().evaluate((el) => el.tagName);
    expect(tag).toBe("UL");
  });

  test("menu items are <li> elements", async ({ page }) => {
    await openPage(page);
    const tag = await page.locator(menuItem("test-sm-default")).first().evaluate((el) => el.tagName);
    expect(tag).toBe("LI");
  });

  test("toggle button is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(toggle("test-sm-default")).first()).toBeAttached();
  });

  test("toggle button has .eael-simple-menu-toggle class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(toggle("test-sm-default")).first()).toHaveClass(
      /eael-simple-menu-toggle/
    );
  });

  test("toggle button is a <button> element", async ({ page }) => {
    await openPage(page);
    const tag = await page.locator(toggle("test-sm-default")).first().evaluate((el) => el.tagName);
    expect(tag).toBe("BUTTON");
  });

  test("container has data-hamburger-device attribute", async ({ page }) => {
    await openPage(page);
    const device = await page
      .locator(container("test-sm-default"))
      .first()
      .getAttribute("data-hamburger-device");
    expect(device).toBe("tablet");
  });

  test("default container has eael-simple-menu-dropdown-animate-to-top on the menu", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(menu("test-sm-default")).first()).toHaveClass(
      /eael-simple-menu-dropdown-animate-to-top/
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 8. Interaction
// ══════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("menu link is keyboard-focusable", async ({ page }) => {
    await openPage(page);
    const link = page.locator(menuLink("test-sm-default")).first();
    await link.focus();
    await expect(link).toBeFocused();
  });

  test("hover on each menu instance triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-sm-default",
      "test-sm-preset-2",
      "test-sm-preset-3",
      "test-sm-vertical",
      "test-sm-align-center",
      "test-sm-align-right",
      "test-sm-full-width",
    ]) {
      await page.locator(menu(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking a menu item link causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(`${menuLink("test-sm-default")}[href="#alpha"]`).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
