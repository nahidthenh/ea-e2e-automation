/**
 * Covered: Essential Addons — Event Calendar widget
 *
 * 1. Page health       — HTTP 200, no PHP errors, no JS errors
 * 2. Calendar layout   — .layout-calendar wrapper, .eael-event-calendar-cls div rendered
 * 3. FullCalendar init — .fc element appears after JS init; toolbar present
 * 4. Calendar views    — data-defaultview attribute matches configured view
 * 5. Table layout      — .layout-table wrapper, <table> with thead/tbody rendered
 * 6. Table content     — event titles appear in tbody
 * 7. Table columns     — Title / Description / Date headers; column hidden when off
 * 8. Search control    — search input rendered when enabled, absent when disabled
 * 9. Pagination        — .eael-event-calendar-pagination rendered when enabled
 * 10. Interaction      — hover triggers no JS errors
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.EVENT_CALENDAR_PAGE_SLUG ?? "event-calendar"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Event_Calendar::render()):
//
// Calendar layout:
//   .{hook}
//     .eael-event-calendar-wrapper.layout-calendar
//       [optional] .eael-event-calendar-search-wrap input.eael-event-calendar-search-input
//       div.eael-event-calendar-cls#eael-event-calendar-{id}
//         [FullCalendar JS renders → .fc .fc-toolbar .fc-view-harness ...]
//       .eaelec-modal                             ← popup template
//
// Table layout:
//   .{hook}
//     .eael-event-calendar-wrapper.layout-table
//       [optional] .ea-ec-search-wrap input.eael-event-calendar-table-search
//       table.eael-event-calendar-table.ea-ec-table-sortable[data-items-per-page]
//         thead tr th
//         tbody tr td.eael-ec-event-title | .eael-ec-event-description | .eael-ec-event-date
//       [optional] .eael-event-calendar-pagination.ea-ec-pagination-button

const calWrapper     = (hook: string) => `.${hook} .eael-event-calendar-wrapper.layout-calendar`;
const calDiv         = (hook: string) => `.${hook} .eael-event-calendar-cls`;
// FullCalendar v5 adds the .fc class directly to the .eael-event-calendar-cls container element.
const fcRoot         = (hook: string) => `.${hook} .eael-event-calendar-cls.fc`;
const fcToolbar      = (hook: string) => `.${hook} .eael-event-calendar-cls .fc-toolbar`;
const tableWrapper   = (hook: string) => `.${hook} .eael-event-calendar-wrapper.layout-table`;
const table          = (hook: string) => `.${hook} .eael-event-calendar-table`;
const thead          = (hook: string) => `.${hook} .eael-event-calendar-table thead`;
const tbody          = (hook: string) => `.${hook} .eael-event-calendar-table tbody`;
const tableSearch    = (hook: string) => `.${hook} .ea-ec-search-wrap input.eael-event-calendar-table-search`;
const pagination     = (hook: string) => `.${hook} .eael-event-calendar-pagination`;

// ── calendar view map (hook → expected data-defaultview) ──────────────────
const CAL_VIEWS: Record<string, string> = {
  "test-ec-cal-default": "dayGridMonth",
  "test-ec-cal-week":    "timeGridWeek",
  "test-ec-cal-day":     "timeGridDay",
  "test-ec-cal-list":    "listMonth",
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
// 2. Calendar layout — PHP-rendered container
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Calendar layout — container", () => {
  test("test-ec-cal-default: outer wrapper has layout-calendar class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(calWrapper("test-ec-cal-default")).first()).toBeVisible();
  });

  test("test-ec-cal-default: .eael-event-calendar-cls div is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(calDiv("test-ec-cal-default")).first()).toBeAttached();
  });

  test("test-ec-cal-default: calendar div has data-cal_id attribute", async ({ page }) => {
    await openPage(page);
    const attr = await page
      .locator(calDiv("test-ec-cal-default"))
      .first()
      .getAttribute("data-cal_id");
    expect(attr).toBeTruthy();
  });

  test("test-ec-cal-default: calendar div has data-events attribute with JSON", async ({ page }) => {
    await openPage(page);
    const raw = await page
      .locator(calDiv("test-ec-cal-default"))
      .first()
      .getAttribute("data-events");
    expect(raw).toBeTruthy();
    expect(() => JSON.parse(raw!)).not.toThrow();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. FullCalendar JS initialization
// ══════════════════════════════════════════════════════════════════════════════

test.describe("FullCalendar JS initialization", () => {
  for (const hook of Object.keys(CAL_VIEWS)) {
    test(`${hook}: .fc element is rendered after JS init`, async ({ page }) => {
      await openPage(page);
      await page.waitForSelector(`${fcRoot(hook)}`, { state: "attached", timeout: 15000 });
      await expect(page.locator(fcRoot(hook)).first()).toBeAttached();
    });

    test(`${hook}: .fc-toolbar is rendered`, async ({ page }) => {
      await openPage(page);
      await page.waitForSelector(`${fcRoot(hook)}`, { state: "attached", timeout: 15000 });
      await expect(page.locator(fcToolbar(hook)).first()).toBeVisible();
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Calendar views — data-defaultview attribute
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Calendar views", () => {
  for (const [hook, expectedView] of Object.entries(CAL_VIEWS)) {
    test(`${hook}: data-defaultview is "${expectedView}"`, async ({ page }) => {
      await openPage(page);
      const attr = await page
        .locator(calDiv(hook))
        .first()
        .getAttribute("data-defaultview");
      expect(attr).toBe(expectedView);
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Table layout — structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Table layout — structure", () => {
  test("test-ec-table: outer wrapper has layout-table class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(tableWrapper("test-ec-table")).first()).toBeVisible();
  });

  test("test-ec-table: table element is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(table("test-ec-table")).first()).toBeVisible();
  });

  test("test-ec-table: table has .ea-ec-table-sortable class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(table("test-ec-table")).first()).toHaveClass(/ea-ec-table-sortable/);
  });

  test("test-ec-table: thead is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(thead("test-ec-table")).first()).toBeVisible();
  });

  test("test-ec-table: tbody is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(tbody("test-ec-table")).first()).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Table content — event titles appear in rows
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Table content", () => {
  test("test-ec-table: 'Team Kickoff Meeting' appears in tbody", async ({ page }) => {
    await openPage(page);
    const bodyText = await page.locator(tbody("test-ec-table")).first().textContent();
    expect(bodyText).toContain("Team Kickoff Meeting");
  });

  test("test-ec-table: 'Product Launch Webinar' appears in tbody", async ({ page }) => {
    await openPage(page);
    const bodyText = await page.locator(tbody("test-ec-table")).first().textContent();
    expect(bodyText).toContain("Product Launch Webinar");
  });

  test("test-ec-table: 'Annual Conference' appears in tbody", async ({ page }) => {
    await openPage(page);
    const bodyText = await page.locator(tbody("test-ec-table")).first().textContent();
    expect(bodyText).toContain("Annual Conference");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Table columns — header labels and column toggle
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Table columns", () => {
  test("test-ec-table: thead contains 'Title' column header", async ({ page }) => {
    await openPage(page);
    const theadText = await page.locator(thead("test-ec-table")).first().textContent();
    expect(theadText).toContain("Title");
  });

  test("test-ec-table: thead contains 'Description' column header", async ({ page }) => {
    await openPage(page);
    const theadText = await page.locator(thead("test-ec-table")).first().textContent();
    expect(theadText).toContain("Description");
  });

  test("test-ec-table: thead contains 'Date' column header", async ({ page }) => {
    await openPage(page);
    const theadText = await page.locator(thead("test-ec-table")).first().textContent();
    expect(theadText).toContain("Date");
  });

  test("test-ec-table-no-desc: 'Description' column header is absent", async ({ page }) => {
    await openPage(page);
    const theadText = await page.locator(thead("test-ec-table-no-desc")).first().textContent();
    expect(theadText).not.toContain("Description");
  });

  test("test-ec-table-no-desc: .eael-ec-event-description td is absent", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ec-table-no-desc .eael-ec-event-description")
    ).toHaveCount(0);
  });

  test("test-ec-table: tbody rows have .eael-ec-event-title cells", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(".test-ec-table .eael-ec-event-title").count();
    expect(count).toBeGreaterThan(0);
  });

  test("test-ec-table: tbody rows have .eael-ec-event-date cells", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(".test-ec-table .eael-ec-event-date").count();
    expect(count).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Search control
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Search control", () => {
  test("test-ec-table: search input is rendered when enabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(tableSearch("test-ec-table")).first()).toBeVisible();
  });

  test("test-ec-table-no-search: search input is absent when disabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(tableSearch("test-ec-table-no-search"))).toHaveCount(0);
  });

  test("test-ec-table: .ea-ec-search-wrap container is rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ec-table .ea-ec-search-wrap").first()
    ).toBeVisible();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. Pagination
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Pagination", () => {
  test("test-ec-table-paginated: .eael-event-calendar-pagination is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(pagination("test-ec-table-paginated")).first()).toBeAttached();
  });

  test("test-ec-table-paginated: table has data-items-per-page attribute", async ({ page }) => {
    await openPage(page);
    const attr = await page
      .locator(table("test-ec-table-paginated"))
      .first()
      .getAttribute("data-items-per-page");
    expect(attr).toBeTruthy();
    expect(Number(attr)).toBeGreaterThan(0);
  });

  test("test-ec-table: .eael-event-calendar-pagination is absent when disabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(pagination("test-ec-table"))).toHaveCount(0);
  });

  test("test-ec-table-paginated: table has .ea-ec-table-paginated class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(table("test-ec-table-paginated")).first()).toHaveClass(
      /ea-ec-table-paginated/
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover over table rows triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    const rows = page.locator(".test-ec-table .eael-event-calendar-table tbody tr");
    const count = await rows.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      await rows.nth(i).hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover over calendar widgets triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.waitForSelector(fcRoot("test-ec-cal-default"), {
      state: "attached",
      timeout: 15000,
    });

    await page.locator(calWrapper("test-ec-cal-default")).first().hover();
    await page.waitForTimeout(150);

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("typing in table search triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    await page.locator(tableSearch("test-ec-table")).first().fill("Kickoff");
    await page.waitForTimeout(300);

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
