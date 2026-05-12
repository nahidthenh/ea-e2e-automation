/**
 * Covered: Essential Addons — Data Table widget
 *
 * 1. Page health       — HTTP 200, no PHP errors, no JS errors
 * 2. Table structure   — wrapper, <table>, <thead>, <tbody> rendered
 * 3. Cell content      — verifiable text in header + body cells
 * 4. Alignment         — center / left / right via eael-table-align-* on wrapper
 *                        and matching class on <table> element
 * 5. Cell types        — icon cell (.eael-datatable-icon); linked text cell (<a>)
 * 6. Header icon       — .data-header-icon rendered in <th>
 * 7. Interaction       — hover (no JS errors); row hover (no JS errors)
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.DATA_TABLE_PAGE_SLUG ?? "data-table"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Data_Table::render()):
//   .{hook}                                       ← elementor-widget wrapper
//     .eael-table-align-{center|left|right}       ← alignment prefix class on wrapper
//     .eael-data-table-wrap                       ← div#eael-data-table-wrapper-{id}
//       table.tablesorter.eael-data-table.{align} ← the <table>
//         thead
//           tr.table-header
//             th
//               i.data-header-icon                ← header icon (optional)
//               span.data-table-header-text       ← header label
//         tbody
//           tr
//             td
//               .td-content-wrapper
//                 .td-content                     ← plain textarea text
//                 .eael-datatable-icon.td-content ← icon cell
//                 a                               ← linked text cell

const wrap  = (hook: string) => `.${hook} .eael-data-table-wrap`;
const table = (hook: string) => `.${hook} .eael-data-table`;
const thead = (hook: string) => `.${hook} .eael-data-table thead`;
const tbody = (hook: string) => `.${hook} .eael-data-table tbody`;
const thText = (hook: string) => `.${hook} .data-table-header-text`;

// ── alignment → CSS class on widget wrapper ────────────────────────────────
const ALIGN_MAP: Record<string, string> = {
  "test-dt-default":     "eael-table-align-center",
  "test-dt-align-left":  "eael-table-align-left",
  "test-dt-align-right": "eael-table-align-right",
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
// 2. Table structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Table structure", () => {
  test("wrapper .eael-data-table-wrap is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrap("test-dt-default")).first()).toBeVisible();
  });

  test("table element .eael-data-table is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(table("test-dt-default")).first()).toBeVisible();
  });

  test("table has .tablesorter class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(table("test-dt-default")).first()).toHaveClass(
      /tablesorter/
    );
  });

  test("thead with .table-header row is rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-dt-default .eael-data-table tr.table-header").first()
    ).toBeVisible();
  });

  test("tbody is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(tbody("test-dt-default")).first()).toBeAttached();
  });

  test("wrapper has data-table_id attribute", async ({ page }) => {
    await openPage(page);
    const attr = await page
      .locator(wrap("test-dt-default"))
      .first()
      .getAttribute("data-table_id");
    expect(attr).toBeTruthy();
  });

  test("table element id starts with eael-data-table-", async ({ page }) => {
    await openPage(page);
    const id = await page
      .locator(table("test-dt-default"))
      .first()
      .getAttribute("id");
    expect(id).toMatch(/^eael-data-table-/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Cell content — verifiable text
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Cell content", () => {
  test("header renders 'Name' column", async ({ page }) => {
    await openPage(page);
    const headerTexts = await page
      .locator(".test-dt-default .data-table-header-text")
      .allTextContents();
    expect(headerTexts.map((t) => t.trim())).toContain("Name");
  });

  test("header renders 'Role' column", async ({ page }) => {
    await openPage(page);
    const headerTexts = await page
      .locator(".test-dt-default .data-table-header-text")
      .allTextContents();
    expect(headerTexts.map((t) => t.trim())).toContain("Role");
  });

  test("header renders 'Status' column", async ({ page }) => {
    await openPage(page);
    const headerTexts = await page
      .locator(".test-dt-default .data-table-header-text")
      .allTextContents();
    expect(headerTexts.map((t) => t.trim())).toContain("Status");
  });

  test("body renders 'Alice' cell text", async ({ page }) => {
    await openPage(page);
    const bodyText = await page
      .locator(".test-dt-default .eael-data-table tbody")
      .first()
      .textContent();
    expect(bodyText).toContain("Alice");
  });

  test("body renders 'Developer' cell text", async ({ page }) => {
    await openPage(page);
    const bodyText = await page
      .locator(".test-dt-default .eael-data-table tbody")
      .first()
      .textContent();
    expect(bodyText).toContain("Developer");
  });

  test("body renders 'Bob' and 'Inactive' in second row", async ({ page }) => {
    await openPage(page);
    const bodyText = await page
      .locator(".test-dt-default .eael-data-table tbody")
      .first()
      .textContent();
    expect(bodyText).toContain("Bob");
    expect(bodyText).toContain("Inactive");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Alignment
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Alignment", () => {
  for (const [hook, alignClass] of Object.entries(ALIGN_MAP)) {
    test(`${hook}: widget wrapper has class "${alignClass}"`, async ({ page }) => {
      await openPage(page);
      const cls = await page.locator(`.${hook}`).first().getAttribute("class");
      expect(cls, `Expected "${alignClass}" in: "${cls}"`).toContain(alignClass);
    });

    test(`${hook}: table element carries matching alignment value`, async ({ page }) => {
      await openPage(page);
      const alignValue = alignClass.replace("eael-table-align-", "");
      await expect(page.locator(table(hook)).first()).toHaveClass(
        new RegExp(alignValue)
      );
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Cell types — icon and linked text
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Cell types — icon", () => {
  test("test-dt-icon-cell: .eael-datatable-icon is rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-dt-icon-cell .eael-datatable-icon").first()
    ).toBeAttached();
  });

  test("test-dt-icon-cell: icon cell contains an <svg> or <i> element", async ({ page }) => {
    await openPage(page);
    const iconCell = page.locator(".test-dt-icon-cell .eael-datatable-icon").first();
    const hasSvg = await iconCell.locator("svg").count();
    const hasI   = await iconCell.locator("i").count();
    expect(hasSvg + hasI, "Expected svg or i inside .eael-datatable-icon").toBeGreaterThan(0);
  });

  test("test-dt-icon-cell: 'Verified' text cell is visible", async ({ page }) => {
    await openPage(page);
    const bodyText = await page
      .locator(".test-dt-icon-cell .eael-data-table tbody")
      .first()
      .textContent();
    expect(bodyText).toContain("Verified");
  });
});

test.describe("Cell types — linked text", () => {
  test("test-dt-link-cell: linked cell contains an <a> tag", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-dt-link-cell .eael-data-table tbody td a").first()
    ).toBeVisible();
  });

  test("test-dt-link-cell: link text is 'Visit'", async ({ page }) => {
    await openPage(page);
    const linkText = await page
      .locator(".test-dt-link-cell .eael-data-table tbody td a")
      .first()
      .textContent();
    expect(linkText?.trim()).toBe("Visit");
  });

  test("test-dt-link-cell: link href is '#'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-dt-link-cell .eael-data-table tbody td a").first()
    ).toHaveAttribute("href", "#");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Header icon
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Header icon", () => {
  test("test-dt-header-icon: .data-header-icon is rendered in th", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-dt-header-icon thead th .data-header-icon").first()
    ).toBeAttached();
  });

  test("test-dt-header-icon: header text 'Name' is still visible", async ({ page }) => {
    await openPage(page);
    const headerTexts = await page
      .locator(".test-dt-header-icon .data-table-header-text")
      .allTextContents();
    expect(headerTexts.map((t) => t.trim())).toContain("Name");
  });

  test("test-dt-header-icon: 'Charlie' body cell text is visible", async ({ page }) => {
    await openPage(page);
    const bodyText = await page
      .locator(".test-dt-header-icon .eael-data-table tbody")
      .first()
      .textContent();
    expect(bodyText).toContain("Charlie");
  });

  test("test-dt-default: no .data-header-icon when header icon disabled", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-dt-default thead th .data-header-icon")
    ).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover over table rows triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    const rows = page.locator(".test-dt-default .eael-data-table tbody tr");
    const count = await rows.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      await rows.nth(i).hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover over header cells triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    const ths = page.locator(".test-dt-default .eael-data-table thead th");
    const count = await ths.count();
    for (let i = 0; i < count; i++) {
      await ths.nth(i).hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("linked cell click triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page
      .locator(".test-dt-link-cell .eael-data-table tbody td a")
      .first()
      .click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
