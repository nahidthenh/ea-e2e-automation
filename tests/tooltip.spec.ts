import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.TOOLTIP_PAGE_SLUG ?? "tooltip"}/`;

// ── selectors ──────────────────────────────────────────────────────────────────
// DOM shape (from Tooltip::render()):
//   .{hook}                                     ← elementor-widget wrapper
//     .eael-tooltip                             ← widget div
//       .eael-tooltip-content                   ← trigger (span/tag, tabindex=0,
//                                                  aria-describedby=tooltip-text-{id})
//         [a href if eael_tooltip_enable_link=yes]
//           [i/svg icon | text | img | shortcode output]
//       span#tooltip-text-{id}
//            .eael-tooltip-text
//            .eael-tooltip-{dir}                ← direction class: right|left|top|bottom
//                                                  role="tooltip"

const tooltip    = (hook: string) => `.${hook} .eael-tooltip`;
const content    = (hook: string) => `.${hook} .eael-tooltip-content`;
const tooltipTxt = (hook: string) => `.${hook} .eael-tooltip-text`;

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
// 2. Tooltip content types
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Tooltip content types", () => {
  const typeMap: Record<string, string> = {
    "test-t-default":        "icon",
    "test-t-type-text":      "text",
    "test-t-type-image":     "image",
    "test-t-type-shortcode": "shortcode",
  };

  for (const [hook, type] of Object.entries(typeMap)) {
    test(`${type} type: .eael-tooltip is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(tooltip(hook)).first()).toBeVisible();
    });

    test(`${type} type: .eael-tooltip-content is present`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(content(hook)).first()).toBeAttached();
    });

    test(`${type} type: .eael-tooltip-text popup is present`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(tooltipTxt(hook)).first()).toBeAttached();
    });
  }

  test("text type: trigger contains configured text", async ({ page }) => {
    await openPage(page);
    const txt = await page.locator(content("test-t-type-text")).first().textContent();
    expect(txt?.trim()).toBe("Hover Me!");
  });

  test("text type: tooltip popup contains configured content", async ({ page }) => {
    await openPage(page);
    const txt = await page.locator(tooltipTxt("test-t-type-text")).first().textContent();
    expect(txt?.trim()).toContain("Text tooltip content");
  });

  test("image type: img element is rendered inside trigger", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-t-type-image .eael-tooltip-content img").first()
    ).toBeAttached();
  });

  test("shortcode type: trigger uses a div element", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(content("test-t-type-shortcode"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("DIV");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Tooltip direction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Tooltip direction", () => {
  const dirMap: Record<string, string> = {
    "test-t-default":    "eael-tooltip-right",
    "test-t-dir-left":   "eael-tooltip-left",
    "test-t-dir-top":    "eael-tooltip-top",
    "test-t-dir-bottom": "eael-tooltip-bottom",
  };

  for (const [hook, dirClass] of Object.entries(dirMap)) {
    test(`${dirClass}: tooltip text has correct direction class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(tooltipTxt(hook)).first()).toHaveClass(
        new RegExp(dirClass)
      );
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Link behaviour
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Link behaviour", () => {
  test("external link: anchor has target='_blank'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-t-link-external .eael-tooltip-content a").first()
    ).toHaveAttribute("target", "_blank");
  });

  test("external link: anchor href is '#'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-t-link-external .eael-tooltip-content a").first()
    ).toHaveAttribute("href", "#");
  });

  test("nofollow link: anchor rel contains 'nofollow'", async ({ page }) => {
    await openPage(page);
    const rel = await page
      .locator(".test-t-link-nofollow .eael-tooltip-content a")
      .first()
      .getAttribute("rel");
    expect(rel).toContain("nofollow");
  });

  test("default widget has no anchor (link disabled by default)", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-t-default .eael-tooltip-content a")
    ).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Alignment
//    prefix_class 'eael-tooltip-align%s-' adds e.g. eael-tooltip-align-center
//    to the elementor widget wrapper (same element as _css_classes hook).
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Alignment", () => {
  test("center-aligned widget has eael-tooltip-align-center class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(".test-t-align-center").first()).toHaveClass(
      /eael-tooltip-align-center/
    );
  });

  test("right-aligned widget has eael-tooltip-align-right class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(".test-t-align-right").first()).toHaveClass(
      /eael-tooltip-align-right/
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Element structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("widget renders as div.eael-tooltip", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(tooltip("test-t-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("DIV");
  });

  test("default (icon) type: trigger is rendered as span.eael-tooltip-content", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(content("test-t-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("SPAN");
  });

  test("text type: trigger tag defaults to span", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(content("test-t-type-text"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("SPAN");
  });

  test("trigger has tabindex='0' for keyboard access", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(content("test-t-default")).first()).toHaveAttribute(
      "tabindex",
      "0"
    );
  });

  test("trigger has aria-describedby pointing to tooltip id", async ({ page }) => {
    await openPage(page);
    const describedBy = await page
      .locator(content("test-t-default"))
      .first()
      .getAttribute("aria-describedby");
    expect(describedBy).toMatch(/^tooltip-text-/);
  });

  test("tooltip popup has role='tooltip'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(tooltipTxt("test-t-default")).first()).toHaveAttribute(
      "role",
      "tooltip"
    );
  });

  test("tooltip popup id matches trigger aria-describedby", async ({ page }) => {
    await openPage(page);
    const describedBy = await page
      .locator(content("test-t-default"))
      .first()
      .getAttribute("aria-describedby");
    const tooltipId = await page
      .locator(tooltipTxt("test-t-default"))
      .first()
      .getAttribute("id");
    expect(tooltipId).toBe(describedBy);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("trigger is keyboard-focusable (tabindex=0)", async ({ page }) => {
    await openPage(page);
    const trigger = page.locator(content("test-t-default")).first();
    await trigger.focus();
    await expect(trigger).toBeFocused();
  });

  test("hover on each tooltip triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of Object.keys({
      "test-t-default":        1,
      "test-t-type-text":      1,
      "test-t-type-image":     1,
      "test-t-dir-left":       1,
      "test-t-dir-top":        1,
      "test-t-dir-bottom":     1,
    })) {
      await page.locator(tooltip(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking trigger causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(content("test-t-default")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Visual regression
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Visual regression", () => {
  const HOOKS = [
    "test-t-default",
    "test-t-type-text",
    "test-t-type-image",
    "test-t-type-shortcode",
    "test-t-dir-left",
    "test-t-dir-top",
    "test-t-dir-bottom",
    "test-t-link-external",
    "test-t-link-nofollow",
    "test-t-align-center",
    "test-t-align-right",
  ];

  for (const hook of HOOKS) {
    test(`${hook} matches visual snapshot`, async ({ page }) => {
      await openPage(page);
      await page.waitForLoadState("networkidle");
      await page.locator(`.${hook}`).first().scrollIntoViewIfNeeded();
      await expect(page.locator(`.${hook}`).first()).toHaveScreenshot(
        `${hook}.png`,
        { animations: "disabled" }
      );
    });
  }
});
