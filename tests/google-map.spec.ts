import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.GOOGLE_MAP_PAGE_SLUG ?? "google-map"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Google_Map::render()):
//   .{hook}                                           ← elementor-widget wrapper
//     .eael-google-map                                ← map container div
//     .eael-google-map-{type}                         ← type-specific class
//     #eael-google-map-{id}                           ← same div by ID
//     [data-id="{id}"]
//     [data-map_type="{type}"]
//     [data-map_addr="{address}"]
//     [data-map_zoom="{zoom}"]
//     [data-map_zoom_control="true|false"]
//     [data-map_fullscreen_control="true|false"]
//     [data-map_scroll_zoom="true|false"]
//     [data-map_streeview_control="true|false"]
//     [data-map_type_control="true|false"]
//     .google-map-notice                              ← API-key notice area (always rendered)
//   (only for marker + enable_marker_search=yes):
//     .eael-google-map-marker-search
//       input[type=text]
//       ul

const mapDiv = (hook: string) => `.${hook} .eael-google-map`;
const typeClass = (hook: string, type: string) =>
  `.${hook} .eael-google-map-${type}`;
const markerSearch = (hook: string) =>
  `.${hook} .eael-google-map-marker-search`;
const markerSearchInput = (hook: string) =>
  `.${hook} .eael-google-map-marker-search input[type="text"]`;
const notice = (hook: string) => `.${hook} .google-map-notice`;

// ── map type → hook map ────────────────────────────────────────────────────
const TYPE_MAP: Record<string, string> = {
  "test-gm-default": "basic",
  "test-gm-marker": "marker",
  "test-gm-static": "static",
  "test-gm-routes": "routes",
  "test-gm-panorama": "panorama",
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
// 2. Map types
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Map types", () => {
  for (const [hook, type] of Object.entries(TYPE_MAP)) {
    test(`${type} — map div is attached`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(mapDiv(hook)).first()).toBeAttached();
    });

    test(`${type} — carries eael-google-map-${type} class`, async ({
      page,
    }) => {
      await openPage(page);
      await expect(page.locator(typeClass(hook, type)).first()).toBeAttached();
    });

    test(`${type} — data-map_type attribute is "${type}"`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(mapDiv(hook)).first()).toHaveAttribute(
        "data-map_type",
        type
      );
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Widget structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Widget structure", () => {
  test("map div has a data-id attribute", async ({ page }) => {
    await openPage(page);
    const id = await page
      .locator(mapDiv("test-gm-default"))
      .first()
      .getAttribute("data-id");
    expect(id).toBeTruthy();
  });

  test("map div has an id attribute starting with 'eael-google-map-'", async ({
    page,
  }) => {
    await openPage(page);
    const id = await page
      .locator(mapDiv("test-gm-default"))
      .first()
      .getAttribute("id");
    expect(id).toMatch(/^eael-google-map-/);
  });

  test("google-map-notice div is always rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(notice("test-gm-default")).first()).toBeAttached();
  });

  test("data-map_addr reflects the configured address", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(mapDiv("test-gm-default")).first()).toHaveAttribute(
      "data-map_addr",
      "Marina Bay, Singapore"
    );
  });

  test("data-map_zoom reflects the configured zoom level", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(mapDiv("test-gm-default")).first()).toHaveAttribute(
      "data-map_zoom",
      "14"
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Control toggles
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Control toggles", () => {
  test("zoom control on — data-map_zoom_control='true'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(mapDiv("test-gm-default")).first()).toHaveAttribute(
      "data-map_zoom_control",
      "true"
    );
  });

  test("zoom control off — data-map_zoom_control='false'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(mapDiv("test-gm-no-zoom-ctrl")).first()
    ).toHaveAttribute("data-map_zoom_control", "false");
  });

  test("fullscreen control on — data-map_fullscreen_control='true'", async ({
    page,
  }) => {
    await openPage(page);
    await expect(page.locator(mapDiv("test-gm-default")).first()).toHaveAttribute(
      "data-map_fullscreen_control",
      "true"
    );
  });

  test("fullscreen control off — data-map_fullscreen_control='false'", async ({
    page,
  }) => {
    await openPage(page);
    await expect(
      page.locator(mapDiv("test-gm-no-fullscreen")).first()
    ).toHaveAttribute("data-map_fullscreen_control", "false");
  });

  test("scroll zoom on — data-map_scroll_zoom='true'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(mapDiv("test-gm-default")).first()).toHaveAttribute(
      "data-map_scroll_zoom",
      "true"
    );
  });

  test("scroll zoom off — data-map_scroll_zoom='false'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(mapDiv("test-gm-no-scroll-zoom")).first()
    ).toHaveAttribute("data-map_scroll_zoom", "false");
  });

  test("street view on — data-map_streeview_control='true'", async ({
    page,
  }) => {
    await openPage(page);
    await expect(page.locator(mapDiv("test-gm-default")).first()).toHaveAttribute(
      "data-map_streeview_control",
      "true"
    );
  });

  test("street view off — data-map_streeview_control='false'", async ({
    page,
  }) => {
    await openPage(page);
    await expect(
      page.locator(mapDiv("test-gm-no-streetview")).first()
    ).toHaveAttribute("data-map_streeview_control", "false");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Marker search
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Marker search", () => {
  test("search box is rendered when enable_marker_search=yes", async ({
    page,
  }) => {
    await openPage(page);
    await expect(
      page.locator(markerSearch("test-gm-marker-search")).first()
    ).toBeAttached();
  });

  test("search input is present inside the search box", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(markerSearchInput("test-gm-marker-search")).first()
    ).toBeAttached();
  });

  test("search input placeholder matches marker_search_text", async ({
    page,
  }) => {
    await openPage(page);
    await expect(
      page.locator(markerSearchInput("test-gm-marker-search")).first()
    ).toHaveAttribute("placeholder", "Search Marker...");
  });

  test("search box is absent when enable_marker_search is not set", async ({
    page,
  }) => {
    await openPage(page);
    await expect(
      page.locator(markerSearch("test-gm-marker"))
    ).toHaveCount(0);
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
      "test-gm-default",
      "test-gm-marker",
      "test-gm-static",
      "test-gm-routes",
      "test-gm-panorama",
      "test-gm-no-zoom-ctrl",
      "test-gm-no-fullscreen",
      "test-gm-no-scroll-zoom",
      "test-gm-no-streetview",
      "test-gm-marker-search",
    ]) {
      const el = page.locator(mapDiv(hook)).first();
      if (await el.count()) {
        await el.hover();
        await page.waitForTimeout(150);
      }
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("search input is focusable via keyboard", async ({ page }) => {
    await openPage(page);
    const input = page
      .locator(markerSearchInput("test-gm-marker-search"))
      .first();
    await input.focus();
    await expect(input).toBeFocused();
  });
});

  }
});
