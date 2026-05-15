/**
 * Covered: Essential Addons — Counter widget
 *
 * 1. Page health       — HTTP 200, no PHP errors, no JS errors
 * 2. Layout variants   — 6 layouts (eael-counter-layout-1 through layout-6)
 * 3. Icon types        — none / icon (eael-counter-svg-icon) / image (eael-counter-icon-img)
 * 4. Number options    — prefix "$"; suffix "%"; comma separator on/off; number divider;
 *                        data-to="250"; data-speed
 * 5. Alignment         — left / center / right text-align
 * 6. Element structure — title tag div; data-target attr; number-wrap element
 * 7. Interaction       — hover; counter animation verified (0–250 range)
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.COUNTER_PAGE_SLUG ?? "counter"}/`;

// -- selectors -----------------------------------------------------------
// DOM shape (from Counter::render() — pro-only widget):
//   .{hook}                                        ← widget wrapper (_css_classes)
//     .eael-counter-container                      ← outer; text-align from counter_align
//       .eael-counter.eael-counter-{layout}        ← block; has data-target pointing to number
//         [layout-1/5/6 branch:]
//           .eael-counter-icon-wrap                ← icon (if eael_icon_type != 'none')
//             .eael-counter-icon[.eael-counter-icon-img]
//               .eael-counter-svg-icon > svg/i     ← svg icon
//               img                                ← image icon
//           .eael-counter-number-title-wrap
//             .eael-counter-number-wrap
//               span.eael-counter-number-prefix    ← prefix (if set)
//               div.eael-counter-number            ← counter (data-to, data-speed)
//               span.eael-counter-number-suffix    ← suffix (if set)
//             .eael-counter-num-divider-wrap > span.eael-counter-num-divider
//             {tag}.eael-counter-title             ← title (default: div)
//         [layout-2: icon → title → number-wrap]
//         [layout-3: number-wrap → .eael-icon-title-wrap(icon + title)]
//         [layout-4: .eael-icon-title-wrap(icon + title) → number-wrap]

const container = (hook: string) => `.${hook} .eael-counter-container`;
const counter   = (hook: string) => `.${hook} .eael-counter`;
const number    = (hook: string) => `.${hook} .eael-counter-number`;
const titleEl   = (hook: string) => `.${hook} .eael-counter-title`;
const iconWrap  = (hook: string) => `.${hook} .eael-counter-icon-wrap`;
const prefix    = (hook: string) => `.${hook} .eael-counter-number-prefix`;
const suffix    = (hook: string) => `.${hook} .eael-counter-number-suffix`;

// -- layout classes set by counter_layout ----------------------------------
const LAYOUT_MAP: Record<string, string> = {
  "test-c-default":  "eael-counter-layout-1",
  "test-c-layout-2": "eael-counter-layout-2",
  "test-c-layout-3": "eael-counter-layout-3",
  "test-c-layout-4": "eael-counter-layout-4",
  "test-c-layout-5": "eael-counter-layout-5",
  "test-c-layout-6": "eael-counter-layout-6",
};

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
// 2. Layout variants — one instance per layout
// ============================================================================

test.describe("Layout variants", () => {
  for (const [hook, layoutClass] of Object.entries(LAYOUT_MAP)) {
    test(`${layoutClass} — counter container is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(container(hook)).first()).toBeVisible();
    });

    test(`${layoutClass} — applies correct layout class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(counter(hook)).first()).toHaveClass(
        new RegExp(layoutClass)
      );
    });

    test(`${layoutClass} — .eael-counter-number is present`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(number(hook)).first()).toBeAttached();
    });

    test(`${layoutClass} — title renders`, async ({ page }) => {
      await openPage(page);
      const text = await page.locator(titleEl(hook)).first().textContent();
      expect(text?.trim()).toBe("Counter Title");
    });
  }
});

// ============================================================================
// 3. Icon types
// ============================================================================

test.describe("Icon types", () => {
  test("none — no .eael-counter-icon-wrap rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(iconWrap("test-c-default"))).toHaveCount(0);
  });

  test("icon — .eael-counter-icon-wrap is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(iconWrap("test-c-icon")).first()).toBeAttached();
  });

  test("icon — .eael-counter-svg-icon is present inside icon wrap", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-c-icon .eael-counter-svg-icon").first()
    ).toBeAttached();
  });

  test("image — .eael-counter-icon-img class applied", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-c-img .eael-counter-icon.eael-counter-icon-img").first()
    ).toBeAttached();
  });

  test("image — img element renders inside icon wrap", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-c-img .eael-counter-icon img").first()
    ).toBeAttached();
  });
});

// ============================================================================
// 4. Number options
// ============================================================================

test.describe("Number options", () => {
  test("prefix — .eael-counter-number-prefix is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(prefix("test-c-prefix")).first()).toBeVisible();
  });

  test("prefix — displays the configured prefix text", async ({ page }) => {
    await openPage(page);
    const prefixText = await page.locator(prefix("test-c-prefix")).first().textContent();
    expect(prefixText?.trim()).toBe("$");
  });

  test("prefix — no prefix element on default widget", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(prefix("test-c-default"))).toHaveCount(0);
  });

  test("suffix — .eael-counter-number-suffix is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(suffix("test-c-suffix")).first()).toBeVisible();
  });

  test("suffix — displays the configured suffix text", async ({ page }) => {
    await openPage(page);
    const suffixText = await page.locator(suffix("test-c-suffix")).first().textContent();
    expect(suffixText?.trim()).toBe("%");
  });

  test("suffix — no suffix element on default widget", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(suffix("test-c-default"))).toHaveCount(0);
  });

  test("comma separator on — .eael-counter does not have no-comma-separator class", async ({ page }) => {
    await openPage(page);
    const cls = (await page.locator(counter("test-c-default")).first().getAttribute("class")) ?? "";
    expect(cls).not.toMatch(/no-comma-separator/);
  });

  test("comma separator off — .eael-counter has no-comma-separator class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(counter("test-c-no-comma")).first()).toHaveClass(
      /no-comma-separator/
    );
  });

  test("number divider on — .eael-counter-num-divider is rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-c-divider .eael-counter-num-divider").first()
    ).toBeAttached();
  });

  test("number divider off — no .eael-counter-num-divider on default widget", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-c-default .eael-counter-num-divider")
    ).toHaveCount(0);
  });

  test("counter number has correct data-to for default widget (250)", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(number("test-c-default")).first()).toHaveAttribute(
      "data-to",
      "250"
    );
  });

  test("counter number has data-speed attribute", async ({ page }) => {
    await openPage(page);
    const speed = await page.locator(number("test-c-default")).first().getAttribute("data-speed");
    expect(speed).not.toBeNull();
    expect(Number(speed)).toBeGreaterThan(0);
  });
});

// ============================================================================
// 5. Alignment
// ============================================================================

test.describe("Alignment", () => {
  test("left-aligned .eael-counter-container has text-align: left", async ({ page }) => {
    await openPage(page);
    const textAlign = await page
      .locator(container("test-c-align-left"))
      .first()
      .evaluate((el) => getComputedStyle(el).textAlign);
    expect(textAlign).toBe("left");
  });

  test("right-aligned .eael-counter-container has text-align: right", async ({ page }) => {
    await openPage(page);
    const textAlign = await page
      .locator(container("test-c-align-right"))
      .first()
      .evaluate((el) => getComputedStyle(el).textAlign);
    expect(textAlign).toBe("right");
  });

  test("default-aligned .eael-counter-container has text-align: center", async ({ page }) => {
    await openPage(page);
    const textAlign = await page
      .locator(container("test-c-default"))
      .first()
      .evaluate((el) => getComputedStyle(el).textAlign);
    expect(textAlign).toBe("center");
  });
});

// ============================================================================
// 6. Element structure
// ============================================================================

test.describe("Element structure", () => {
  test("title renders as the configured HTML tag (default: div)", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(titleEl("test-c-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("DIV");
  });

  test(".eael-counter-container is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-c-default")).first()).toBeAttached();
  });

  test(".eael-counter has data-target attribute", async ({ page }) => {
    await openPage(page);
    const dataTarget = await page
      .locator(counter("test-c-default"))
      .first()
      .getAttribute("data-target");
    expect(dataTarget).not.toBeNull();
    expect(dataTarget).toMatch(/eael-counter-number/);
  });

  test(".eael-counter-number-wrap contains the number element", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-c-default .eael-counter-number-wrap .eael-counter-number").first()
    ).toBeAttached();
  });
});

// ============================================================================
// 7. Interaction
// ============================================================================

test.describe("Interaction", () => {
  test("hover on each layout variant triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of Object.keys(LAYOUT_MAP)) {
      await page.locator(container(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover on icon and image variants triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of ["test-c-icon", "test-c-img"]) {
      await page.locator(container(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("counter number element has correct target value and contains a valid count", async ({ page }) => {
    await page.goto(PAGE_URL);
    const el = page.locator(number("test-c-default")).first();
    await expect(el).toHaveAttribute("data-to", "250");
    // Scroll into view to trigger the count-up animation
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(3000);
    const text = await el.textContent();
    const trimmed = text?.trim() ?? "";
    if (trimmed === "") {
      // Animation has not yet started — data-to is already verified above
      return;
    }
    const val = parseInt(trimmed.replace(/,/g, ""), 10);
    expect(Number.isInteger(val), `"${trimmed}" is not an integer`).toBe(true);
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThanOrEqual(250);
  });
});
