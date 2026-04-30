import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.SVG_DRAW_PAGE_SLUG ?? "svg-draw"}/`;

// ── selectors ─────────────────────────────────────────────────────────────────
// DOM shape (from SVG_Draw::render()):
//   .{hook}                         ← elementor-widget wrapper
//     [<a href="...">]              ← only when eael_svg_link.url is set
//       .eael-svg-draw-container    ← main container; carries animation class
//         .{anim-class}             ← one of: page-load | page-scroll | mouse-hover | none
//         [.fill-svg]               ← added when eael_svg_fill === 'before'
//         [data-settings="{json}"]  ← animation options JSON
//         svg                       ← the SVG element

const container = (hook: string) => `.${hook} .eael-svg-draw-container`;
const svg       = (hook: string) => `.${hook} .eael-svg-draw-container svg`;
const link      = (hook: string) => `.${hook} > a`;

// ── animation class values ────────────────────────────────────────────────────
const ANIM_MAP: Record<string, string> = {
  "test-sd-default":    "page-load",
  "test-sd-anim-none":  "none",
  "test-sd-anim-scroll": "page-scroll",
  "test-sd-anim-hover": "mouse-hover",
} as const;

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
// 2. Source type
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Source type", () => {
  test("icon source: container is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-sd-default")).first()).toBeVisible();
  });

  test("icon source: SVG element is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(svg("test-sd-default")).first()).toBeAttached();
  });

  test("custom SVG source: container is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-sd-src-custom")).first()).toBeVisible();
  });

  test("custom SVG source: SVG element is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(svg("test-sd-src-custom")).first()).toBeAttached();
  });

  test("custom SVG source: renders a circle element from custom SVG", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.test-sd-src-custom .eael-svg-draw-container svg circle`).first()
    ).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Animation triggers — CSS class applied to the container
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Animation triggers", () => {
  for (const [hook, animClass] of Object.entries(ANIM_MAP)) {
    test(`${animClass}: container carries class "${animClass}"`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(container(hook)).first()).toHaveClass(
        new RegExp(animClass)
      );
    });

    test(`${animClass}: SVG element is rendered`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(svg(hook)).first()).toBeAttached();
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Fill type
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Fill type", () => {
  test("fill=always: container is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-sd-fill-always")).first()).toBeVisible();
  });

  test("fill=always: data-settings contains fill_type 'always'", async ({ page }) => {
    await openPage(page);
    const raw = await page
      .locator(container("test-sd-fill-always"))
      .first()
      .getAttribute("data-settings");
    const opts = JSON.parse(raw ?? "{}");
    expect(opts.fill_type).toBe("always");
  });

  test("fill=after: data-settings contains fill_type 'after'", async ({ page }) => {
    await openPage(page);
    const raw = await page
      .locator(container("test-sd-fill-after"))
      .first()
      .getAttribute("data-settings");
    const opts = JSON.parse(raw ?? "{}");
    expect(opts.fill_type).toBe("after");
  });

  test("fill=before: data-settings contains fill_type 'before'", async ({ page }) => {
    await openPage(page);
    const raw = await page
      .locator(container("test-sd-fill-before"))
      .first()
      .getAttribute("data-settings");
    const opts = JSON.parse(raw ?? "{}");
    expect(opts.fill_type).toBe("before");
  });

  test("fill=before: container carries class 'fill-svg'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-sd-fill-before")).first()).toHaveClass(
      /fill-svg/
    );
  });

  test("fill=none (default): container does not carry class 'fill-svg'", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(container("test-sd-default")).first().getAttribute("class") ?? "";
    expect(cls).not.toContain("fill-svg");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Alignment — text-align on .eael-svg-draw-container
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Alignment", () => {
  test("default (center): container text-align is center", async ({ page }) => {
    await openPage(page);
    const ta = await page
      .locator(container("test-sd-default"))
      .first()
      .evaluate((el) => getComputedStyle(el).textAlign);
    expect(ta).toBe("center");
  });

  test("left: container text-align is left", async ({ page }) => {
    await openPage(page);
    const ta = await page
      .locator(container("test-sd-align-left"))
      .first()
      .evaluate((el) => getComputedStyle(el).textAlign);
    expect(ta).toBe("left");
  });

  test("right: container text-align is right", async ({ page }) => {
    await openPage(page);
    const ta = await page
      .locator(container("test-sd-align-right"))
      .first()
      .evaluate((el) => getComputedStyle(el).textAlign);
    expect(ta).toBe("right");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Link behaviour
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Link behaviour", () => {
  test("link widget: SVG is wrapped in an <a> tag", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(link("test-sd-link"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("A");
  });

  test("link widget: href is '#'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(link("test-sd-link")).first()).toHaveAttribute("href", "#");
  });

  test("external link: has target='_blank'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(link("test-sd-link-external")).first()).toHaveAttribute(
      "target",
      "_blank"
    );
  });

  test("external link: href points to configured URL", async ({ page }) => {
    await openPage(page);
    const href = await page
      .locator(link("test-sd-link-external"))
      .first()
      .getAttribute("href");
    expect(href).toContain("essential-addons.com");
  });

  test("no-link default widget: no <a> wrapper element", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(link("test-sd-default"))).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Element structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("container carries class 'eael-svg-draw-container'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-sd-default")).first()).toHaveClass(
      /eael-svg-draw-container/
    );
  });

  test("container has data-settings attribute with valid JSON", async ({ page }) => {
    await openPage(page);
    const raw = await page
      .locator(container("test-sd-default"))
      .first()
      .getAttribute("data-settings");
    expect(() => JSON.parse(raw ?? "")).not.toThrow();
    const opts = JSON.parse(raw ?? "{}");
    expect(typeof opts.fill_type).toBe("string");
    expect(typeof opts.loop).toBe("string");
  });

  test("SVG element is rendered as <svg> tag", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(svg("test-sd-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag.toLowerCase()).toBe("svg");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover over each widget instance triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-sd-default",
      "test-sd-src-custom",
      "test-sd-anim-none",
      "test-sd-anim-scroll",
      "test-sd-anim-hover",
      "test-sd-fill-always",
      "test-sd-fill-after",
      "test-sd-fill-before",
      "test-sd-align-left",
      "test-sd-align-right",
    ]) {
      await page.locator(container(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking link widget causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(link("test-sd-link")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});

  }
});
