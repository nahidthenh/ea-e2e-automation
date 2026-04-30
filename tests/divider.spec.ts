import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.DIVIDER_PAGE_SLUG ?? "divider"}/`;

// ── selectors ─────────────────────────────────────────────────────────────────
// DOM shape (from Divider::render()):
//   .{hook}                                          ← elementor-widget wrapper
//     .eael-divider-wrap                             ← EA wrapper
//       .divider-direction-{horizontal|vertical}    ← direction modifier
//
//       — plain type:
//           .eael-divider.{direction}.{style}        ← line element
//
//       — text / icon / image types:
//           .divider-text-container
//             .divider-text-wrap                     ← display:flex|block
//               .divider-border-wrap.divider-border-left
//                 .divider-border
//               span.eael-divider-content
//                 {tag}.eael-divider-text            ← text type
//                 span.eael-divider-icon             ← icon type
//                 span.eael-divider-image            ← image type
//               .divider-border-wrap.divider-border-right
//                 .divider-border

const wrap      = (hook: string) => `.${hook} .eael-divider-wrap`;
const divider   = (hook: string) => `.${hook} .eael-divider`;
const textEl    = (hook: string) => `.${hook} .eael-divider-text`;
const iconEl    = (hook: string) => `.${hook} .eael-divider-icon`;
const leftBorder  = (hook: string) => `.${hook} .divider-border-left`;
const rightBorder = (hook: string) => `.${hook} .divider-border-right`;

// ── known style values ────────────────────────────────────────────────────────
const BORDER_STYLES = ["solid", "dashed", "dotted", "double"] as const;

// ── helpers ───────────────────────────────────────────────────────────────────

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
// 2. Divider types
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Divider types", () => {
  test("plain type: .eael-divider-wrap is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrap("test-d-plain")).first()).toBeVisible();
  });

  test("plain type: .eael-divider line element is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(divider("test-d-plain")).first()).toBeAttached();
  });

  test("plain type: .eael-divider has 'horizontal' class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(divider("test-d-plain")).first()).toHaveClass(
      /horizontal/
    );
  });

  test("text type: .eael-divider-wrap is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrap("test-d-text")).first()).toBeVisible();
  });

  test("text type: .eael-divider-text element is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(textEl("test-d-text")).first()).toBeAttached();
  });

  test("text type: correct text content is rendered", async ({ page }) => {
    await openPage(page);
    const content = await page
      .locator(textEl("test-d-text"))
      .first()
      .textContent();
    expect(content?.trim()).toBe("Section Title");
  });

  test("icon type: .eael-divider-wrap is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrap("test-d-icon")).first()).toBeVisible();
  });

  test("icon type: .eael-divider-icon element is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(iconEl("test-d-icon")).first()).toBeAttached();
  });

  test("icon type: .eael-divider-content has 'eael-divider-icon' class", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-d-icon .eael-divider-content").first()
    ).toHaveClass(/eael-divider-icon/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Direction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Direction", () => {
  test("horizontal: wrapper has 'divider-direction-horizontal' class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrap("test-d-plain")).first()).toHaveClass(
      /divider-direction-horizontal/
    );
  });

  test("vertical: wrapper has 'divider-direction-vertical' class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrap("test-d-vertical")).first()).toHaveClass(
      /divider-direction-vertical/
    );
  });

  test("vertical: .eael-divider has 'vertical' class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(divider("test-d-vertical")).first()).toHaveClass(
      /vertical/
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Left / right divider line toggles
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Left/right divider toggles", () => {
  test("text type default: left border is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(leftBorder("test-d-text")).first()).toBeAttached();
  });

  test("text type default: right border is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(rightBorder("test-d-text")).first()).toBeAttached();
  });

  test("left hidden: .divider-border-left is absent", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(leftBorder("test-d-no-left"))).toHaveCount(0);
  });

  test("left hidden: .divider-border-right is still rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(rightBorder("test-d-no-left")).first()
    ).toBeAttached();
  });

  test("right hidden: .divider-border-right is absent", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(rightBorder("test-d-no-right"))).toHaveCount(0);
  });

  test("right hidden: .divider-border-left is still rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(leftBorder("test-d-no-right")).first()
    ).toBeAttached();
  });

  test("left hidden: correct text content still renders", async ({ page }) => {
    await openPage(page);
    const text = await page
      .locator(textEl("test-d-no-left"))
      .first()
      .textContent();
    expect(text?.trim()).toBe("No Left Line");
  });

  test("right hidden: correct text content still renders", async ({ page }) => {
    await openPage(page);
    const text = await page
      .locator(textEl("test-d-no-right"))
      .first()
      .textContent();
    expect(text?.trim()).toBe("No Right Line");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Alignment
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Alignment", () => {
  const alignMap: Record<string, string> = {
    "test-d-align-left":  "left",
    "test-d-align-right": "right",
    "test-d-plain":       "center",
  };

  for (const [hook, expected] of Object.entries(alignMap)) {
    test(`${expected} alignment: wrapper text-align is '${expected}'`, async ({ page }) => {
      await openPage(page);
      const textAlign = await page
        .locator(`.${hook}`)
        .first()
        .evaluate((el) => getComputedStyle(el).textAlign);
      expect(textAlign).toBe(expected);
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Border styles
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Border styles", () => {
  const styleMap: Record<string, string> = {
    "test-d-plain":  "dashed",
    "test-d-solid":  "solid",
    "test-d-dotted": "dotted",
    "test-d-double": "double",
  };

  for (const [hook, styleClass] of Object.entries(styleMap)) {
    test(`${styleClass}: .eael-divider has '${styleClass}' class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(divider(hook)).first()).toHaveClass(
        new RegExp(styleClass)
      );
    });
  }

  test("solid style: computed border-bottom-style is 'solid'", async ({ page }) => {
    await openPage(page);
    const style = await page
      .locator(divider("test-d-solid"))
      .first()
      .evaluate((el) => getComputedStyle(el).borderBottomStyle);
    expect(style).toBe("solid");
  });

  test("dashed style: computed border-bottom-style is 'dashed'", async ({ page }) => {
    await openPage(page);
    const style = await page
      .locator(divider("test-d-plain"))
      .first()
      .evaluate((el) => getComputedStyle(el).borderBottomStyle);
    expect(style).toBe("dashed");
  });

  test("dotted style: computed border-bottom-style is 'dotted'", async ({ page }) => {
    await openPage(page);
    const style = await page
      .locator(divider("test-d-dotted"))
      .first()
      .evaluate((el) => getComputedStyle(el).borderBottomStyle);
    expect(style).toBe("dotted");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Element structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  const hook = "test-d-plain";

  test(".eael-divider-wrap is attached", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrap(hook)).first()).toBeAttached();
  });

  test(".eael-divider-wrap has direction class", async ({ page }) => {
    await openPage(page);
    const cls = await page
      .locator(wrap(hook))
      .first()
      .getAttribute("class") ?? "";
    expect(cls).toMatch(/divider-direction-(horizontal|vertical)/);
  });

  test("text type: .eael-divider-content wraps the text element", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-d-text .eael-divider-content .eael-divider-text").first()
    ).toBeAttached();
  });

  test("text type: text element is rendered as a <span> (default html tag)", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(textEl("test-d-text"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("SPAN");
  });

  test("icon type: .eael-divider-content wraps the icon", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-d-icon .eael-divider-content").first()
    ).toBeAttached();
  });

  test("known border styles list is exhaustive", async ({ page }) => {
    await openPage(page);
    for (const style of BORDER_STYLES) {
      // Each style must have at least one element using it on the page
      const count = await page.locator(`.eael-divider.${style}`).count();
      expect(count, `No divider found with class '${style}'`).toBeGreaterThan(0);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover on each divider type triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-d-plain",
      "test-d-text",
      "test-d-icon",
      "test-d-vertical",
    ]) {
      await page.locator(wrap(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("no JS errors when scrolling past all divider instances", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Visual regression
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Visual regression", () => {
  const HOOKS = [
    "test-d-plain",
    "test-d-text",
    "test-d-icon",
    "test-d-vertical",
    "test-d-no-left",
    "test-d-no-right",
    "test-d-align-left",
    "test-d-align-right",
    "test-d-solid",
    "test-d-dotted",
    "test-d-double",
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
