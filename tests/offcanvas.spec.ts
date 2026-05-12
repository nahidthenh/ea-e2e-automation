/**
 * Covered: Essential Addons — Offcanvas widget
 *
 * 1. Page health        — HTTP 200, no PHP errors, no JS errors
 * 2. Toggle button      — text label; icon; size class variants
 * 3. Content wrap       — data-settings JSON attached to content wrap
 * 4. Offcanvas panel    — title h3; close button; body with custom widgets;
 *                         panel moved to <body> by JS
 * 5. Position/direction — left / right / top / bottom position variants
 * 6. Interaction        — click toggle opens panel; close button dismisses;
 *                          ESC key closes (no JS errors)
 */
import { test, expect, Page, Locator } from "@playwright/test";

const PAGE_URL = `/${process.env.OFFCANVAS_PAGE_SLUG ?? "offcanvas"}/`;

// -- selectors -----------------------------------------------------------
// DOM shape (from Offcanvas::render(), after JS initialisation):
//
// JS moves .eael-offcanvas-content out of {{WRAPPER}} and prepends it to <body>:
//   body > .eael-offcanvas-content.eael-offcanvas-content-{ID}
//     .eael-offcanvas-header
//       .eael-offcanvas-title > h3                ← optional title
//       .eael-offcanvas-close                     ← close btn (if enabled)
//     .eael-offcanvas-body
//       .eael-offcanvas-custom-widget             ← repeater items
//         h3.eael-offcanvas-widget-title
//         .eael-offcanvas-widget-content
//
// The toggle button stays inside {{WRAPPER}}:
//   .{hook}                                       ← elementor-widget wrapper
//     .eael-offcanvas-content-wrap[data-settings] ← settings JSON lives here
//       .eael-offcanvas-toggle-wrap
//         .eael-offcanvas-toggle.elementor-size-{size}
//           .eael-offcanvas-toggle-icon           ← optional icon
//           .eael-toggle-text

const toggleBtn  = (hook: string) => `.${hook} .eael-offcanvas-toggle`;
const toggleWrap = (hook: string) => `.${hook} .eael-offcanvas-toggle-wrap`;
const toggleText = (hook: string) => `.${hook} .eael-toggle-text`;
const contentWrap = (hook: string) => `.${hook} .eael-offcanvas-content-wrap`;

// Resolves the offcanvas panel locator using content_id from data-settings.
// After JS init, the panel is at body > .eael-offcanvas-content-{content_id}.
async function getPanelLocator(page: Page, hook: string): Promise<Locator> {
  const settingsAttr = await page.locator(contentWrap(hook)).getAttribute("data-settings");
  const settings = JSON.parse(settingsAttr!);
  return page.locator(`.eael-offcanvas-content-${settings.content_id}`);
}

// -- known transition classes ---------------------------------------------
const TRANSITIONS = ["slide", "reveal", "push", "slide-along"] as const;

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
// 2. Direction variants
// ========================================================================

test.describe("Direction variants", () => {
  const directionMap: Record<string, string> = {
    "test-o-default":   "eael-offcanvas-content-left",
    "test-o-dir-right": "eael-offcanvas-content-right",
  };

  for (const [hook, dirClass] of Object.entries(directionMap)) {
    test(`${dirClass}: toggle button is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(toggleBtn(hook)).first()).toBeVisible();
    });

    test(`${dirClass}: panel carries direction class`, async ({ page }) => {
      await openPage(page);
      const panel = await getPanelLocator(page, hook);
      await expect(panel).toHaveClass(new RegExp(dirClass));
    });

    test(`${dirClass}: data-settings encodes correct direction`, async ({ page }) => {
      await openPage(page);
      const settingsAttr = await page.locator(contentWrap(hook)).getAttribute("data-settings");
      const settings = JSON.parse(settingsAttr!);
      const expected = dirClass === "eael-offcanvas-content-left" ? "left" : "right";
      expect(settings.direction).toBe(expected);
    });
  }
});

// ========================================================================
// 3. Content transitions
// ========================================================================

test.describe("Content transitions", () => {
  const transitionMap: Record<string, string> = {
    "test-o-default":           "slide",
    "test-o-trans-reveal":      "reveal",
    "test-o-trans-push":        "push",
    "test-o-trans-slide-along": "slide-along",
  };

  for (const [hook, transition] of Object.entries(transitionMap)) {
    test(`transition "${transition}": panel carries eael-offcanvas-${transition} class`, async ({ page }) => {
      await openPage(page);
      const panel = await getPanelLocator(page, hook);
      await expect(panel).toHaveClass(new RegExp(`eael-offcanvas-${transition}`));
    });

    test(`transition "${transition}": data-settings encodes transition value`, async ({ page }) => {
      await openPage(page);
      const settingsAttr = await page.locator(contentWrap(hook)).getAttribute("data-settings");
      const settings = JSON.parse(settingsAttr!);
      expect(settings.transition).toBe(transition);
    });
  }
});

// ========================================================================
// 4. Panel features
// ========================================================================

test.describe("Offcanvas title", () => {
  test("panel without title: .eael-offcanvas-title h3 is absent", async ({ page }) => {
    await openPage(page);
    const panel = await getPanelLocator(page, "test-o-default");
    await expect(panel.locator(".eael-offcanvas-title h3")).toHaveCount(0);
  });

  test("panel with title: h3 renders 'My Offcanvas'", async ({ page }) => {
    await openPage(page);
    const panel = await getPanelLocator(page, "test-o-with-title");
    await expect(panel.locator(".eael-offcanvas-title h3")).toBeAttached();
    const text = await panel.locator(".eael-offcanvas-title h3").textContent();
    expect(text?.trim()).toBe("My Offcanvas");
  });
});

test.describe("Close button", () => {
  test("close button is present when enabled", async ({ page }) => {
    await openPage(page);
    const panel = await getPanelLocator(page, "test-o-default");
    await expect(panel.locator(".eael-offcanvas-close")).toBeAttached();
  });

  test("close button is absent when disabled", async ({ page }) => {
    await openPage(page);
    const panel = await getPanelLocator(page, "test-o-no-close");
    await expect(panel.locator(".eael-offcanvas-close")).toHaveCount(0);
  });
});

test.describe("Custom content", () => {
  test("custom widget boxes are rendered in panel body", async ({ page }) => {
    await openPage(page);
    const panel = await getPanelLocator(page, "test-o-default");
    const widgets = panel.locator(".eael-offcanvas-custom-widget");
    await expect(widgets).toHaveCount(2);
  });

  test("first custom widget title matches seeded text", async ({ page }) => {
    await openPage(page);
    const panel = await getPanelLocator(page, "test-o-default");
    const title = await panel.locator(".eael-offcanvas-widget-title").first().textContent();
    expect(title?.trim()).toBe("Default Box One");
  });

  test("second custom widget title matches seeded text", async ({ page }) => {
    await openPage(page);
    const panel = await getPanelLocator(page, "test-o-default");
    const title = await panel.locator(".eael-offcanvas-widget-title").nth(1).textContent();
    expect(title?.trim()).toBe("Default Box Two");
  });
});

test.describe("Open by default", () => {
  test("panel marked open-by-default has eael-offcanvas-content-visible on load", async ({ page }) => {
    await openPage(page);
    const panel = await getPanelLocator(page, "test-o-open-default");
    await expect(panel).toHaveClass(/eael-offcanvas-content-visible/);
  });

  test("html element has eael-offcanvas-content-open when a panel is open", async ({ page }) => {
    await openPage(page);
    await expect(page.locator("html")).toHaveClass(/eael-offcanvas-content-open/);
  });

  test("data-settings for open-by-default encodes open_offcanvas=yes", async ({ page }) => {
    await openPage(page);
    const settingsAttr = await page
      .locator(contentWrap("test-o-open-default"))
      .getAttribute("data-settings");
    const settings = JSON.parse(settingsAttr!);
    expect(settings.open_offcanvas).toBe("yes");
  });
});

// ========================================================================
// 5. Toggle button variants
// ========================================================================

test.describe("Toggle button icon", () => {
  test("icon element is rendered inside button when icon set", async ({ page }) => {
    await openPage(page);
    const icon = page.locator(".test-o-btn-icon .eael-offcanvas-toggle-icon");
    await expect(icon.first()).toBeAttached();
  });

  test("button text is rendered alongside icon", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(toggleText("test-o-btn-icon")).first().textContent();
    expect(text?.trim()).toBe("Menu");
  });

  test("no icon element when icon not configured", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(".test-o-default .eael-offcanvas-toggle-icon")).toHaveCount(0);
  });
});

test.describe("Toggle button alignment", () => {
  test("center alignment: .eael-offcanvas-toggle-wrap has text-align center", async ({ page }) => {
    await openPage(page);
    const ta = await page
      .locator(toggleWrap("test-o-btn-align-center"))
      .first()
      .evaluate((el) => getComputedStyle(el).textAlign);
    expect(ta).toBe("center");
  });

  test("right alignment: .eael-offcanvas-toggle-wrap has text-align right", async ({ page }) => {
    await openPage(page);
    const ta = await page
      .locator(toggleWrap("test-o-btn-align-right"))
      .first()
      .evaluate((el) => getComputedStyle(el).textAlign);
    expect(ta).toBe("right");
  });
});

test.describe("Toggle button size", () => {
  test("default size: button has elementor-size-md class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(toggleBtn("test-o-default")).first()).toHaveClass(
      /elementor-size-md/
    );
  });

  test("large size: button has elementor-size-lg class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(toggleBtn("test-o-btn-size-lg")).first()).toHaveClass(
      /elementor-size-lg/
    );
  });
});

// ========================================================================
// 6. Element structure
// ========================================================================

test.describe("Element structure", () => {
  test("content-wrap carries data-settings attribute", async ({ page }) => {
    await openPage(page);
    const attr = await page.locator(contentWrap("test-o-default")).getAttribute("data-settings");
    expect(attr).not.toBeNull();
    const settings = JSON.parse(attr!);
    expect(settings).toHaveProperty("content_id");
    expect(settings).toHaveProperty("direction");
    expect(settings).toHaveProperty("transition");
  });

  test("panel has eael-offcanvas-body child", async ({ page }) => {
    await openPage(page);
    const panel = await getPanelLocator(page, "test-o-default");
    await expect(panel.locator(".eael-offcanvas-body")).toBeAttached();
  });

  test("panel has eael-offcanvas-header child", async ({ page }) => {
    await openPage(page);
    const panel = await getPanelLocator(page, "test-o-default");
    await expect(panel.locator(".eael-offcanvas-header")).toBeAttached();
  });

  test("panel class list includes base eael-offcanvas-content class", async ({ page }) => {
    await openPage(page);
    const panel = await getPanelLocator(page, "test-o-default");
    await expect(panel).toHaveClass(/eael-offcanvas-content/);
  });

  test("all transition class names are valid known values", async ({ page }) => {
    await openPage(page);
    for (const [hook, transition] of Object.entries({
      "test-o-default":           "slide",
      "test-o-trans-reveal":      "reveal",
      "test-o-trans-push":        "push",
      "test-o-trans-slide-along": "slide-along",
    })) {
      const panel = await getPanelLocator(page, hook);
      const cls = await panel.getAttribute("class") ?? "";
      expect(
        TRANSITIONS.some((t) => cls.includes(`eael-offcanvas-${t}`)),
        `No known transition class found for ${hook}: "${cls}"`
      ).toBe(true);
    }
  });
});

// ========================================================================
// 7. Interaction
// ========================================================================

test.describe("Interaction", () => {
  test("toggle button is keyboard-focusable", async ({ page }) => {
    await openPage(page);
    const btn = page.locator(toggleBtn("test-o-default")).first();
    await btn.focus();
    await expect(btn).toBeFocused();
  });

  test("clicking toggle button causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    // Close the auto-opened panel (test-o-open-default) via Escape first
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
    await page.locator(toggleBtn("test-o-default")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking toggle opens the panel (adds eael-offcanvas-content-visible)", async ({ page }) => {
    await openPage(page);
    // Close auto-opened panel first
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
    await page.locator(toggleBtn("test-o-default")).first().click();
    await page.waitForTimeout(300);
    const panel = await getPanelLocator(page, "test-o-default");
    await expect(panel).toHaveClass(/eael-offcanvas-content-visible/);
  });

  test("clicking close button on open panel causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    // test-o-open-default panel is already visible on load
    const panel = await getPanelLocator(page, "test-o-open-default");
    await expect(panel).toHaveClass(/eael-offcanvas-content-visible/);
    await panel.locator(".eael-offcanvas-close").click();
    await page.waitForTimeout(600);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover on each toggle button causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-o-default",
      "test-o-dir-right",
      "test-o-trans-reveal",
      "test-o-trans-push",
      "test-o-trans-slide-along",
      "test-o-with-title",
      "test-o-no-close",
      "test-o-btn-icon",
      "test-o-btn-align-center",
      "test-o-btn-align-right",
      "test-o-btn-size-lg",
    ]) {
      await page.locator(toggleBtn(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
