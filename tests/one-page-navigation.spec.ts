import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.ONE_PAGE_NAVIGATION_PAGE_SLUG ?? "one-page-navigation"}/`;

// ── selectors ─────────────────────────────────────────────────────────────────
// DOM shape (from One_Page_Navigation::render()):
//   .{hook}                              ← elementor-widget wrapper (also gets nav-align-{value})
//     .eael-one-page-nav-container
//       ul.eael-one-page-nav             ← data-scroll-wheel, data-scroll-keys, data-section-ids, etc.
//         li.eael-one-page-nav-item
//           span.eael-nav-dot-tooltip    ← present only when nav_tooltip='yes'
//             span.eael-nav-dot-tooltip-content ← section_title text
//           a[href="#"][data-row-id="{section_id}"]
//             span.eael-nav-dot-wrap
//               i.eael-nav-dot / svg

const container = (hook: string) => `.${hook} .eael-one-page-nav-container`;
const nav       = (hook: string) => `.${hook} .eael-one-page-nav`;
const items     = (hook: string) => `.${hook} .eael-one-page-nav-item`;
const dotWrap   = (hook: string) => `.${hook} .eael-nav-dot-wrap`;
const tooltip   = (hook: string) => `.${hook} .eael-nav-dot-tooltip`;
const tooltipContent = (hook: string) => `.${hook} .eael-nav-dot-tooltip-content`;

// ── alignment prefix classes (added to {{WRAPPER}} via prefix_class) ──────────
const ALIGN_MAP: Record<string, string> = {
  "test-opn-align-right":  "nav-align-right",
  "test-opn-align-left":   "nav-align-left",
  "test-opn-align-top":    "nav-align-top",
  "test-opn-align-bottom": "nav-align-bottom",
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
// 2. Default widget — baseline smoke test
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Default widget", () => {
  const hook = "test-opn-default";

  test("nav container is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container(hook)).first()).toBeVisible();
  });

  test("nav list is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(nav(hook)).first()).toBeVisible();
  });

  test("renders 3 nav items", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(items(hook))).toHaveCount(3);
  });

  test("each item contains a dot wrap", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(dotWrap(hook)).count();
    expect(count).toBe(3);
  });

  test("each item anchor has data-row-id attribute", async ({ page }) => {
    await openPage(page);
    const anchors = page.locator(`${items(hook)} a[data-row-id]`);
    await expect(anchors).toHaveCount(3);
  });

  test("data-row-id values match configured section IDs", async ({ page }) => {
    await openPage(page);
    const anchors = page.locator(`${items(hook)} a[data-row-id]`);
    const ids = await anchors.evaluateAll((els) =>
      els.map((el) => el.getAttribute("data-row-id"))
    );
    expect(ids).toEqual(["section-one", "section-two", "section-three"]);
  });

  test("nav list has data-scroll-wheel attribute", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(nav(hook)).first()).toHaveAttribute("data-scroll-wheel", /.*/);
  });

  test("nav list has data-section-ids attribute with JSON array", async ({ page }) => {
    await openPage(page);
    const raw = await page.locator(nav(hook)).first().getAttribute("data-section-ids");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Alignment variants
//    heading_alignment sets nav-align-{value} on the Elementor widget wrapper.
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Alignment variants", () => {
  for (const [hook, alignClass] of Object.entries(ALIGN_MAP)) {
    test(`${alignClass} class is applied to the widget wrapper`, async ({ page }) => {
      await openPage(page);
      // The Elementor wrapper is the ancestor of .eael-one-page-nav-container
      const wrapper = page.locator(`.${hook}`).first();
      await expect(wrapper).toHaveClass(new RegExp(alignClass));
    });

    test(`${alignClass} nav container is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(container(hook)).first()).toBeVisible();
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Tooltip behaviour
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Tooltip behaviour", () => {
  test("tooltip-on: tooltip span is rendered for each item", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(tooltip("test-opn-default")).count();
    expect(count).toBe(3);
  });

  test("tooltip-on: tooltip content shows section title text", async ({ page }) => {
    await openPage(page);
    const content = await page.locator(tooltipContent("test-opn-default")).first().textContent();
    expect(content?.trim()).toBe("Section One");
  });

  test("tooltip-on with arrow: tooltip has eael-tooltip-arrow class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(tooltip("test-opn-default")).first()).toHaveClass(
      /eael-tooltip-arrow/
    );
  });

  test("tooltip-off: no tooltip span rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(tooltip("test-opn-tooltip-off"))).toHaveCount(0);
  });

  test("tooltip-arrow-off: tooltip present but no eael-tooltip-arrow class", async ({ page }) => {
    await openPage(page);
    const tooltipEl = page.locator(tooltip("test-opn-tooltip-arrow-off")).first();
    await expect(tooltipEl).toBeAttached();
    const cls = await tooltipEl.getAttribute("class") ?? "";
    expect(cls).not.toContain("eael-tooltip-arrow");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Scroll behaviour — data-* attributes reflect control values
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Scroll behaviour attributes", () => {
  test("scroll-wheel-on: data-scroll-wheel is 'on'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(nav("test-opn-scroll-wheel-on")).first()).toHaveAttribute(
      "data-scroll-wheel",
      "on"
    );
  });

  test("default: data-scroll-wheel is not 'on'", async ({ page }) => {
    await openPage(page);
    const val = await page.locator(nav("test-opn-default")).first().getAttribute("data-scroll-wheel");
    expect(val).not.toBe("on");
  });

  test("scroll-keys-on: data-scroll-keys is 'on'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(nav("test-opn-scroll-keys-on")).first()).toHaveAttribute(
      "data-scroll-keys",
      "on"
    );
  });

  test("default: data-scroll-keys is not 'on'", async ({ page }) => {
    await openPage(page);
    const val = await page.locator(nav("test-opn-default")).first().getAttribute("data-scroll-keys");
    expect(val).not.toBe("on");
  });

  test("default: data-scroll-speed reflects configured value", async ({ page }) => {
    await openPage(page);
    const speed = await page.locator(nav("test-opn-default")).first().getAttribute("data-scroll-speed");
    expect(Number(speed)).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Element structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("nav is rendered as a <ul> element", async ({ page }) => {
    await openPage(page);
    const tag = await page.locator(nav("test-opn-default")).first().evaluate((el) => el.tagName);
    expect(tag).toBe("UL");
  });

  test("each nav item is a <li> element", async ({ page }) => {
    await openPage(page);
    const tag = await page.locator(items("test-opn-default")).first().evaluate((el) => el.tagName);
    expect(tag).toBe("LI");
  });

  test("each item anchor href is '#'", async ({ page }) => {
    await openPage(page);
    const anchors = page.locator(`${items("test-opn-default")} a`);
    const hrefs = await anchors.evaluateAll((els) => els.map((el) => el.getAttribute("href")));
    expect(hrefs.every((h) => h === "#")).toBe(true);
  });

  test("nav list has a unique id starting with 'eael-one-page-nav-'", async ({ page }) => {
    await openPage(page);
    const id = await page.locator(nav("test-opn-default")).first().getAttribute("id");
    expect(id).toMatch(/^eael-one-page-nav-/);
  });

  test("dot wrap is present inside each anchor", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`${items("test-opn-default")} a .eael-nav-dot-wrap`).first()
    ).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("first nav item anchor is keyboard-focusable", async ({ page }) => {
    await openPage(page);
    const anchor = page.locator(`${items("test-opn-default")} a`).first();
    await anchor.focus();
    await expect(anchor).toBeFocused();
  });

  test("hover over each nav item triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-opn-default",
      "test-opn-align-left",
      "test-opn-tooltip-off",
      "test-opn-scroll-wheel-on",
    ]) {
      const allItems = page.locator(items(hook));
      const count = await allItems.count();
      for (let i = 0; i < count; i++) {
        // force: true — fixed-position widget instances overlap each other on the test page
        await allItems.nth(i).hover({ force: true });
        await page.waitForTimeout(150);
      }
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking a nav dot causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    // force: true — fixed-position widget instances overlap each other on the test page
    await page.locator(`${items("test-opn-default")} a`).first().click({ force: true });
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Visual regression
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Visual regression", () => {
  const HOOKS = [
    "test-opn-default",
    "test-opn-align-right",
    "test-opn-align-left",
    "test-opn-align-top",
    "test-opn-align-bottom",
    "test-opn-tooltip-off",
    "test-opn-tooltip-arrow-off",
    "test-opn-scroll-wheel-on",
    "test-opn-scroll-keys-on",
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
