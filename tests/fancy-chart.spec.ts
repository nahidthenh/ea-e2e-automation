import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.FANCY_CHART_PAGE_SLUG ?? "fancy-chart"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Fancy_Chart::render()):
//   .{hook}                                           ← elementor-widget wrapper
//     .eael_fanct_chart_wrapper                       ← outer wrapper (note typo: fanct)
//       [data-options='{"chart":{"type":"bar",...}}'] ← full ApexCharts config JSON
//       .eael_fancy_chart_header                      ← title + description area
//         h4.eael_fancy_chart_title                   ← title (tag varies by eael_fancy_chart_title_tag)
//         p                                           ← description
//       .eael_fancy_chart                             ← chart container div
//         #eael_fancy_chart-{id}                      ← same div, ApexCharts SVG rendered here by JS

const wrapper = (hook: string) => `.${hook} .eael_fanct_chart_wrapper`;
const header = (hook: string) => `.${hook} .eael_fancy_chart_header`;
const titleEl = (hook: string) => `.${hook} .eael_fancy_chart_title`;
const descEl = (hook: string) => `.${hook} .eael_fancy_chart_header p`;
const chartContainer = (hook: string) => `.${hook} .eael_fancy_chart`;

// ── chart style → ApexCharts type value ───────────────────────────────────
const CHART_STYLE_MAP: Record<string, string> = {
  "test-fc-default": "bar",
  "test-fc-area": "area",
  "test-fc-line": "line",
  "test-fc-radar": "radar",
  "test-fc-pie": "pie",
  "test-fc-donut": "donut",
  "test-fc-polar": "polarArea",
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
// 2. Chart styles — wrapper and data-options type
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Chart styles", () => {
  for (const [hook, chartType] of Object.entries(CHART_STYLE_MAP)) {
    test(`${chartType} — wrapper is attached`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrapper(hook)).first()).toBeAttached();
    });

    test(`${chartType} — data-options encodes chart.type="${chartType}"`, async ({
      page,
    }) => {
      await openPage(page);
      const raw = await page
        .locator(wrapper(hook))
        .first()
        .getAttribute("data-options");
      const opts = JSON.parse(raw ?? "{}");
      expect(opts?.chart?.type).toBe(chartType);
    });

    test(`${chartType} — chart container div is present`, async ({ page }) => {
      await openPage(page);
      await expect(
        page.locator(chartContainer(hook)).first()
      ).toBeAttached();
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Widget structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Widget structure", () => {
  test("header area is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(header("test-fc-default")).first()).toBeAttached();
  });

  test("title renders when eael_fancy_chart_title is set", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(titleEl("test-fc-default")).first()).toBeVisible();
  });

  test("title text matches eael_fancy_chart_title setting", async ({ page }) => {
    await openPage(page);
    const text = await page
      .locator(titleEl("test-fc-default"))
      .first()
      .textContent();
    expect(text?.trim()).toBe("Sample Chart Title");
  });

  test("description renders when eael_fancy_chart_des is set", async ({
    page,
  }) => {
    await openPage(page);
    await expect(page.locator(descEl("test-fc-default")).first()).toBeVisible();
  });

  test("description text matches eael_fancy_chart_des setting", async ({
    page,
  }) => {
    await openPage(page);
    const text = await page
      .locator(descEl("test-fc-default"))
      .first()
      .textContent();
    expect(text?.trim()).toBe("Sample chart description");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Title tag
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Title tag", () => {
  test("default title renders as <h4>", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(titleEl("test-fc-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H4");
  });

  test("title renders as <h2> when eael_fancy_chart_title_tag=h2", async ({
    page,
  }) => {
    await openPage(page);
    const tag = await page
      .locator(titleEl("test-fc-title-h2"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H2");
  });

  test("h2 title text matches custom title setting", async ({ page }) => {
    await openPage(page);
    const text = await page
      .locator(titleEl("test-fc-title-h2"))
      .first()
      .textContent();
    expect(text?.trim()).toBe("H2 Title Chart");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Display toggles — legend and toolbar
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Display toggles — legend", () => {
  test("legend show=true is encoded in data-options", async ({ page }) => {
    await openPage(page);
    const raw = await page
      .locator(wrapper("test-fc-default"))
      .first()
      .getAttribute("data-options");
    const opts = JSON.parse(raw ?? "{}");
    const show = opts?.legend?.show ?? true;
    expect(show).toBe(true);
  });

  test("legend show=false when eael_fancy_chart_legend_show=''", async ({
    page,
  }) => {
    await openPage(page);
    const raw = await page
      .locator(wrapper("test-fc-no-legend"))
      .first()
      .getAttribute("data-options");
    const opts = JSON.parse(raw ?? "{}");
    expect(opts?.legend?.show).toBe(false);
  });
});

test.describe("Display toggles — toolbar", () => {
  test("toolbar show=true is encoded in data-options", async ({ page }) => {
    await openPage(page);
    const raw = await page
      .locator(wrapper("test-fc-default"))
      .first()
      .getAttribute("data-options");
    const opts = JSON.parse(raw ?? "{}");
    const show = opts?.chart?.toolbar?.show ?? true;
    expect(show).toBe(true);
  });

  test("toolbar show=false when eael_fancy_chart_toolbar_show=''", async ({
    page,
  }) => {
    await openPage(page);
    const raw = await page
      .locator(wrapper("test-fc-no-toolbar"))
      .first()
      .getAttribute("data-options");
    const opts = JSON.parse(raw ?? "{}");
    expect(opts?.chart?.toolbar?.show).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover on each widget instance triggers no JS errors", async ({
    page,
  }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-fc-default",
      "test-fc-area",
      "test-fc-line",
      "test-fc-radar",
      "test-fc-pie",
      "test-fc-donut",
      "test-fc-polar",
      "test-fc-title-h2",
      "test-fc-no-legend",
      "test-fc-no-toolbar",
    ]) {
      const el = page.locator(wrapper(hook)).first();
      if (await el.count()) {
        await el.hover();
        await page.waitForTimeout(150);
      }
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("ApexCharts SVG renders inside chart container", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-fc-default .eael_fancy_chart svg").first()
    ).toBeAttached();
  });
});

  }
});
