/**
 * Covered: Essential Addons — Creative Button widget
 *
 * 1. Page health        — HTTP 200, no PHP errors, no JS errors
 * 2. Button effects     — 6 free effects (default/winona/ujarak/wayra/tamaya/rayen);
 *                         CSS class, "Click Me!" text, data-text="Go!"
 * 3. Pro button effects — 10 pro effects (pipaluk/moema/wave/aylen/saqui/
 *                         wapasha/nuka/antiman/quidel/shikoba)
 * 4. Tamaya effect      — secondary text in before/after divs with "Go!" text
 * 5. Icon configuration — left / right position; no icon on opposite side
 * 6. Link behaviour     — href "#"; external target="_blank"; nofollow; no-target default
 * 7. Button alignment   — center (justify-content:center); right (justify-content:flex-end)
 * 8. Element structure  — <a> tag; .cretive-button-text class
 * 9. Interaction        — hover (no JS errors); click (no JS errors)
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.CREATIVE_BUTTON_PAGE_SLUG ?? "creative-button"}/`;

// -- selectors ---------------------------------------------------------------
// Each widget on the page gets a stable CSS class (set via _css_classes in
// Elementor) so tests can target specific configurations independently.
//
// DOM shape (from Creative_Button::render()):
//   .{hook}                                  ← elementor-widget wrapper
//     .eael-creative-button-wrapper
//       a.eael-creative-button.{effect-cls}  ← the button (anchor)
//         .creative-button-inner
//           .eael-creative-button-icon-left  (optional)
//           span.cretive-button-text         ← "cretive" is the actual typo in EA source
//           .eael-creative-button-icon-right (optional)
//       (Tamaya only)
//         .eael-creative-button--tamaya-before > span
//         .eael-creative-button--tamaya-after  > span

const btn  = (hook: string) => `.${hook} .eael-creative-button`;
const wrap = (hook: string) => `.${hook} .eael-creative-button-wrapper`;
const text = (hook: string) => `.${hook} .cretive-button-text`;

// -- free effect classes defined in the widget ---------------------------------
const FREE_EFFECTS = [
  "eael-creative-button--default",
  "eael-creative-button--winona",
  "eael-creative-button--ujarak",
  "eael-creative-button--wayra",
  "eael-creative-button--tamaya",
  "eael-creative-button--rayen",
] as const;

// -- pro effect classes (requires EA Pro) --------------------------------------
const PRO_EFFECTS = [
  "eael-creative-button--pipaluk",
  "eael-creative-button--moema",
  "eael-creative-button--wave",
  "eael-creative-button--aylen",
  "eael-creative-button--saqui",
  "eael-creative-button--wapasha",
  "eael-creative-button--nuka",
  "eael-creative-button--antiman",
  "eael-creative-button--quidel",
  "eael-creative-button--shikoba",
] as const;

// -- helpers -----------------------------------------------------------------

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
// 2. Button effects — one instance per free effect
// ============================================================================

test.describe("Button effects", () => {
  const effectMap: Record<string, string> = {
    "test-cb-default": "eael-creative-button--default",
    "test-cb-winona":  "eael-creative-button--winona",
    "test-cb-ujarak":  "eael-creative-button--ujarak",
    "test-cb-wayra":   "eael-creative-button--wayra",
    "test-cb-tamaya":  "eael-creative-button--tamaya",
    "test-cb-rayen":   "eael-creative-button--rayen",
  };

  for (const [hook, effectClass] of Object.entries(effectMap)) {
    test(`${effectClass} button is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(btn(hook)).first()).toBeVisible();
    });

    test(`${effectClass} applies correct CSS class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(btn(hook)).first()).toHaveClass(
        new RegExp(effectClass)
      );
    });

    test(`${effectClass} renders primary text`, async ({ page }) => {
      await openPage(page);
      const content = await page.locator(text(hook)).first().textContent();
      expect(content?.trim()).toBe("Click Me!");
    });

    test(`${effectClass} has data-text attribute for secondary text`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(btn(hook)).first()).toHaveAttribute(
        "data-text",
        "Go!"
      );
    });
  }
});

// ============================================================================
// 3. Pro button effects
// ============================================================================

test.describe("Pro button effects", () => {
  // Derive hooks from PRO_EFFECTS so the two stay in sync automatically.
  // e.g. "eael-creative-button--wave" → hook "test-cb-wave"
  const proEffectMap = Object.fromEntries(
    PRO_EFFECTS.map((e) => [`test-cb-${e.replace("eael-creative-button--", "")}`, e])
  ) as Record<string, string>;

  for (const [hook, effectClass] of Object.entries(proEffectMap)) {
    test(`${effectClass} button is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(btn(hook)).first()).toBeVisible();
    });

    test(`${effectClass} applies correct CSS class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(btn(hook)).first()).toHaveClass(
        new RegExp(effectClass)
      );
    });

    test(`${effectClass} renders primary text`, async ({ page }) => {
      await openPage(page);
      const content = await page.locator(text(hook)).first().textContent();
      expect(content?.trim()).toBe("Click Me!");
    });

    test(`${effectClass} has data-text attribute for secondary text`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(btn(hook)).first()).toHaveAttribute(
        "data-text",
        "Go!"
      );
    });
  }
});

// ============================================================================
// 4. Tamaya effect — unique DOM structure
//    Tamaya renders explicit before/after divs (not just data-text).
// ============================================================================

test.describe("Tamaya effect — secondary text DOM nodes", () => {
  const hook = "test-cb-tamaya";

  test("renders .eael-creative-button--tamaya-before node", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-creative-button--tamaya-before`).first()
    ).toBeVisible();
  });

  test("renders .eael-creative-button--tamaya-after node", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-creative-button--tamaya-after`).first()
    ).toBeVisible();
  });

  test("before/after nodes contain secondary text", async ({ page }) => {
    await openPage(page);
    const before = await page
      .locator(`.${hook} .eael-creative-button--tamaya-before span`)
      .first()
      .textContent();
    const after = await page
      .locator(`.${hook} .eael-creative-button--tamaya-after span`)
      .first()
      .textContent();
    expect(before?.trim()).toBe("Go!");
    expect(after?.trim()).toBe("Go!");
  });
});

// ============================================================================
// 5. Icon — left and right positions
// ============================================================================

test.describe("Icon configuration", () => {
  test("icon-left: .eael-creative-button-icon-left is rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-cb-icon-left .eael-creative-button-icon-left").first()
    ).toBeVisible();
  });

  test("icon-left: no right-icon element present", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-cb-icon-left .eael-creative-button-icon-right")
    ).toHaveCount(0);
  });

  test("icon-right: .eael-creative-button-icon-right is rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-cb-icon-right .eael-creative-button-icon-right").first()
    ).toBeVisible();
  });

  test("icon-right: no left-icon element present", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-cb-icon-right .eael-creative-button-icon-left")
    ).toHaveCount(0);
  });

  test("icon-left button retains correct effect class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(btn("test-cb-icon-left")).first()).toHaveClass(
      /eael-creative-button--default/
    );
  });
});

// ============================================================================
// 6. Link behaviour
// ============================================================================

test.describe("Link behaviour", () => {
  test("default button href is '#'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(btn("test-cb-default")).first()).toHaveAttribute(
      "href",
      "#"
    );
  });

  test("external button has target='_blank'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(btn("test-cb-external")).first()).toHaveAttribute(
      "target",
      "_blank"
    );
  });

  test("external button href points to configured URL", async ({ page }) => {
    await openPage(page);
    const href = await page
      .locator(btn("test-cb-external"))
      .first()
      .getAttribute("href");
    expect(href).toContain("essential-addons.com");
  });

  test("nofollow button has rel containing 'nofollow'", async ({ page }) => {
    await openPage(page);
    const rel = await page
      .locator(btn("test-cb-nofollow"))
      .first()
      .getAttribute("rel");
    expect(rel).toContain("nofollow");
  });

  test("non-external button has no target='_blank'", async ({ page }) => {
    await openPage(page);
    const target = await page
      .locator(btn("test-cb-default"))
      .first()
      .getAttribute("target");
    expect(target).toBeNull();
  });
});

// ============================================================================
// 7. Button alignment
//    Alignment is applied as justify-content on .eael-creative-button-wrapper.
// ============================================================================

test.describe("Button alignment", () => {
  test("center-aligned wrapper has justify-content: center", async ({ page }) => {
    await openPage(page);
    const jc = await page
      .locator(wrap("test-cb-align-center"))
      .first()
      .evaluate((el) => getComputedStyle(el).justifyContent);
    expect(jc).toBe("center");
  });

  test("right-aligned wrapper has justify-content: flex-end", async ({ page }) => {
    await openPage(page);
    const jc = await page
      .locator(wrap("test-cb-align-right"))
      .first()
      .evaluate((el) => getComputedStyle(el).justifyContent);
    expect(jc).toBe("flex-end");
  });
});

// ============================================================================
// 8. Button element structure
// ============================================================================

test.describe("Button element structure", () => {
  test("button is rendered as an <a> tag", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(btn("test-cb-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("A");
  });

  test("button effect class is one of the known free effects", async ({ page }) => {
    await openPage(page);
    const cls = await page
      .locator(btn("test-cb-default"))
      .first()
      .getAttribute("class") ?? "";
    const hasEffect = FREE_EFFECTS.some((e) => cls.includes(e));
    expect(hasEffect, `Unknown effect in: "${cls}"`).toBe(true);
  });

  test("primary text span uses .cretive-button-text (EA source typo)", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-cb-default .cretive-button-text").first()
    ).toBeAttached();
  });
});

// ============================================================================
// 9. Interaction
// ============================================================================

test.describe("Interaction", () => {
  test("button is keyboard-focusable", async ({ page }) => {
    await openPage(page);
    const button = page.locator(btn("test-cb-default")).first();
    await button.focus();
    await expect(button).toBeFocused();
  });

  test("hover on each free-effect button triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of Object.keys({
      "test-cb-default": 1,
      "test-cb-winona": 1,
      "test-cb-ujarak": 1,
      "test-cb-wayra": 1,
      "test-cb-tamaya": 1,
      "test-cb-rayen": 1,
    })) {
      await page.locator(btn(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking an anchor-only button (#) causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(btn("test-cb-default")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
