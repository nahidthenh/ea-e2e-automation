/**
 * Covered: Essential Addons — Woo Account Dashboard widget (Pro)
 *
 * NOTE: Pro-only widget. Requires WooCommerce active. Tests run as the logged-in
 * admin user (storageState), so the full account dashboard is rendered.
 *
 * 1. Page health       — HTTP 200, no PHP errors, no JS errors
 * 2. Preset layouts    — preset-1 / preset-2 / preset-3 wrapper class present
 * 3. Nav structure     — navbar and nav list items rendered for each preset
 * 4. Content area      — .eael-account-dashboard-content present
 * 5. Profile section   — avatar / greeting / name show & hide (preset-1 + preset-2)
 * 6. Tab variants      — fewer-tabs: only 2 nav links rendered
 * 7. Interaction       — hover on each instance triggers no JS errors
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.WOO_ACCOUNT_DASHBOARD_PAGE_SLUG ?? "woo-account-dashboard"}/`;

// ── selectors ──────────────────────────────────────────────────────────────
// DOM shape (from render() + preset templates):
//
//   .{hook}                                   ← _css_classes on Elementor widget
//     .eael-account-dashboard-wrap            ← render attribute wrapper
//       .eael-account-dashboard-wrapper       ← template root, carries preset class
//         .preset-1 | .preset-2 | .preset-3
//         .eael-account-dashboard-body
//           .eael-account-dashboard-container
//             .eael-account-dashboard-navbar
//               .woocommerce-MyAccount-navigation
//                 ul
//                   li a                      ← nav tab links
//               .eael-account-profile         ← optional profile block
//                 .eael-account-profile-image ← avatar img
//                 .eael-account-profile-details
//                   p.info                    ← greeting text
//                   h5.name                   ← display name
//             .eael-account-dashboard-content ← content area
//               .woocommerce-MyAccount-content

const outerWrap  = (hook: string) => `.${hook} .eael-account-dashboard-wrap`;
const wrapper    = (hook: string) => `.${hook} .eael-account-dashboard-wrapper`;
const navbar     = (hook: string) => `.${hook} .eael-account-dashboard-navbar`;
const navItems   = (hook: string) => `.${hook} .eael-account-dashboard-navbar .woocommerce-MyAccount-navigation ul li`;
const content    = (hook: string) => `.${hook} .eael-account-dashboard-content`;
const profile    = (hook: string) => `.${hook} .eael-account-profile`;
const avatar     = (hook: string) => `.${hook} .eael-account-profile-image`;
const greeting   = (hook: string) => `.${hook} .eael-account-profile-details p.info`;
const name       = (hook: string) => `.${hook} .eael-account-profile-details h5.name`;

const PRESETS = ["preset-1", "preset-2", "preset-3"] as const;

const PRESET_HOOKS: Record<typeof PRESETS[number], string> = {
  "preset-1": "test-wad-preset-1",
  "preset-2": "test-wad-preset-2",
  "preset-3": "test-wad-preset-3",
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

// ============================================================================
// 1. Page health
// ============================================================================

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

// ============================================================================
// 2. Preset layouts — outer wrap + preset class on wrapper
// ============================================================================

test.describe("Preset layouts", () => {
  for (const [preset, hook] of Object.entries(PRESET_HOOKS)) {
    test(`${preset}: .eael-account-dashboard-wrap is rendered`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(outerWrap(hook)).first()).toBeAttached();
    });

    test(`${preset}: .eael-account-dashboard-wrapper carries class "${preset}"`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrapper(hook)).first()).toHaveClass(
        new RegExp(preset)
      );
    });
  }
});

// ============================================================================
// 3. Nav structure — navbar and nav items present
// ============================================================================

test.describe("Nav structure", () => {
  for (const [preset, hook] of Object.entries(PRESET_HOOKS)) {
    test(`${preset}: .eael-account-dashboard-navbar is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(navbar(hook)).first()).toBeVisible();
    });

    test(`${preset}: nav list has at least one item`, async ({ page }) => {
      await openPage(page);
      const count = await page.locator(navItems(hook)).count();
      expect(count, `Expected ≥1 nav item in ${hook}`).toBeGreaterThan(0);
    });
  }

  test("preset-1: dashboard nav link is present", async ({ page }) => {
    await openPage(page);
    const dashLink = page.locator(
      ".test-wad-preset-1 .eael-account-dashboard-navbar .woocommerce-MyAccount-navigation ul li a"
    ).first();
    await expect(dashLink).toBeVisible();
  });
});

// ============================================================================
// 4. Content area
// ============================================================================

test.describe("Content area", () => {
  for (const [preset, hook] of Object.entries(PRESET_HOOKS)) {
    test(`${preset}: .eael-account-dashboard-content is rendered`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(content(hook)).first()).toBeAttached();
    });
  }
});

// ============================================================================
// 5. Profile section — preset-1 (controls default off, explicitly enabled)
// ============================================================================

test.describe("Profile section — preset-1 (all off by default)", () => {
  test("test-wad-preset-1: .eael-account-profile is not rendered (defaults off)", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(profile("test-wad-preset-1"))).toHaveCount(0);
  });

  test("test-wad-profile-on: .eael-account-profile is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(profile("test-wad-profile-on")).first()).toBeVisible();
  });

  test("test-wad-profile-on: avatar image is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(`${avatar("test-wad-profile-on")} img`).first()).toBeAttached();
  });

  test("test-wad-profile-on: greeting text 'Welcome' is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(greeting("test-wad-profile-on")).first()).toBeVisible();
    await expect(page.locator(greeting("test-wad-profile-on")).first()).toContainText("Welcome");
  });

  test("test-wad-profile-on: display name h5 is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(name("test-wad-profile-on")).first()).toBeVisible();
  });
});

// ============================================================================
// 5b. Profile section — preset-2 (controls default on, toggled individually)
// ============================================================================

test.describe("Profile section — preset-2 (on by default)", () => {
  test("test-wad-preset-2: .eael-account-profile is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(profile("test-wad-preset-2")).first()).toBeVisible();
  });

  test("test-wad-no-avatar: .eael-account-profile-image is not rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(avatar("test-wad-no-avatar"))).toHaveCount(0);
  });

  test("test-wad-no-avatar: greeting and name still visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(greeting("test-wad-no-avatar")).first()).toBeVisible();
    await expect(page.locator(name("test-wad-no-avatar")).first()).toBeVisible();
  });

  test("test-wad-no-greeting: p.info is not rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(greeting("test-wad-no-greeting"))).toHaveCount(0);
  });

  test("test-wad-no-greeting: avatar and name still visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(`${avatar("test-wad-no-greeting")} img`).first()).toBeAttached();
    await expect(page.locator(name("test-wad-no-greeting")).first()).toBeVisible();
  });

  test("test-wad-no-name: h5.name is not rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(name("test-wad-no-name"))).toHaveCount(0);
  });

  test("test-wad-no-name: avatar and greeting still visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(`${avatar("test-wad-no-name")} img`).first()).toBeAttached();
    await expect(page.locator(greeting("test-wad-no-name")).first()).toBeVisible();
  });
});

// ============================================================================
// 6. Tab variants — fewer-tabs: only 2 nav links
// ============================================================================

test.describe("Tab variants", () => {
  test("test-wad-few-tabs: nav has exactly 2 items (dashboard + orders)", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(navItems("test-wad-few-tabs")).count();
    expect(count).toBe(2);
  });

  test("test-wad-preset-1: nav has 6 items (all default tabs)", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(navItems("test-wad-preset-1")).count();
    expect(count).toBe(6);
  });
});

// ============================================================================
// 7. Interaction — hover produces no JS errors
// ============================================================================

test.describe("Interaction", () => {
  const allHooks = [
    "test-wad-preset-1",
    "test-wad-preset-2",
    "test-wad-preset-3",
    "test-wad-profile-on",
    "test-wad-few-tabs",
  ];

  for (const hook of allHooks) {
    test(`${hook}: hover triggers no JS errors`, async ({ page }) => {
      const errs = watchErrors(page);
      await openPage(page);
      const el = page.locator(outerWrap(hook)).first();
      await el.hover();
      await page.waitForTimeout(150);
      expect(errs, errs.join(" | ")).toHaveLength(0);
    });
  }

  test("preset-1 nav link is keyboard-focusable", async ({ page }) => {
    await openPage(page);
    const firstLink = page.locator(
      ".test-wad-preset-1 .eael-account-dashboard-navbar .woocommerce-MyAccount-navigation ul li a"
    ).first();
    await firstLink.focus();
    await expect(firstLink).toBeFocused();
  });
});
