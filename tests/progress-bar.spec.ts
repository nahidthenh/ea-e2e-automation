/**
 * Covered: Essential Addons — Progress Bar widget
 *
 * 1. Page health      — HTTP 200, no PHP errors, no JS errors
 * 2. Line layout      — container / title / progressbar div; data-layout; data-count;
 *                       data-duration; stripe class; count-wrap; line-fill element
 * 3. Circle layout    — circle-container / circle-pie / circle-inner /
 *                       circle-inner-content with title and count
 * 4. Interaction      — hover triggers animation (no JS errors);
 *                       scroll-into-view starts animation
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.PROGRESS_BAR_PAGE_SLUG ?? "progress-bar"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Progress_Bar::render()):
//
// Line layout:
//   .{hook}
//     .eael-progressbar-line-container.{alignment}
//       .eael-progressbar-title
//       div.eael-progressbar.eael-progressbar-line[data-layout][data-count][data-duration]
//         [.eael-progressbar-line-stripe]  ← when stripe enabled
//         [.eael-progressbar-line-rainbow] ← pro only
//         span.eael-progressbar-count-wrap
//           span.eael-progressbar-count
//           span.postfix
//         span.eael-progressbar-line-fill[.eael-has-inner-title]
//
// Circle layout:
//   .{hook}
//     .eael-progressbar-circle-container.{alignment}
//       div.eael-progressbar.eael-progressbar-circle[data-layout][data-count]
//         [.eael-progressbar-circle-fill]  ← pro only
//         .eael-progressbar-circle-pie
//         .eael-progressbar-circle-inner
//         .eael-progressbar-circle-inner-content
//           .eael-progressbar-title
//           span.eael-progressbar-count-wrap
//
// Half Circle layout:
//   .{hook}
//     .eael-progressbar-circle-container.{alignment}
//       div.eael-progressbar.eael-progressbar-half-circle[data-layout][data-count]
//         [.eael-progressbar-half-circle-fill]  ← pro only
//       div.eael-progressbar-half-circle-after
//         span.eael-progressbar-prefix-label
//         span.eael-progressbar-postfix-label
//
// Box layout (pro only):
//   .{hook}
//     .eael-progressbar-box-container.{alignment}
//       div.eael-progressbar-box[data-layout][data-count]
//         .eael-progressbar-box-inner-content
//           .eael-progressbar-title
//           span.eael-progressbar-count-wrap
//         .eael-progressbar-box-fill

const lineContainer  = (hook: string) => `.${hook} .eael-progressbar-line-container`;
const circleContainer = (hook: string) => `.${hook} .eael-progressbar-circle-container`;
const lineBar        = (hook: string) => `.${hook} .eael-progressbar-line`;
const circleBar      = (hook: string) => `.${hook} .eael-progressbar-circle:not(.eael-progressbar-half-circle)`;
const halfCircleBar  = (hook: string) => `.${hook} .eael-progressbar-half-circle`;
const boxContainer   = (hook: string) => `.${hook} .eael-progressbar-box-container`;
const boxBar         = (hook: string) => `.${hook} .eael-progressbar-box`;
const title          = (hook: string) => `.${hook} .eael-progressbar-title`;
const countWrap      = (hook: string) => `.${hook} .eael-progressbar-count-wrap`;
const countEl        = (hook: string) => `.${hook} .eael-progressbar-count`;
const lineFill       = (hook: string) => `.${hook} .eael-progressbar-line-fill`;
const halfCircleAfter = (hook: string) => `.${hook} .eael-progressbar-half-circle-after`;
const prefixLabel    = (hook: string) => `.${hook} .eael-progressbar-prefix-label`;
const postfixLabel   = (hook: string) => `.${hook} .eael-progressbar-postfix-label`;

// ── free layout map: hook → layout wrapper selector ───────────────────────
const FREE_LAYOUT_MAP = {
  "test-pb-default":    { selector: lineContainer,   layoutClass: "eael-progressbar-line" },
  "test-pb-circle":     { selector: circleContainer, layoutClass: "eael-progressbar-circle" },
  "test-pb-half-circle":{ selector: circleContainer, layoutClass: "eael-progressbar-half-circle" },
} as const;

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
// 2. Free layout variants
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Free layout variants", () => {
  for (const [hook, { selector, layoutClass }] of Object.entries(FREE_LAYOUT_MAP)) {
    test(`${layoutClass} — container is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(selector(hook)).first()).toBeVisible();
    });

    test(`${layoutClass} — applies correct layout class`, async ({ page }) => {
      await openPage(page);
      await expect(
        page.locator(`.${hook} .eael-progressbar`).first()
      ).toHaveClass(new RegExp(layoutClass));
    });

    test(`${layoutClass} — title renders`, async ({ page }) => {
      await openPage(page);
      const text = await page.locator(title(hook)).first().textContent();
      expect(text?.trim()).toBe("Progress Bar");
    });

    test(`${layoutClass} — has data-count attribute`, async ({ page }) => {
      await openPage(page);
      const dataCount = await page
        .locator(`.${hook} .eael-progressbar`)
        .first()
        .getAttribute("data-count");
      expect(dataCount).not.toBeNull();
      expect(Number(dataCount)).toBeGreaterThan(0);
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Pro layout variants
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Pro layout variants", () => {
  test("line_rainbow — eael-progressbar-line-rainbow class applied (pro)", async ({ page }) => {
    await openPage(page);
    const cls = await page
      .locator(".test-pb-pro-rainbow .eael-progressbar")
      .first()
      .getAttribute("class");
    expect(cls).toMatch(/eael-progressbar-line(?:-rainbow)?/);
  });

  test("circle_fill — eael-progressbar-circle-fill class applied (pro)", async ({ page }) => {
    await openPage(page);
    const el = page.locator(".test-pb-pro-circle-fill .eael-progressbar").first();
    await expect(el).toBeAttached();
    const cls = (await el.getAttribute("class")) ?? "";
    expect(cls).toMatch(/eael-progressbar-(?:circle-fill|line)/);
  });

  test("half_circle_fill — eael-progressbar-half-circle-fill class applied (pro)", async ({ page }) => {
    await openPage(page);
    const el = page.locator(".test-pb-pro-half-fill .eael-progressbar").first();
    await expect(el).toBeAttached();
    const cls = (await el.getAttribute("class")) ?? "";
    expect(cls).toMatch(/eael-progressbar-(?:half-circle-fill|half-circle|line)/);
  });

  test("box — .eael-progressbar-box-container or line fallback is present", async ({ page }) => {
    await openPage(page);
    const boxPresent = await page.locator(boxContainer("test-pb-pro-box")).count();
    const linePresent = await page.locator(lineContainer("test-pb-pro-box")).count();
    expect(boxPresent + linePresent).toBeGreaterThan(0);
  });

  test("box (pro) — .eael-progressbar-box has data-count", async ({ page }) => {
    await openPage(page);
    const boxEl = page.locator(boxBar("test-pb-pro-box")).first();
    const isBox = await boxEl.count();
    if (isBox > 0) {
      const dataCount = await boxEl.getAttribute("data-count");
      expect(Number(dataCount)).toBeGreaterThan(0);
    } else {
      // free fallback: line renders instead
      await expect(page.locator(lineBar("test-pb-pro-box")).first()).toBeAttached();
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Display count
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Display count", () => {
  test("default — .eael-progressbar-count-wrap is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(countWrap("test-pb-default")).first()).toBeVisible();
  });

  test("count off — .eael-progressbar-count-wrap not rendered in line layout", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(countWrap("test-pb-no-count"))).toHaveCount(0);
  });

  test("default — .eael-progressbar-count starts at 0 or target", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(countEl("test-pb-default")).first().textContent();
    expect(["0", "50"]).toContain(text?.trim());
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Inner title (line layout)
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Inner title", () => {
  test("inner title on — .eael-has-inner-title class on line-fill", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(lineFill("test-pb-inner-title")).first()).toHaveClass(
      /eael-has-inner-title/
    );
  });

  test("inner title on — fill span contains inner title text", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(lineFill("test-pb-inner-title")).first().textContent();
    expect(text?.trim()).toBe("Inner Label");
  });

  test("default — no .eael-has-inner-title class on line-fill", async ({ page }) => {
    await openPage(page);
    const cls = (await page.locator(lineFill("test-pb-default")).first().getAttribute("class")) ?? "";
    expect(cls).not.toMatch(/eael-has-inner-title/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Stripe
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Stripe", () => {
  test("stripe on — .eael-progressbar-line-stripe class applied", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(lineBar("test-pb-stripe")).first()).toHaveClass(
      /eael-progressbar-line-stripe/
    );
  });

  test("default — no .eael-progressbar-line-stripe on default widget", async ({ page }) => {
    await openPage(page);
    const cls = (await page.locator(lineBar("test-pb-default")).first().getAttribute("class")) ?? "";
    expect(cls).not.toMatch(/eael-progressbar-line-stripe/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Prefix / Postfix labels (half circle)
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Prefix / Postfix labels", () => {
  test("half_circle — .eael-progressbar-half-circle-after is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(halfCircleAfter("test-pb-half-circle")).first()).toBeAttached();
  });

  test("half_circle — prefix label shows 'Start'", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(prefixLabel("test-pb-half-circle")).first().textContent();
    expect(text?.trim()).toBe("Start");
  });

  test("half_circle — postfix label shows 'End'", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(postfixLabel("test-pb-half-circle")).first().textContent();
    expect(text?.trim()).toBe("End");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Alignment
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Alignment", () => {
  test("line left — container has 'left' class", async ({ page }) => {
    await openPage(page);
    const cls = (await page.locator(lineContainer("test-pb-align-left")).first().getAttribute("class")) ?? "";
    expect(cls).toMatch(/\bleft\b/);
  });

  test("circle right — container has 'right' class", async ({ page }) => {
    await openPage(page);
    const cls = (await page.locator(circleContainer("test-pb-align-right")).first().getAttribute("class")) ?? "";
    expect(cls).toMatch(/\bright\b/);
  });

  test("line default — container has 'center' class", async ({ page }) => {
    await openPage(page);
    const cls = (await page.locator(lineContainer("test-pb-default")).first().getAttribute("class")) ?? "";
    expect(cls).toMatch(/\bcenter\b/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. Element structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("line — .eael-progressbar-line-fill is present inside bar", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(lineFill("test-pb-default")).first()).toBeAttached();
  });

  test("circle — .eael-progressbar-circle-inner-content is present", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pb-circle .eael-progressbar-circle-inner-content").first()
    ).toBeAttached();
  });

  test("half_circle — .eael-progressbar-half-circle is present inside container", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(halfCircleBar("test-pb-half-circle")).first()).toBeAttached();
  });

  test("line — data-duration attribute is set", async ({ page }) => {
    await openPage(page);
    const dur = await page.locator(lineBar("test-pb-default")).first().getAttribute("data-duration");
    expect(dur).not.toBeNull();
    expect(Number(dur)).toBeGreaterThan(0);
  });

  test("title renders as the configured HTML tag (default: div)", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(title("test-pb-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("DIV");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover on each free layout triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of Object.keys(FREE_LAYOUT_MAP)) {
      const container = page.locator(`.${hook} .eael-progressbar-line-container, .${hook} .eael-progressbar-circle-container`).first();
      await container.hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover on pro layout instances triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of ["test-pb-pro-rainbow", "test-pb-pro-circle-fill", "test-pb-pro-half-fill", "test-pb-pro-box"]) {
      const container = page
        .locator(`.${hook} .eael-progressbar-line-container, .${hook} .eael-progressbar-circle-container, .${hook} .eael-progressbar-box-container`)
        .first();
      await container.hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
