import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.FEATURE_LIST_PAGE_SLUG ?? "feature-list"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Feature_List::render()):
//   .{hook}                                    ← elementor-widget wrapper
//     div.-icon-position-{left|top|right}      ← wrapper with icon position class
//       ul.eael-feature-list-items             ← list root
//         li.eael-feature-list-item            ← per-item
//           span.connector                     (only when connector=yes)
//           div.eael-feature-list-icon-box
//             div.eael-feature-list-icon-inner
//               a|span.eael-feature-list-icon  ← 'a' when item has a link, 'span' otherwise
//                 i / svg                      ← icon (type=icon)
//                 img.eael-feature-list-img    ← (type=image)
//           div.eael-feature-list-content-box
//             {h2}.eael-feature-list-title     ← configurable tag, default h2
//             p.eael-feature-list-content

const list   = (hook: string) => `.${hook} .eael-feature-list-items`;
const item   = (hook: string) => `.${hook} .eael-feature-list-item`;
const icon   = (hook: string) => `.${hook} .eael-feature-list-icon`;
const title  = (hook: string) => `.${hook} .eael-feature-list-title`;
const desc   = (hook: string) => `.${hook} .eael-feature-list-content`;

// ── known shape / shape-view values ──────────────────────────────────────
const FREE_SHAPES      = ["circle", "square", "rhombus"] as const;
const SHAPE_VIEWS      = ["stacked", "framed"] as const;

// ── helpers ───────────────────────────────────────────────────────────────

async function openPage(page: Page) {
  await page.goto(PAGE_URL, { waitUntil: "domcontentloaded" });
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
// 2. Layout variants
// ══════════════════════════════════════════════════════════════════════════

test.describe("Layout variants", () => {
  const layoutMap: Record<string, string> = {
    "test-fl-default":          "eael-feature-list-vertical",
    "test-fl-layout-horizontal": "eael-feature-list-horizontal",
  };

  for (const [hook, layoutClass] of Object.entries(layoutMap)) {
    test(`${layoutClass} list is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(list(hook)).first()).toBeVisible();
    });

    test(`${layoutClass} applies correct CSS class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(list(hook)).first()).toHaveClass(
        new RegExp(layoutClass)
      );
    });

    test(`${layoutClass} renders three items`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(item(hook))).toHaveCount(3);
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 3. Icon position
// ══════════════════════════════════════════════════════════════════════════

test.describe("Icon position", () => {
  const positionMap: Record<string, string> = {
    "test-fl-default":   "-icon-position-left",
    "test-fl-icon-top":  "-icon-position-top",
    "test-fl-icon-right": "-icon-position-right",
  };

  for (const [hook, posClass] of Object.entries(positionMap)) {
    test(`${posClass} wrapper class is present`, async ({ page }) => {
      await openPage(page);
      const wrapper = page.locator(`.${hook} > div`).first();
      await expect(wrapper).toHaveClass(new RegExp(posClass));
    });

    test(`${posClass} icon box is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(`${item(hook)} .eael-feature-list-icon-box`).first()).toBeVisible();
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 4. Icon shape
// ══════════════════════════════════════════════════════════════════════════

test.describe("Icon shape", () => {
  const shapeMap: Record<string, string> = {
    "test-fl-default":       "circle",
    "test-fl-shape-square":  "square",
    "test-fl-shape-rhombus": "rhombus",
  };

  for (const [hook, shapeClass] of Object.entries(shapeMap)) {
    test(`shape ${shapeClass} applies CSS class to list`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(list(hook)).first()).toHaveClass(
        new RegExp(shapeClass)
      );
    });

    test(`shape ${shapeClass} — icons are visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(icon(hook)).first()).toBeVisible();
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 5. Shape view (framed vs stacked)
// ══════════════════════════════════════════════════════════════════════════

test.describe("Shape view", () => {
  const viewMap: Record<string, string> = {
    "test-fl-default":    "stacked",
    "test-fl-view-framed": "framed",
  };

  for (const [hook, viewClass] of Object.entries(viewMap)) {
    test(`view ${viewClass} applies CSS class to list`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(list(hook)).first()).toHaveClass(
        new RegExp(viewClass)
      );
    });
  }

  test("framed: icon-inner wrapper is present", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-fl-view-framed .eael-feature-list-icon-inner").first()
    ).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 6. Connector
// ══════════════════════════════════════════════════════════════════════════

test.describe("Connector", () => {
  test("classic connector: .connector span is rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-fl-connector-classic .eael-feature-list-item .connector").first()
    ).toBeAttached();
  });

  test("classic connector: list has connector-type-classic class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(list("test-fl-connector-classic")).first()).toHaveClass(
      /connector-type-classic/
    );
  });

  test("modern connector: list has connector-type-modern class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(list("test-fl-connector-modern")).first()).toHaveClass(
      /connector-type-modern/
    );
  });

  test("default (no connector): no .connector span in items", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-fl-default .eael-feature-list-item .connector")
    ).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 7. Icon type — image
// ══════════════════════════════════════════════════════════════════════════

test.describe("Icon type — image", () => {
  test("image-type items render .eael-feature-list-img", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-fl-icon-image .eael-feature-list-img").first()
    ).toBeAttached();
  });

  test("image-type list renders two items", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(item("test-fl-icon-image"))).toHaveCount(2);
  });

  test("image-type item titles are visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(title("test-fl-icon-image")).first()).toBeVisible();
    const text = await page.locator(title("test-fl-icon-image")).first().textContent();
    expect(text?.trim()).toContain("Image Feature Alpha");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 8. Link behaviour
// ══════════════════════════════════════════════════════════════════════════

test.describe("Link behaviour", () => {
  test("external link: icon anchor has target='_blank'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-fl-link-external .eael-feature-list-icon").first()
    ).toHaveAttribute("target", "_blank");
  });

  test("external link: title anchor has target='_blank'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-fl-link-external .eael-feature-list-title a").first()
    ).toHaveAttribute("target", "_blank");
  });

  test("external link: href points to configured URL", async ({ page }) => {
    await openPage(page);
    const href = await page
      .locator(".test-fl-link-external .eael-feature-list-title a")
      .first()
      .getAttribute("href");
    expect(href).toContain("essential-addons.com");
  });

  test("nofollow link: title anchor has rel containing 'nofollow'", async ({ page }) => {
    await openPage(page);
    const rel = await page
      .locator(".test-fl-link-nofollow .eael-feature-list-title a")
      .first()
      .getAttribute("rel");
    expect(rel).toContain("nofollow");
  });

  test("default (no link): icon rendered as <span> not <a>", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(icon("test-fl-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("SPAN");
  });

  test("linked items: icon rendered as <a>", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(".test-fl-link-external .eael-feature-list-icon")
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("A");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 9. Title HTML tag
// ══════════════════════════════════════════════════════════════════════════

test.describe("Title HTML tag", () => {
  test("default: title rendered as <h2>", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(title("test-fl-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H2");
  });

  test("custom tag h3: title rendered as <h3>", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(title("test-fl-title-tag-h3"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H3");
  });

  test("title text content is verifiable", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(title("test-fl-default")).first().textContent();
    expect(text?.trim()).toBe("Feature Alpha");
  });

  test("description text content is rendered", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(desc("test-fl-default")).first().textContent();
    expect(text?.trim()).toBe("Alpha feature description text.");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 10. Element structure
// ══════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("icon-box wrapper is present on default widget", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-fl-default .eael-feature-list-icon-box").first()
    ).toBeAttached();
  });

  test("icon-inner wrapper is present on default widget", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-fl-default .eael-feature-list-icon-inner").first()
    ).toBeAttached();
  });

  test("content-box wrapper is present on default widget", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-fl-default .eael-feature-list-content-box").first()
    ).toBeAttached();
  });

  test("list is a <ul> element", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(list("test-fl-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("UL");
  });

  test("items are <li> elements", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(item("test-fl-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("LI");
  });

  test("default widget shape class is one of the known free shapes", async ({ page }) => {
    await openPage(page);
    const cls = (await page.locator(list("test-fl-default")).first().getAttribute("class")) ?? "";
    const hasShape = FREE_SHAPES.some((s) => cls.includes(s));
    expect(hasShape, `Unknown shape in: "${cls}"`).toBe(true);
  });

  test("default widget shape-view class is one of the known views", async ({ page }) => {
    await openPage(page);
    const cls = (await page.locator(list("test-fl-default")).first().getAttribute("class")) ?? "";
    const hasView = SHAPE_VIEWS.some((v) => cls.includes(v));
    expect(hasView, `Unknown shape-view in: "${cls}"`).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 11. Interaction
// ══════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("linked icon is keyboard-focusable", async ({ page }) => {
    await openPage(page);
    const anchor = page.locator(".test-fl-link-external .eael-feature-list-icon").first();
    await anchor.focus();
    await expect(anchor).toBeFocused();
  });

  test("hover on each widget instance triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-fl-default",
      "test-fl-layout-horizontal",
      "test-fl-icon-top",
      "test-fl-icon-right",
      "test-fl-shape-square",
      "test-fl-shape-rhombus",
      "test-fl-view-framed",
      "test-fl-connector-classic",
      "test-fl-connector-modern",
    ]) {
      await page.locator(item(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking default item title causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(title("test-fl-default")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
