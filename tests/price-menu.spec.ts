import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.PRICE_MENU_PAGE_SLUG ?? "price-menu"}/`;

// ── selectors ─────────────────────────────────────────────────────────────────
// DOM shape (from Price_Menu::render()):
//   .{hook}                                        ← Elementor outer wrapper
//     .eael-restaurant-menu                        ← main container
//       .eael-restaurant-menu-{style}              ← style class
//       .eael-restaurant-menu-items
//         .eael-restaurant-menu-item-wrap          ← per repeater item
//           [<a>]                                  ← only when link_apply_on = full_item
//           .eael-restaurant-menu-item
//             [.eael-restaurant-menu-image > img]  ← only when image_switch = yes
//             .eael-restaurant-menu-content
//               .eael-restaurant-menu-header
//                 h4.eael-restaurant-menu-title
//                   [<a>]                          ← when link_apply_on = title
//                   span.eael-restaurant-menu-title-text
//                 [span.eael-price-title-connector] ← title_price_connector + style-1
//                 [span.eael-restaurant-menu-price] ← style-1 only (in header)
//               [.eael-price-menu-divider-wrap > .eael-price-menu-divider]
//               [div.eael-restaurant-menu-description]
//               [span.eael-restaurant-menu-price]  ← styles 2/3/4/eael (below desc)

const menu        = (hook: string) => `.${hook} .eael-restaurant-menu`;
const itemWrap    = (hook: string) => `.${hook} .eael-restaurant-menu-item-wrap`;
const titleEl     = (hook: string, n = 1) =>
  `.${hook} .eael-restaurant-menu-item-wrap:nth-child(${n}) .eael-restaurant-menu-title`;
const titleText   = (hook: string, n = 1) =>
  `.${hook} .eael-restaurant-menu-item-wrap:nth-child(${n}) .eael-restaurant-menu-title-text`;
const priceEl     = (hook: string, n = 1) =>
  `.${hook} .eael-restaurant-menu-item-wrap:nth-child(${n}) .eael-restaurant-menu-price-discount`;
const origPrice   = (hook: string, n = 1) =>
  `.${hook} .eael-restaurant-menu-item-wrap:nth-child(${n}) .eael-restaurant-menu-price-original`;
const descEl      = (hook: string, n = 1) =>
  `.${hook} .eael-restaurant-menu-item-wrap:nth-child(${n}) .eael-restaurant-menu-description`;

// ── style class map ───────────────────────────────────────────────────────────
const STYLE_MAP: Record<string, string> = {
  "test-pm-default":    "eael-restaurant-menu-style-1",
  "test-pm-style-eael": "eael-restaurant-menu-style-eael",
  "test-pm-style-2":    "eael-restaurant-menu-style-2",
  "test-pm-style-3":    "eael-restaurant-menu-style-3",
  "test-pm-style-4":    "eael-restaurant-menu-style-4",
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
// 2. Menu styles — one instance per style
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Menu styles", () => {
  for (const [hook, styleClass] of Object.entries(STYLE_MAP)) {
    test(`${styleClass}: menu container carries correct style class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(menu(hook)).first()).toHaveClass(
        new RegExp(styleClass)
      );
    });

    test(`${styleClass}: menu container is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(menu(hook)).first()).toBeVisible();
    });

    test(`${styleClass}: renders two item wrappers`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(itemWrap(hook))).toHaveCount(2);
    });

    test(`${styleClass}: first item title is "Espresso"`, async ({ page }) => {
      await openPage(page);
      const text = await page.locator(titleText(hook, 1)).first().textContent();
      expect(text?.trim()).toBe("Espresso");
    });

    test(`${styleClass}: first item price is "$3.50"`, async ({ page }) => {
      await openPage(page);
      const text = await page.locator(priceEl(hook, 1)).first().textContent();
      expect(text?.trim()).toBe("$3.50");
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Discount & pricing
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Discount & pricing", () => {
  test("discount: original price element is rendered for first item", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(origPrice("test-pm-discount", 1)).first()).toBeAttached();
  });

  test("discount: original price shows '$5.99'", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(origPrice("test-pm-discount", 1)).first().textContent();
    expect(text?.trim()).toBe("$5.99");
  });

  test("discount: discounted price shows '$3.99'", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(priceEl("test-pm-discount", 1)).first().textContent();
    expect(text?.trim()).toBe("$3.99");
  });

  test("no-discount: second item has no original price element", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(origPrice("test-pm-discount", 2))).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Style-1 features — connector and separator
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Title-price connector (style-1)", () => {
  test("connector: span.eael-price-title-connector is rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pm-connector .eael-price-title-connector").first()
    ).toBeAttached();
  });

  test("connector: at least one connector element per visible item", async ({ page }) => {
    await openPage(page);
    const count = await page
      .locator(".test-pm-connector .eael-price-title-connector")
      .count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("default (no connector): .eael-price-title-connector is absent", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pm-default .eael-price-title-connector")
    ).toHaveCount(0);
  });
});

test.describe("Title separator", () => {
  test("separator enabled: .eael-price-menu-divider is rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pm-separator .eael-price-menu-divider").first()
    ).toBeAttached();
  });

  test("separator enabled: divider wrapper is present", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pm-separator .eael-price-menu-divider-wrap").first()
    ).toBeAttached();
  });

  test("separator disabled (default): .eael-price-menu-divider is absent", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pm-default .eael-price-menu-divider")
    ).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Link behaviour
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Link behaviour", () => {
  test("link on title: first item title contains an <a> tag", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`${titleEl("test-pm-link-title", 1)} a`).first()
    ).toBeAttached();
  });

  test("link on title: anchor href is '#'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`${titleEl("test-pm-link-title", 1)} a`).first()
    ).toHaveAttribute("href", "#");
  });

  test("link on title: no-link second item has no <a> in title", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`${titleEl("test-pm-link-title", 2)} a`)
    ).toHaveCount(0);
  });

  test("link on full item: first item wrap contains an <a> tag", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pm-link-full .eael-restaurant-menu-item-wrap > a").first()
    ).toBeAttached();
  });

  test("link on full item: full-item anchor href is '#'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pm-link-full .eael-restaurant-menu-item-wrap > a").first()
    ).toHaveAttribute("href", "#");
  });

  test("external link: anchor has target='_blank'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`${titleEl("test-pm-link-external", 1)} a`).first()
    ).toHaveAttribute("target", "_blank");
  });

  test("external link: href points to configured URL", async ({ page }) => {
    await openPage(page);
    const href = await page
      .locator(`${titleEl("test-pm-link-external", 1)} a`)
      .first()
      .getAttribute("href");
    expect(href).toContain("essential-addons.com");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Element structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("menu container carries class 'eael-restaurant-menu'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(menu("test-pm-default")).first()).toHaveClass(
      /eael-restaurant-menu/
    );
  });

  test("item title is rendered as <h4> tag", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(titleEl("test-pm-default", 1))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H4");
  });

  test("title text rendered inside span.eael-restaurant-menu-title-text", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(titleText("test-pm-default", 1)).first()
    ).toBeAttached();
  });

  test("description div is rendered for each item", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(descEl("test-pm-default", 1)).first()).toBeAttached();
    await expect(page.locator(descEl("test-pm-default", 2)).first()).toBeAttached();
  });

  test("first item description contains 'Rich bold coffee'", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(descEl("test-pm-default", 1)).first().textContent();
    expect(text?.trim()).toContain("Rich bold coffee");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover on each widget instance triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-pm-default",
      "test-pm-style-eael",
      "test-pm-style-2",
      "test-pm-style-3",
      "test-pm-style-4",
      "test-pm-discount",
      "test-pm-connector",
      "test-pm-separator",
      "test-pm-link-title",
      "test-pm-link-full",
      "test-pm-link-external",
    ]) {
      await page.locator(menu(hook)).first().hover({ force: true });
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("title link is keyboard-focusable", async ({ page }) => {
    await openPage(page);
    const link = page
      .locator(`${titleEl("test-pm-link-title", 1)} a`)
      .first();
    await link.focus();
    await expect(link).toBeFocused();
  });

  test("clicking title link causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(`${titleEl("test-pm-link-title", 1)} a`).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
