import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.PRICING_TABLE_PAGE_SLUG ?? "pricing-table"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Pricing_Table::render()):
//   .{hook}                            ← elementor-widget wrapper
//     .eael-pricing.{style}            ← e.g. .eael-pricing.style-1
//       .eael-pricing-item             ← main card (+ .featured .ribbon-N if featured)
//         .header                      ← contains title tag (h2 by default)
//           .title                     ← title text
//         .eael-pricing-tag            ← price area
//           .price-tag                 ← wraps .original-price / .sale-price
//           .price-period              ← "/ month"
//         .body                        ← feature list
//           ul
//             li.eael-pricing-item-feature   ← each feature row
//               .li-icon               ← icon (when enabled)
//               span                   ← feature text
//         .footer                      ← button area (when shown)
//           a.eael-pricing-button
//
//   Style 2 additionally has:
//     .eael-pricing-icon > .icon       ← header icon

const pricing  = (hook: string) => `.${hook} .eael-pricing`;
const card     = (hook: string) => `.${hook} .eael-pricing-item`;
const title    = (hook: string) => `.${hook} .eael-pricing-item .title`;
const priceTag = (hook: string) => `.${hook} .eael-pricing-tag`;
const button   = (hook: string) => `.${hook} .eael-pricing-button`;
const featureList = (hook: string) => `.${hook} .eael-pricing-item-feature`;
const listIcon = (hook: string) => `.${hook} .eael-pricing-item-feature .li-icon`;

// ── style class values ────────────────────────────────────────────────────
const FREE_STYLES = ["style-1", "style-2"] as const;
const PRO_STYLES  = ["style-3", "style-4", "style-5"] as const;

// ── helpers ───────────────────────────────────────────────────────────────

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
// 2. Pricing Table styles — free
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Pricing Table styles (free)", () => {
  const styleMap: Record<string, string> = {
    "test-pt-default": "style-1",
    "test-pt-style-2": "style-2",
  };

  for (const [hook, styleClass] of Object.entries(styleMap)) {
    test(`${styleClass} wrapper is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(pricing(hook)).first()).toBeVisible();
    });

    test(`${styleClass} applies correct CSS class to wrapper`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(pricing(hook)).first()).toHaveClass(
        new RegExp(styleClass)
      );
    });

    test(`${styleClass} renders pricing card`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(card(hook)).first()).toBeVisible();
    });

    test(`${styleClass} renders title text`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(title(hook)).first()).toBeVisible();
    });

    test(`${styleClass} renders price tag area`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(priceTag(hook)).first()).toBeVisible();
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Pricing Table styles — pro
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Pricing Table styles (pro)", () => {
  const proStyleMap: Record<string, string> = {
    "test-pt-pro-style-3": "style-3",
    "test-pt-pro-style-4": "style-4",
    "test-pt-pro-style-5": "style-5",
  };

  for (const [hook, styleClass] of Object.entries(proStyleMap)) {
    test(`${styleClass} wrapper is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(pricing(hook)).first()).toBeVisible();
    });

    test(`${styleClass} applies correct CSS class to wrapper`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(pricing(hook)).first()).toHaveClass(
        new RegExp(styleClass)
      );
    });

    test(`${styleClass} renders pricing card`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(card(hook)).first()).toBeVisible();
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Style 2 — icon in header
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Style 2 — header icon", () => {
  const hook = "test-pt-style-2";

  test("renders .eael-pricing-icon wrapper", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-pricing-icon`).first()
    ).toBeVisible();
  });

  test("renders icon .icon span inside .eael-pricing-icon", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-pricing-icon .icon`).first()
    ).toBeAttached();
  });

  test("renders subtitle text", async ({ page }) => {
    await openPage(page);
    const sub = await page
      .locator(`.${hook} .eael-pricing-item .subtitle`)
      .first()
      .textContent();
    expect(sub?.trim()).toBe("Best for teams");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. List icon configuration
// ══════════════════════════════════════════════════════════════════════════════

test.describe("List icon configuration", () => {
  test("icon-on (default): .li-icon is rendered for each item", async ({ page }) => {
    await openPage(page);
    const icons = page.locator(listIcon("test-pt-default"));
    await expect(icons.first()).toBeVisible();
  });

  test("icon-off: .li-icon is NOT rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(listIcon("test-pt-icon-off"))).toHaveCount(0);
  });

  test("icon-right: feature items are still rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(featureList("test-pt-icon-right")).first()).toBeVisible();
  });

  test("icon-right: .li-icon appears inside feature items", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(listIcon("test-pt-icon-right")).first()).toBeVisible();
  });

  test("disabled item gets .disable-item class", async ({ page }) => {
    await openPage(page);
    // Third default item has eael_pricing_table_icon_mood = 'no'
    const disabledItems = page.locator(`.test-pt-default .eael-pricing-item-feature.disable-item`);
    await expect(disabledItems.first()).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Featured / Ribbon
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Featured / Ribbon", () => {
  test("ribbon-1: card has .featured class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(card("test-pt-ribbon-1")).first()).toHaveClass(
      /featured/
    );
  });

  test("ribbon-1: card has .ribbon-1 class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(card("test-pt-ribbon-1")).first()).toHaveClass(
      /ribbon-1/
    );
  });

  test("ribbon-2: card has .ribbon-2 class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(card("test-pt-ribbon-2")).first()).toHaveClass(
      /ribbon-2/
    );
  });

  test("non-featured card does NOT have .featured class", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(card("test-pt-default")).first().getAttribute("class") ?? "";
    expect(cls).not.toContain("featured");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Button behaviour
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Button behaviour", () => {
  test("button is rendered when enabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(button("test-pt-default")).first()).toBeVisible();
  });

  test("button is NOT rendered when hidden", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(button("test-pt-btn-hide"))).toHaveCount(0);
  });

  test("button text matches configured value", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(button("test-pt-default")).first().textContent();
    expect(text?.trim()).toBe("Choose Plan");
  });

  test("default button href is '#'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(button("test-pt-default")).first()).toHaveAttribute(
      "href", "#"
    );
  });

  test("external button has target='_blank'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(button("test-pt-btn-external")).first()).toHaveAttribute(
      "target", "_blank"
    );
  });

  test("external button href points to configured URL", async ({ page }) => {
    await openPage(page);
    const href = await page.locator(button("test-pt-btn-external")).first().getAttribute("href");
    expect(href).toContain("essential-addons.com");
  });

  test("nofollow button has rel containing 'nofollow'", async ({ page }) => {
    await openPage(page);
    const rel = await page.locator(button("test-pt-btn-nofollow")).first().getAttribute("rel");
    expect(rel).toContain("nofollow");
  });

  test("non-external button has no target='_blank'", async ({ page }) => {
    await openPage(page);
    const target = await page.locator(button("test-pt-default")).first().getAttribute("target");
    expect(target).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. On-sale pricing
// ══════════════════════════════════════════════════════════════════════════════

test.describe("On-sale pricing", () => {
  const hook = "test-pt-onsale";

  test("renders .original-price element (strikethrough)", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .original-price`).first()
    ).toBeAttached();
  });

  test("renders .sale-price element", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .sale-price`).first()
    ).toBeAttached();
  });

  test("sale price shows the discounted amount", async ({ page }) => {
    await openPage(page);
    const saleText = await page.locator(`.${hook} .sale-price`).first().textContent();
    expect(saleText).toContain("79");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. Element structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("title is rendered as <h2> by default", async ({ page }) => {
    await openPage(page);
    const tag = await page.locator(title("test-pt-default")).first().evaluate(
      (el) => el.tagName
    );
    expect(tag).toBe("H2");
  });

  test("button is rendered as an <a> tag", async ({ page }) => {
    await openPage(page);
    const tag = await page.locator(button("test-pt-default")).first().evaluate(
      (el) => el.tagName
    );
    expect(tag).toBe("A");
  });

  test("feature list is rendered as <ul>", async ({ page }) => {
    await openPage(page);
    const tag = await page.locator(`.test-pt-default .body ul`).first().evaluate(
      (el) => el.tagName
    );
    expect(tag).toBe("UL");
  });

  test("feature list items are rendered as <li>", async ({ page }) => {
    await openPage(page);
    const tag = await page.locator(featureList("test-pt-default")).first().evaluate(
      (el) => el.tagName
    );
    expect(tag).toBe("LI");
  });

  test("outer wrapper has eael-pricing class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(pricing("test-pt-default")).first()).toHaveClass(
      /eael-pricing/
    );
  });

  test("pricing wrapper style class is one of the known free styles", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(pricing("test-pt-default")).first().getAttribute("class") ?? "";
    const hasStyle = FREE_STYLES.some((s) => cls.includes(s));
    expect(hasStyle, `Unknown style in: "${cls}"`).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("button is keyboard-focusable", async ({ page }) => {
    await openPage(page);
    const btn = page.locator(button("test-pt-default")).first();
    await btn.focus();
    await expect(btn).toBeFocused();
  });

  test("hover on each free-style widget triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of ["test-pt-default", "test-pt-style-2", "test-pt-icon-off", "test-pt-icon-right"]) {
      await page.locator(card(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking default button (#) causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(button("test-pt-default")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});

  }
});
