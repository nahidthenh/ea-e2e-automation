import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.FANCY_TEXT_PAGE_SLUG ?? "fancy-text"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Fancy_Text::render()):
//   .{hook}                                  ← elementor-widget wrapper
//     div.eael-fancy-text-container.style-1  ← container (always style-1 in free)
//       data-fancy-text-transition-type      ← animation type key
//       data-fancy-text                      ← pipe-separated strings (|Alpha|Beta|Gamma)
//       data-fancy-text-cursor               ← "yes" | ""
//       data-fancy-text-loop                 ← "yes" | ""
//       data-fancy-text-action               ← "page_load" | "view_port"
//       span.eael-fancy-text-prefix          ← prefix (if non-empty)
//       span.eael-fancy-text-strings         ← animated text area
//       span.eael-fancy-text-suffix          ← suffix (if non-empty)
//     div.clearfix

const container = (hook: string) => `.${hook} .eael-fancy-text-container`;
const prefix    = (hook: string) => `.${hook} .eael-fancy-text-prefix`;
const strings   = (hook: string) => `.${hook} .eael-fancy-text-strings`;
const suffix    = (hook: string) => `.${hook} .eael-fancy-text-suffix`;

// ── known animation types ─────────────────────────────────────────────────
const FREE_ANIMATIONS = [
  "typing",
  "fadeIn",
  "fadeInUp",
  "fadeInDown",
  "fadeInLeft",
  "fadeInRight",
  "zoomIn",
  "bounceIn",
  "swing",
] as const;

// ── helpers ───────────────────────────────────────────────────────────────

async function openPage(page: Page) {
  await page.goto(PAGE_URL);
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
// 2. Animation types — one instance per type
// ══════════════════════════════════════════════════════════════════════════

test.describe("Animation types", () => {
  const animMap: Record<string, string> = {
    "test-ft-default":      "typing",
    "test-ft-anim-fade":    "fadeIn",
    "test-ft-anim-fadeup":  "fadeInUp",
    "test-ft-anim-fadedown": "fadeInDown",
    "test-ft-anim-fadeleft": "fadeInLeft",
    "test-ft-anim-faderight": "fadeInRight",
    "test-ft-anim-zoom":    "zoomIn",
    "test-ft-anim-bounce":  "bounceIn",
    "test-ft-anim-swing":   "swing",
  };

  for (const [hook, animType] of Object.entries(animMap)) {
    test(`${animType} container is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(container(hook)).first()).toBeVisible();
    });

    test(`${animType} sets data-fancy-text-transition-type correctly`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(container(hook)).first()).toHaveAttribute(
        "data-fancy-text-transition-type",
        animType
      );
    });

    test(`${animType} container has data-fancy-text with pipe-separated strings`, async ({ page }) => {
      await openPage(page);
      const val = await page.locator(container(hook)).first().getAttribute("data-fancy-text");
      expect(val).toContain("Alpha String");
      expect(val).toContain("Beta String");
      expect(val).toContain("Gamma String");
      expect(val).toContain("|");
    });

    test(`${animType} .eael-fancy-text-strings span is present`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(strings(hook)).first()).toBeAttached();
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 3. Alignment
// ══════════════════════════════════════════════════════════════════════════

test.describe("Alignment", () => {
  test("default (center) container has text-align: center", async ({ page }) => {
    await openPage(page);
    const ta = await page
      .locator(container("test-ft-default"))
      .first()
      .evaluate((el) => getComputedStyle(el).textAlign);
    expect(ta).toBe("center");
  });

  test("left-aligned container has text-align: left", async ({ page }) => {
    await openPage(page);
    const ta = await page
      .locator(container("test-ft-align-left"))
      .first()
      .evaluate((el) => getComputedStyle(el).textAlign);
    expect(ta).toBe("left");
  });

  test("right-aligned container has text-align: right", async ({ page }) => {
    await openPage(page);
    const ta = await page
      .locator(container("test-ft-align-right"))
      .first()
      .evaluate((el) => getComputedStyle(el).textAlign);
    expect(ta).toBe("right");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 4. Cursor toggle
// ══════════════════════════════════════════════════════════════════════════

test.describe("Cursor toggle", () => {
  test("cursor ON: data-fancy-text-cursor is 'yes'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-ft-default")).first()).toHaveAttribute(
      "data-fancy-text-cursor",
      "yes"
    );
  });

  test("cursor OFF: data-fancy-text-cursor is not 'yes'", async ({ page }) => {
    await openPage(page);
    const val = await page
      .locator(container("test-ft-cursor-off"))
      .first()
      .getAttribute("data-fancy-text-cursor");
    expect(val).not.toBe("yes");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 5. Loop toggle
// ══════════════════════════════════════════════════════════════════════════

test.describe("Loop toggle", () => {
  test("loop ON: data-fancy-text-loop is 'yes'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-ft-default")).first()).toHaveAttribute(
      "data-fancy-text-loop",
      "yes"
    );
  });

  test("loop OFF: data-fancy-text-loop is not 'yes'", async ({ page }) => {
    await openPage(page);
    const val = await page
      .locator(container("test-ft-loop-off"))
      .first()
      .getAttribute("data-fancy-text-loop");
    expect(val).not.toBe("yes");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 6. Animation start trigger
// ══════════════════════════════════════════════════════════════════════════

test.describe("Animation start trigger", () => {
  test("default: data-fancy-text-action is 'page_load'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-ft-default")).first()).toHaveAttribute(
      "data-fancy-text-action",
      "page_load"
    );
  });

  test("view_port: data-fancy-text-action is 'view_port'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-ft-viewport")).first()).toHaveAttribute(
      "data-fancy-text-action",
      "view_port"
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 7. Prefix and suffix text
// ══════════════════════════════════════════════════════════════════════════

test.describe("Prefix and suffix", () => {
  test("default: prefix span is visible and contains prefix text", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(prefix("test-ft-default")).first()).toBeVisible();
    const text = await page.locator(prefix("test-ft-default")).first().textContent();
    expect(text?.trim()).toContain("This is the");
  });

  test("default: suffix span is visible and contains suffix text", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(suffix("test-ft-default")).first()).toBeVisible();
    const text = await page.locator(suffix("test-ft-default")).first().textContent();
    expect(text?.trim()).toContain("of the sentence");
  });

  test("prefix-only: prefix span is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(prefix("test-ft-prefix-only")).first()).toBeVisible();
    const text = await page.locator(prefix("test-ft-prefix-only")).first().textContent();
    expect(text?.trim()).toContain("Only Prefix");
  });

  test("prefix-only: no suffix span rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(suffix("test-ft-prefix-only"))).toHaveCount(0);
  });

  test("suffix-only: suffix span is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(suffix("test-ft-suffix-only")).first()).toBeVisible();
    const text = await page.locator(suffix("test-ft-suffix-only")).first().textContent();
    expect(text?.trim()).toContain("Only Suffix");
  });

  test("suffix-only: no prefix span rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(prefix("test-ft-suffix-only"))).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 8. Element structure
// ══════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("container has class 'eael-fancy-text-container'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-ft-default")).first()).toHaveClass(
      /eael-fancy-text-container/
    );
  });

  test("container has class 'style-1' in free mode", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-ft-default")).first()).toHaveClass(
      /style-1/
    );
  });

  test("container has data-fancy-text-id attribute", async ({ page }) => {
    await openPage(page);
    const id = await page
      .locator(container("test-ft-default"))
      .first()
      .getAttribute("data-fancy-text-id");
    expect(id).toBeTruthy();
  });

  test("strings span has an id attribute prefixed with 'eael-fancy-text-'", async ({ page }) => {
    await openPage(page);
    const id = await page
      .locator(strings("test-ft-default"))
      .first()
      .getAttribute("id");
    expect(id).toMatch(/^eael-fancy-text-/);
  });

  test("default transition type is one of the known free animation types", async ({ page }) => {
    await openPage(page);
    const val = await page
      .locator(container("test-ft-default"))
      .first()
      .getAttribute("data-fancy-text-transition-type");
    expect(FREE_ANIMATIONS).toContain(val as (typeof FREE_ANIMATIONS)[number]);
  });

  test("clearfix div follows the container", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ft-default .clearfix").first()
    ).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 9. Interaction
// ══════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover on each widget instance triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-ft-default",
      "test-ft-anim-fade",
      "test-ft-anim-fadeup",
      "test-ft-anim-zoom",
      "test-ft-anim-bounce",
      "test-ft-align-left",
      "test-ft-cursor-off",
      "test-ft-loop-off",
    ]) {
      await page.locator(container(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking the strings span on default causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(strings("test-ft-default")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
