/**
 * Covered: Essential Addons — 360 Degree Photo Viewer (Sphere Photo Viewer) widget (Pro)
 *
 * 1. Page health          — HTTP 200, no PHP errors, no JS errors
 * 2. Element structure    — .eael-sphere-photo-wrapper; data-settings attr; inner div#eael-psv-*
 * 3. Content variants     — caption on/off; description on/off (asserted via data-settings JSON)
 * 4. Settings variants    — autorotate plugin config; fisheye flag in data-settings
 * 5. Navigation bar       — navbar array in data-settings; hidden variant (computed display: none)
 * 6. Markers              — markers plugin config in data-settings
 * 7. PSV JS init          — .psv-container injected after Photo Sphere Viewer initialises
 * 8. Interaction          — hover on each variant triggers no JS errors
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.SPHERE_PHOTO_VIEWER_PAGE_SLUG ?? "sphere-photo-viewer"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Sphere_Photo_Viewer::render()):
//   .{hook}                                      ← elementor-widget wrapper
//     .eael-sphere-photo-wrapper[data-settings]  ← EA wrapper + JSON config
//       div#eael-psv-{id}                        ← PHP-rendered container
//         → .psv-container                       ← PSV JS injected
//             .psv-canvas-container > canvas
//             .psv-navbar
//             .psv-panel (when description/markers visible)

const wrapper    = (hook: string) => `.${hook} .eael-sphere-photo-wrapper`;
const psvInner   = (hook: string) => `.${hook} [id^="eael-psv-"]`;
const psvInited  = (hook: string) => `.${hook} .psv-container`;
const psvNavbar  = (hook: string) => `.${hook} .psv-navbar`;

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

async function getSettings(page: Page, hook: string): Promise<Record<string, unknown>> {
  const raw = await page.locator(wrapper(hook)).first().getAttribute("data-settings");
  return JSON.parse(raw ?? "{}");
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
// 2. Element structure
// ══════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test(".eael-sphere-photo-wrapper is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrapper("test-spv-default")).first()).toBeAttached();
  });

  test("inner div id starts with eael-psv-", async ({ page }) => {
    await openPage(page);
    const id = await page.locator(psvInner("test-spv-default")).first().getAttribute("id");
    expect(id).toMatch(/^eael-psv-/);
  });

  test("data-settings attribute is present and valid JSON", async ({ page }) => {
    await openPage(page);
    const settings = await getSettings(page, "test-spv-default");
    expect(typeof settings).toBe("object");
    expect(settings).not.toBeNull();
  });

  test("data-settings contains panorama URL", async ({ page }) => {
    await openPage(page);
    const settings = await getSettings(page, "test-spv-default");
    expect(typeof settings["panorama"]).toBe("string");
    expect((settings["panorama"] as string).length).toBeGreaterThan(0);
  });

  test("data-settings container field matches inner div id", async ({ page }) => {
    await openPage(page);
    const settings = await getSettings(page, "test-spv-default");
    const id = await page.locator(psvInner("test-spv-default")).first().getAttribute("id");
    expect(settings["container"]).toBe(id);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 3. Content variants
// ══════════════════════════════════════════════════════════════════════════

test.describe("Content variants", () => {
  test("default: caption is non-empty in data-settings", async ({ page }) => {
    await openPage(page);
    const settings = await getSettings(page, "test-spv-default");
    expect(settings["caption"]).toBeTruthy();
  });

  test("default: description is non-empty in data-settings", async ({ page }) => {
    await openPage(page);
    const settings = await getSettings(page, "test-spv-default");
    expect(settings["description"]).toBeTruthy();
  });

  test("no-caption: caption is empty in data-settings", async ({ page }) => {
    await openPage(page);
    const settings = await getSettings(page, "test-spv-no-caption");
    expect(settings["caption"]).toBeFalsy();
  });

  test("no-caption: description is present in data-settings", async ({ page }) => {
    await openPage(page);
    const settings = await getSettings(page, "test-spv-no-caption");
    expect(settings["description"]).toBeTruthy();
  });

  test("no-description: caption is present in data-settings", async ({ page }) => {
    await openPage(page);
    const settings = await getSettings(page, "test-spv-no-description");
    expect(settings["caption"]).toBeTruthy();
  });

  test("no-description: description is empty in data-settings", async ({ page }) => {
    await openPage(page);
    const settings = await getSettings(page, "test-spv-no-description");
    expect(settings["description"]).toBeFalsy();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 4. Settings variants
// ══════════════════════════════════════════════════════════════════════════

test.describe("Settings variants", () => {
  test("autorotate: plugins array contains autorotate config", async ({ page }) => {
    await openPage(page);
    const settings = await getSettings(page, "test-spv-autorotate");
    const plugins = settings["plugins"] as unknown[][];
    expect(Array.isArray(plugins)).toBe(true);
    const autorotatePlugin = plugins[0]?.[0] as Record<string, unknown> | undefined;
    expect(autorotatePlugin).toBeDefined();
    expect("autorotateSpeed" in (autorotatePlugin ?? {})).toBe(true);
  });

  test("autorotate: autostartDelay is set", async ({ page }) => {
    await openPage(page);
    const settings = await getSettings(page, "test-spv-autorotate");
    const plugins = settings["plugins"] as unknown[][];
    const autorotatePlugin = plugins[0]?.[0] as Record<string, unknown>;
    expect(typeof autorotatePlugin["autostartDelay"]).toBe("number");
  });

  test("fisheye: fisheye is true in data-settings", async ({ page }) => {
    await openPage(page);
    const settings = await getSettings(page, "test-spv-fisheye");
    expect(settings["fisheye"]).toBe(true);
  });

  test("default: fisheye is false in data-settings", async ({ page }) => {
    await openPage(page);
    const settings = await getSettings(page, "test-spv-default");
    expect(settings["fisheye"]).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 5. Navigation bar
// ══════════════════════════════════════════════════════════════════════════

test.describe("Navigation bar", () => {
  test("default: navbar array is non-empty in data-settings", async ({ page }) => {
    await openPage(page);
    const settings = await getSettings(page, "test-spv-default");
    const navbar = settings["navbar"] as unknown[];
    expect(Array.isArray(navbar)).toBe(true);
    expect(navbar.length).toBeGreaterThan(0);
  });

  test("navbar-hidden: .psv-navbar is not visible after PSV init", async ({ page }) => {
    await openPage(page);
    await page.locator(psvInited("test-spv-navbar-hidden")).first().waitFor({
      state: "attached",
      timeout: 10000,
    });
    const display = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return el ? window.getComputedStyle(el).display : null;
    }, psvNavbar("test-spv-navbar-hidden"));
    expect(display).toBe("none");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 6. Markers
// ══════════════════════════════════════════════════════════════════════════

test.describe("Markers", () => {
  test("with-markers: plugins array contains markers config", async ({ page }) => {
    await openPage(page);
    const settings = await getSettings(page, "test-spv-markers");
    const plugins = settings["plugins"] as unknown[][];
    expect(Array.isArray(plugins)).toBe(true);
    const markersPlugin = plugins.flat().find(
      (p) => typeof p === "object" && p !== null && "markers" in (p as object)
    ) as Record<string, unknown> | undefined;
    expect(markersPlugin).toBeDefined();
  });

  test("with-markers: markers array has 2 items", async ({ page }) => {
    await openPage(page);
    const settings = await getSettings(page, "test-spv-markers");
    const plugins = settings["plugins"] as unknown[][];
    const markersPlugin = plugins.flat().find(
      (p) => typeof p === "object" && p !== null && "markers" in (p as object)
    ) as Record<string, unknown>;
    const markers = markersPlugin["markers"] as unknown[];
    expect(markers).toHaveLength(2);
  });

  test("with-markers: first marker has tooltip 'Point Alpha'", async ({ page }) => {
    await openPage(page);
    const settings = await getSettings(page, "test-spv-markers");
    const plugins = settings["plugins"] as unknown[][];
    const markersPlugin = plugins.flat().find(
      (p) => typeof p === "object" && p !== null && "markers" in (p as object)
    ) as Record<string, unknown>;
    const markers = markersPlugin["markers"] as Array<Record<string, unknown>>;
    expect(markers[0]["tooltip"]).toBe("Point Alpha");
  });

  test("with-markers: second marker has tooltip 'Point Beta'", async ({ page }) => {
    await openPage(page);
    const settings = await getSettings(page, "test-spv-markers");
    const plugins = settings["plugins"] as unknown[][];
    const markersPlugin = plugins.flat().find(
      (p) => typeof p === "object" && p !== null && "markers" in (p as object)
    ) as Record<string, unknown>;
    const markers = markersPlugin["markers"] as Array<Record<string, unknown>>;
    expect(markers[1]["tooltip"]).toBe("Point Beta");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 7. PSV JS initialisation
// ══════════════════════════════════════════════════════════════════════════

test.describe("PSV JS initialisation", () => {
  const HOOKS = [
    "test-spv-default",
    "test-spv-no-caption",
    "test-spv-autorotate",
    "test-spv-fisheye",
    "test-spv-navbar-hidden",
    "test-spv-markers",
  ];

  for (const hook of HOOKS) {
    test(`${hook}: .psv-container is injected after init`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(psvInited(hook)).first()).toBeAttached({ timeout: 10000 });
    });
  }

  test("default: canvas is rendered inside .psv-container", async ({ page }) => {
    await openPage(page);
    await page.locator(psvInited("test-spv-default")).first().waitFor({
      state: "attached",
      timeout: 10000,
    });
    await expect(
      page.locator(".test-spv-default .psv-canvas-container canvas").first()
    ).toBeAttached({ timeout: 10000 });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 8. Interaction
// ══════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover on all variants triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    const hooks = [
      "test-spv-default",
      "test-spv-no-caption",
      "test-spv-no-description",
      "test-spv-autorotate",
      "test-spv-fisheye",
      "test-spv-navbar-hidden",
      "test-spv-markers",
    ];
    for (const hook of hooks) {
      await page.locator(wrapper(hook)).first().hover();
      await page.waitForTimeout(150);
    }
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
