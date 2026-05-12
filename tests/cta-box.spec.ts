/**
 * Covered: Essential Addons — CTA Box widget
 *
 * 1. Page health       — HTTP 200, no PHP errors, no JS errors
 * 2. Layout styles     — basic / flex / icon-flex; .content/.action/.icon child divs
 * 3. Presets           — cta-preset-1 / cta-preset-2; cta-btn-preset-2
 * 4. Button features   — "Click Here" text; href "#"; secondary button "Learn More"
 * 5. Link behaviour    — external target="_blank"; nofollow; no-target default
 * 6. Alignment         — content-align-cta-center / default prefix classes
 * 7. Element structure — <a>/<h2> tags; eael-cta-heading class; bg-lite class
 * 8. Interaction       — hover (no JS errors); button clicks (no JS errors)
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.CTA_BOX_PAGE_SLUG ?? "cta-box"}/`;

// -- selectors ----------------------------------------------------------------
// DOM shape (from Cta_Box::render()):
//   .{hook}                                       ← elementor-widget wrapper
//     .eael-call-to-action
//     .cta-basic | .cta-flex | .cta-icon-flex     ← layout class
//     .{bg_class}                                 ← bg-lite | bg-img | bg-img-fixed
//     .cta-preset-1 | .cta-preset-2               ← preset class
//
//   cta-basic:
//     .eael-call-to-action.cta-basic
//       {h2}.title.eael-cta-heading               ← title (tag from title_tag control, default h2)
//       p                                         ← content
//       a.cta-button.{preset}.{btn_preset}        ← primary button
//       [a.cta-button.cta-secondary-button]       ← secondary (optional)
//
//   cta-flex / cta-icon-flex:
//     .eael-call-to-action.cta-flex | .cta-icon-flex
//       [.icon]                                   ← icon-flex only
//       .content
//         {h2}.title.eael-cta-heading
//         p
//       .action
//         a.cta-button

const cta    = (hook: string) => `.${hook} .eael-call-to-action`;
const title  = (hook: string) => `.${hook} .eael-call-to-action .title`;
const btn    = (hook: string) => `.${hook} .eael-call-to-action a.cta-button:not(.cta-secondary-button)`;
const secBtn = (hook: string) => `.${hook} .eael-call-to-action a.cta-secondary-button`;

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
    "test-ctab-default":   "cta-basic",
    "test-ctab-flex":      "cta-flex",
    "test-ctab-icon-flex": "cta-icon-flex",
  };

  for (const [hook, layoutClass] of Object.entries(layoutMap)) {
    test(`${layoutClass}: .eael-call-to-action is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(cta(hook)).first()).toBeVisible();
    });

    test(`${layoutClass}: correct layout class applied`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(cta(hook)).first()).toHaveClass(
        new RegExp(layoutClass)
      );
    });

    test(`${layoutClass}: title text renders`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(title(hook)).first()).toBeVisible();
    });

    test(`${layoutClass}: primary button renders`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(btn(hook)).first()).toBeVisible();
    });
  }

  test("cta-flex: has .content and .action child divs", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ctab-flex .eael-call-to-action .content").first()
    ).toBeAttached();
    await expect(
      page.locator(".test-ctab-flex .eael-call-to-action .action").first()
    ).toBeAttached();
  });

  test("cta-icon-flex: has .icon, .content and .action child divs", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ctab-icon-flex .eael-call-to-action .icon").first()
    ).toBeAttached();
    await expect(
      page.locator(".test-ctab-icon-flex .eael-call-to-action .content").first()
    ).toBeAttached();
    await expect(
      page.locator(".test-ctab-icon-flex .eael-call-to-action .action").first()
    ).toBeAttached();
  });

  test("cta-icon-flex: icon element is rendered inside .icon", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ctab-icon-flex .eael-call-to-action .icon svg, .test-ctab-icon-flex .eael-call-to-action .icon i").first()
    ).toBeAttached();
  });
});

// ============================================================================
// 3. Presets
// ============================================================================

test.describe("Presets", () => {
  test("preset-1 default: button has cta-preset-1 class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(btn("test-ctab-default")).first()).toHaveClass(
      /cta-preset-1/
    );
  });

  test("preset-2: button has cta-preset-2 class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(btn("test-ctab-preset-2")).first()).toHaveClass(
      /cta-preset-2/
    );
  });

  test("preset-2: button also has cta-btn-preset-2 class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(btn("test-ctab-preset-2")).first()).toHaveClass(
      /cta-btn-preset-2/
    );
  });

  test("preset-1: .eael-call-to-action has cta-preset-1 class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(cta("test-ctab-default")).first()).toHaveClass(
      /cta-preset-1/
    );
  });
});

// ============================================================================
// 4. Button features
// ============================================================================

test.describe("Button features", () => {
  test("primary button renders with configured text 'Click Here'", async ({ page }) => {
    await openPage(page);
    const txt = await page.locator(btn("test-ctab-default")).first().textContent();
    expect(txt?.trim()).toBe("Click Here");
  });

  test("primary button default href is '#'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(btn("test-ctab-default")).first()).toHaveAttribute(
      "href",
      "#"
    );
  });

  test("secondary button renders when enabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(secBtn("test-ctab-secondary")).first()).toBeVisible();
  });

  test("secondary button has cta-secondary-button class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(secBtn("test-ctab-secondary")).first()).toHaveClass(
      /cta-secondary-button/
    );
  });

  test("secondary button text is 'Learn More'", async ({ page }) => {
    await openPage(page);
    const txt = await page.locator(secBtn("test-ctab-secondary")).first().textContent();
    expect(txt?.trim()).toBe("Learn More");
  });

  test("default widget has no secondary button", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(secBtn("test-ctab-default"))
    ).toHaveCount(0);
  });
});

// ============================================================================
// 5. Link behaviour
// ============================================================================

test.describe("Link behaviour", () => {
  test("external link: button has target='_blank'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(btn("test-ctab-link-external")).first()).toHaveAttribute(
      "target",
      "_blank"
    );
  });

  test("external link: button href is '#'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(btn("test-ctab-link-external")).first()).toHaveAttribute(
      "href",
      "#"
    );
  });

  test("nofollow link: button rel contains 'nofollow'", async ({ page }) => {
    await openPage(page);
    const rel = await page.locator(btn("test-ctab-link-nofollow")).first().getAttribute("rel");
    expect(rel).toContain("nofollow");
  });

  test("default link: no target='_blank'", async ({ page }) => {
    await openPage(page);
    const target = await page.locator(btn("test-ctab-default")).first().getAttribute("target");
    expect(target).toBeNull();
  });
});

// ============================================================================
// 6. Alignment
//    prefix_class 'content-align-%s' → content-align-cta-center on {{WRAPPER}}
// ============================================================================

test.describe("Alignment", () => {
  test("center-aligned widget has content-align-cta-center class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(".test-ctab-align-center").first()).toHaveClass(
      /content-align-cta-center/
    );
  });

  test("default (left) widget has content-align-cta-default class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(".test-ctab-default").first()).toHaveClass(
      /content-align-cta-default/
    );
  });
});

// ============================================================================
// 7. Element structure
// ============================================================================

test.describe("Element structure", () => {
  test("primary button is rendered as an <a> tag", async ({ page }) => {
    await openPage(page);
    const tag = await page.locator(btn("test-ctab-default")).first().evaluate(
      (el) => el.tagName
    );
    expect(tag).toBe("A");
  });

  test("title is rendered as configured HTML tag (default h2)", async ({ page }) => {
    await openPage(page);
    const tag = await page.locator(title("test-ctab-default")).first().evaluate(
      (el) => el.tagName
    );
    expect(tag).toBe("H2");
  });

  test("title has class 'title' and 'eael-cta-heading'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(title("test-ctab-default")).first()).toHaveClass(
      /eael-cta-heading/
    );
  });

  test("title contains configured text 'CTA Title'", async ({ page }) => {
    await openPage(page);
    const txt = await page.locator(title("test-ctab-default")).first().textContent();
    expect(txt?.trim()).toBe("CTA Title");
  });

  test("cta-basic wrapper has class 'bg-lite' (color background)", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(cta("test-ctab-default")).first()).toHaveClass(/bg-lite/);
  });
});

// ============================================================================
// 8. Interaction
// ============================================================================

test.describe("Interaction", () => {
  test("hover on each CTA widget triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of Object.keys({
      "test-ctab-default":   1,
      "test-ctab-flex":      1,
      "test-ctab-icon-flex": 1,
      "test-ctab-preset-2":  1,
      "test-ctab-secondary": 1,
    })) {
      await page.locator(cta(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking primary button causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(btn("test-ctab-default")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("primary button is keyboard-focusable", async ({ page }) => {
    await openPage(page);
    const button = page.locator(btn("test-ctab-default")).first();
    await button.focus();
    await expect(button).toBeFocused();
  });
});
