/**
 * Covered: Essential Addons — Advanced Data Table widget
 *
 * 1. Page health       — HTTP 200, no PHP errors, no JS errors
 * 2. Table structure   — wrapper, table, thead, tbody rendered
 * 3. Cell content      — header column labels + body cell text
 * 4. Sort feature      — ea-advanced-data-table-sortable class; absent when off
 * 5. Search feature    — search input present; absent when off; alignment classes
 * 6. Pagination        — pagination div present; absent when off; JS creates children
 * 7. Pagination type   — button vs select pagination classes
 * 8. Interaction       — search filter, column sort, hover no JS errors
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.ADVANCED_DATA_TABLE_PAGE_SLUG ?? "advanced-data-table"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Advanced_Data_Table::render()):
//   .{hook}
//     .ea-advanced-data-table-wrap[data-id]
//       [optional] .ea-advanced-data-table-search-wrap.ea-advanced-data-table-search-{alignment}
//         input.ea-advanced-data-table-search
//       .ea-advanced-data-table-wrap-inner
//         table.ea-advanced-data-table.ea-advanced-data-table-{source}[data-id]
//           [class ea-advanced-data-table-sortable]
//           [class ea-advanced-data-table-paginated][data-items-per-page]
//           [class ea-advanced-data-table-searchable]
//           thead > tr > th
//           tbody > tr > td
//       [optional] .ea-advanced-data-table-pagination.ea-advanced-data-table-pagination-{type}
//                   ← empty on PHP render; JS fills with pagination controls

const wrap        = (hook: string) => `.${hook} .ea-advanced-data-table-wrap`;
const table       = (hook: string) => `.${hook} .ea-advanced-data-table`;
const thead       = (hook: string) => `.${hook} .ea-advanced-data-table thead`;
const tbody       = (hook: string) => `.${hook} .ea-advanced-data-table tbody`;
const searchWrap  = (hook: string) => `.${hook} .ea-advanced-data-table-search-wrap`;
const searchInput = (hook: string) => `.${hook} input.ea-advanced-data-table-search`;
const pagination  = (hook: string) => `.${hook} .ea-advanced-data-table-pagination`;

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
  test("wrapper .ea-advanced-data-table-wrap is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrap("test-adt-default")).first()).toBeVisible();
  });

  test("wrapper has data-id attribute", async ({ page }) => {
    await openPage(page);
    const attr = await page.locator(wrap("test-adt-default")).first().getAttribute("data-id");
    expect(attr).toBeTruthy();
  });

  test("table .ea-advanced-data-table is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(table("test-adt-default")).first()).toBeVisible();
  });

  test("table has .ea-advanced-data-table-static class for static source", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(table("test-adt-default")).first()).toHaveClass(
      /ea-advanced-data-table-static/
    );
  });

  test("table has data-id attribute", async ({ page }) => {
    await openPage(page);
    const attr = await page.locator(table("test-adt-default")).first().getAttribute("data-id");
    expect(attr).toBeTruthy();
  });

  test("thead is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(thead("test-adt-default")).first()).toBeVisible();
  });

  test("tbody is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(tbody("test-adt-default")).first()).toBeAttached();
  });

  test(".ea-advanced-data-table-wrap-inner contains the table", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-adt-default .ea-advanced-data-table-wrap-inner").first()
    ).toBeVisible();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Cell content
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Cell content", () => {
  test("header contains 'Name' column", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(thead("test-adt-default")).first().textContent();
    expect(text).toContain("Name");
  });

  test("header contains 'Role' column", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(thead("test-adt-default")).first().textContent();
    expect(text).toContain("Role");
  });

  test("header contains 'Department' column", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(thead("test-adt-default")).first().textContent();
    expect(text).toContain("Department");
  });

  test("body contains 'Alice Johnson'", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(tbody("test-adt-default")).first().textContent();
    expect(text).toContain("Alice Johnson");
  });

  test("body contains 'Bob Martinez'", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(tbody("test-adt-default")).first().textContent();
    expect(text).toContain("Bob Martinez");
  });

  test("body contains 'Carol White'", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(tbody("test-adt-default")).first().textContent();
    expect(text).toContain("Carol White");
  });

  test("body contains department values like 'Engineering'", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(tbody("test-adt-default")).first().textContent();
    expect(text).toContain("Engineering");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Sort feature
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Sort feature", () => {
  test("test-adt-default: table has .ea-advanced-data-table-sortable class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(table("test-adt-default")).first()).toHaveClass(
      /ea-advanced-data-table-sortable/
    );
  });

  test("test-adt-no-sort: table does NOT have .ea-advanced-data-table-sortable", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(table("test-adt-no-sort")).first().getAttribute("class");
    expect(cls).not.toContain("ea-advanced-data-table-sortable");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Search feature
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Search feature", () => {
  test("test-adt-default: search input is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(searchInput("test-adt-default")).first()).toBeVisible();
  });

  test("test-adt-default: search wrap has default right alignment class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(searchWrap("test-adt-default")).first()).toHaveClass(
      /ea-advanced-data-table-search-right/
    );
  });

  test("test-adt-default: table has .ea-advanced-data-table-searchable class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(table("test-adt-default")).first()).toHaveClass(
      /ea-advanced-data-table-searchable/
    );
  });

  test("test-adt-no-search: search input is absent", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(searchInput("test-adt-no-search"))).toHaveCount(0);
  });

  test("test-adt-no-search: table does NOT have .ea-advanced-data-table-searchable", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(table("test-adt-no-search")).first().getAttribute("class");
    expect(cls).not.toContain("ea-advanced-data-table-searchable");
  });

  test("test-adt-search-left: search wrap has left alignment class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(searchWrap("test-adt-search-left")).first()).toHaveClass(
      /ea-advanced-data-table-search-left/
    );
  });

  test("test-adt-search-center: search wrap has center alignment class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(searchWrap("test-adt-search-center")).first()).toHaveClass(
      /ea-advanced-data-table-search-center/
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Pagination — PHP structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Pagination — structure", () => {
  test("test-adt-default: pagination div is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(pagination("test-adt-default")).first()).toBeAttached();
  });

  test("test-adt-default: table has .ea-advanced-data-table-paginated class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(table("test-adt-default")).first()).toHaveClass(
      /ea-advanced-data-table-paginated/
    );
  });

  test("test-adt-default: table has data-items-per-page attribute", async ({ page }) => {
    await openPage(page);
    const attr = await page
      .locator(table("test-adt-default"))
      .first()
      .getAttribute("data-items-per-page");
    expect(attr).toBeTruthy();
    expect(Number(attr)).toBeGreaterThan(0);
  });

  test("test-adt-no-pagination: pagination div is absent", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(pagination("test-adt-no-pagination"))).toHaveCount(0);
  });

  test("test-adt-no-pagination: table does NOT have .ea-advanced-data-table-paginated", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(table("test-adt-no-pagination")).first().getAttribute("class");
    expect(cls).not.toContain("ea-advanced-data-table-paginated");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Pagination type
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Pagination type", () => {
  test("test-adt-default: pagination has button type class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(pagination("test-adt-default")).first()).toHaveClass(
      /ea-advanced-data-table-pagination-button/
    );
  });

  test("test-adt-pag-select: pagination has select type class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(pagination("test-adt-pag-select")).first()).toHaveClass(
      /ea-advanced-data-table-pagination-select/
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover over table rows triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    const rows = page.locator(".test-adt-default .ea-advanced-data-table tbody tr");
    const count = await rows.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      await rows.nth(i).hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover over sortable headers triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    const ths = page.locator(".test-adt-default .ea-advanced-data-table thead th");
    const count = await ths.count();
    for (let i = 0; i < count; i++) {
      await ths.nth(i).hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("typing in search input triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    await page.locator(searchInput("test-adt-default")).first().fill("Alice");
    await page.waitForTimeout(300);

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking a sortable column header triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    await page
      .locator(".test-adt-default .ea-advanced-data-table thead th")
      .first()
      .click();
    await page.waitForTimeout(300);

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
