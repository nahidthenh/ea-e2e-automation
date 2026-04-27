import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.MULTICOLUMN_PRICING_TABLE_PAGE_SLUG ?? "multicolumn-pricing-table"}/`;

// ── selectors ─────────────────────────────────────────────────────────────────
// DOM shape (from Multicolumn_Pricing_Table::render()):
//   .{hook}                                         ← elementor-widget wrapper
//     .eael-multicolumn-pricing-table-wrapper       ← EA outer wrapper
//       .eael-multicolumn-pricing-table             ← table container
//         .eael-mcpt-columns                        ← columns wrapper
//           .eael-mcpt-column.eael-mcpt-column-0   ← title column
//             .eael-mcpt-cell.eael-mcpt-corner-cell
//             .eael-mcpt-cell.eael-mcpt-title-cell  ← one per feature
//               .eael-mcpt-feature-title
//           .eael-mcpt-column.eael-mcpt-column-N   ← package column
//             .eael-mcpt-featured-badge             ← if featured
//             .eael-mcpt-cell.eael-mcpt-package
//               .eael-mcpt-package-title            ← h2 (or configured tag)
//               .eael-mcpt-package-prices
//                 .eael-mcpt-package-price
//                 .eael-mcpt-package-old-price      ← if sale price set
//                 .eael-mcpt-package-period
//               .eael-mcpt-buy-button-wrapper       ← retro layout only
//                 a.eael-mcpt-buy-button
//           .eael-mcpt-column.eael-mcpt-column-N   ← modern: button in separate cell
//             .eael-mcpt-cell.eael-mcpt-button-cell
//               .eael-mcpt-buy-button-wrapper
//                 a.eael-mcpt-buy-button
//     .eael-mcpt-collaps                           ← if collapse enabled

const wrapper = (hook: string) =>
  `.${hook} .eael-multicolumn-pricing-table-wrapper`;
const table = (hook: string) =>
  `.${hook} .eael-multicolumn-pricing-table`;
const columns = (hook: string) =>
  `.${hook} .eael-mcpt-columns`;
const titleColumn = (hook: string) =>
  `.${hook} .eael-mcpt-column-0`;
const buyButton = (hook: string) =>
  `.${hook} .eael-mcpt-buy-button`;
const packageCell = (hook: string) =>
  `.${hook} .eael-mcpt-package:not(.eael-mcpt-title-cell)`;
const collapseEl = (hook: string) =>
  `.${hook} .eael-mcpt-collaps`;

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
// 2. Layout variants
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Layout variants", () => {
  const layoutMap: Record<string, string> = {
    "test-mpt-default": "retro-layout",
    "test-mpt-modern":  "modern-layout",
  };

  for (const [hook, layoutClass] of Object.entries(layoutMap)) {
    test(`${layoutClass}: wrapper is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrapper(hook)).first()).toBeVisible();
    });

    test(`${layoutClass}: wrapper has correct layout class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrapper(hook)).first()).toHaveClass(
        new RegExp(layoutClass)
      );
    });

    test(`${layoutClass}: table container is rendered`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(table(hook)).first()).toBeVisible();
    });

    test(`${layoutClass}: package columns are rendered`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(columns(hook)).first()).toBeVisible();
    });
  }

  test("retro layout: buy button is inside .eael-mcpt-package cell", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-mpt-default .eael-mcpt-package .eael-mcpt-buy-button").first()
    ).toBeVisible();
  });

  test("modern layout: buy button is inside .eael-mcpt-button-cell", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-mpt-modern .eael-mcpt-button-cell .eael-mcpt-buy-button").first()
    ).toBeVisible();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Package content — default instance
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Package content", () => {
  const hook = "test-mpt-default";

  test("Silver package title is rendered", async ({ page }) => {
    await openPage(page);
    const titles = page.locator(`.${hook} .eael-mcpt-package-title`);
    const texts = await titles.allTextContents();
    expect(texts.some((t) => t.trim() === "Silver")).toBe(true);
  });

  test("Bronze package title is rendered", async ({ page }) => {
    await openPage(page);
    const titles = page.locator(`.${hook} .eael-mcpt-package-title`);
    const texts = await titles.allTextContents();
    expect(texts.some((t) => t.trim() === "Bronze")).toBe(true);
  });

  test("Gold package title is rendered", async ({ page }) => {
    await openPage(page);
    const titles = page.locator(`.${hook} .eael-mcpt-package-title`);
    const texts = await titles.allTextContents();
    expect(texts.some((t) => t.trim() === "Gold")).toBe(true);
  });

  test("feature titles column (column-0) is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(titleColumn(hook)).first()).toBeVisible();
  });

  test("feature title 'Total Features' is visible", async ({ page }) => {
    await openPage(page);
    const featureTitles = page.locator(`.${hook} .eael-mcpt-feature-title`);
    const texts = await featureTitles.allTextContents();
    expect(texts.some((t) => t.trim() === "Total Features")).toBe(true);
  });

  test("price cells (.eael-mcpt-package-price) are rendered", async ({ page }) => {
    await openPage(page);
    const prices = page.locator(`.${hook} .eael-mcpt-package-price`);
    expect(await prices.count()).toBeGreaterThan(0);
  });

  test("period cells (.eael-mcpt-package-period) are rendered", async ({ page }) => {
    await openPage(page);
    const periods = page.locator(`.${hook} .eael-mcpt-package-period`);
    expect(await periods.count()).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Featured badge
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Featured badge", () => {
  const hook = "test-mpt-featured";

  test("featured badge element is visible", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-mcpt-featured-badge`).first()
    ).toBeVisible();
  });

  test("featured badge text reads 'Best Value'", async ({ page }) => {
    await openPage(page);
    const badgeText = await page
      .locator(`.${hook} .eael-mcpt-featured-badge-text`)
      .first()
      .textContent();
    expect(badgeText?.trim()).toBe("Best Value");
  });

  test("featured column has .eael-mcpt-featured-column class", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-mcpt-featured-column`).first()
    ).toBeAttached();
  });

  test("columns wrapper has .has-featured class", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-mcpt-columns`).first()
    ).toHaveClass(/has-featured/);
  });

  test("non-featured packages do not have .eael-mcpt-featured-column", async ({ page }) => {
    await openPage(page);
    const featuredCols = page.locator(`.${hook} .eael-mcpt-featured-column`);
    expect(await featuredCols.count()).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Collapse feature rows
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Collapse feature rows", () => {
  const hook = "test-mpt-collapse";

  test("wrapper has .collapsable class when collapse is enabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrapper(hook)).first()).toHaveClass(/collapsable/);
  });

  test(".eael-mcpt-collaps toggle element is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(collapseEl(hook)).first()).toBeVisible();
  });

  test("collapse toggle starts in collapsed state", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(collapseEl(hook)).first()).toHaveClass(/collapsed/);
  });

  test("'See More' label is visible in collapsed state", async ({ page }) => {
    await openPage(page);
    const showLabel = page
      .locator(`.${hook} .eael-mcpt-collaps-label.collaps.show`)
      .first();
    await expect(showLabel).toBeAttached();
  });

  test("wrapper has data-row attribute matching configured rows", async ({ page }) => {
    await openPage(page);
    const dataRow = await page
      .locator(wrapper(hook))
      .first()
      .getAttribute("data-row");
    expect(dataRow).toBe("2");
  });

  test("clicking collapse toggle removes .collapsed class", async ({ page }) => {
    await openPage(page);
    const toggle = page.locator(collapseEl(hook)).first();
    await toggle.click();
    await expect(toggle).not.toHaveClass(/collapsed/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Sale price
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Sale price", () => {
  const hook = "test-mpt-sale";

  test("old price element (.eael-mcpt-package-old-price) is rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-mcpt-package-old-price`).first()
    ).toBeVisible();
  });

  test("sale price element (.eael-mcpt-package-price) is rendered alongside old price", async ({ page }) => {
    await openPage(page);
    const priceWrapper = page.locator(`.${hook} .eael-mcpt-package-prices`).last();
    await expect(priceWrapper.locator(".eael-mcpt-package-price").first()).toBeVisible();
    await expect(priceWrapper.locator(".eael-mcpt-package-old-price").first()).toBeVisible();
  });

  test("packages without sale price do not render .eael-mcpt-package-old-price", async ({ page }) => {
    await openPage(page);
    const silverCol = page.locator(`.${hook} .eael-mcpt-column-1`).first();
    await expect(silverCol.locator(".eael-mcpt-package-old-price")).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Package title tag
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Package title tag", () => {
  test("title tag h3: package titles are rendered as <h3>", async ({ page }) => {
    await openPage(page);
    const hook = "test-mpt-tag-h3";
    const titleTag = await page
      .locator(`.${hook} .eael-mcpt-package-title`)
      .first()
      .evaluate((el) => el.tagName);
    expect(titleTag).toBe("H3");
  });

  test("default title tag: package titles are rendered as <h2>", async ({ page }) => {
    await openPage(page);
    const hook = "test-mpt-default";
    const titleTag = await page
      .locator(`.${hook} .eael-mcpt-package-title`)
      .first()
      .evaluate((el) => el.tagName);
    expect(titleTag).toBe("H2");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Link behaviour
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Link behaviour", () => {
  test("default button href is '#'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(buyButton("test-mpt-default")).first()
    ).toHaveAttribute("href", "#");
  });

  test("external button has target='_blank'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(buyButton("test-mpt-external")).first()
    ).toHaveAttribute("target", "_blank");
  });

  test("external button href points to configured URL", async ({ page }) => {
    await openPage(page);
    const href = await page
      .locator(buyButton("test-mpt-external"))
      .first()
      .getAttribute("href");
    expect(href).toContain("essential-addons.com");
  });

  test("nofollow button has rel containing 'nofollow'", async ({ page }) => {
    await openPage(page);
    const rel = await page
      .locator(buyButton("test-mpt-nofollow"))
      .first()
      .getAttribute("rel");
    expect(rel).toContain("nofollow");
  });

  test("non-external button has no target='_blank'", async ({ page }) => {
    await openPage(page);
    const target = await page
      .locator(buyButton("test-mpt-default"))
      .first()
      .getAttribute("target");
    expect(target).toBeNull();
  });

  test("button disabled: no .eael-mcpt-buy-button rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(buyButton("test-mpt-no-btn"))
    ).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. Element structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  const hook = "test-mpt-default";

  test(".eael-multicolumn-pricing-table-wrapper is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrapper(hook)).first()).toBeAttached();
  });

  test(".eael-multicolumn-pricing-table table container is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(table(hook)).first()).toBeAttached();
  });

  test(".eael-mcpt-column-0 title column is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(titleColumn(hook)).first()).toBeAttached();
  });

  test("package columns .eael-mcpt-column-1 through -3 are rendered", async ({ page }) => {
    await openPage(page);
    for (const n of [1, 2, 3]) {
      await expect(
        page.locator(`.${hook} .eael-mcpt-column-${n}`).first()
      ).toBeAttached();
    }
  });

  test("wrapper has data-column attribute equal to package count + 1", async ({ page }) => {
    await openPage(page);
    const dataCol = await page
      .locator(wrapper(hook))
      .first()
      .getAttribute("data-column");
    expect(dataCol).toBe("4"); // 3 packages + 1 title column
  });

  test("buy buttons are rendered as <a> tags", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(buyButton(hook))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("A");
  });

  test(".eael-mcpt-cell.eael-mcpt-corner-cell is rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-mcpt-corner-cell`).first()
    ).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("buy button is keyboard-focusable", async ({ page }) => {
    await openPage(page);
    const btn = page.locator(buyButton("test-mpt-default")).first();
    await btn.focus();
    await expect(btn).toBeFocused();
  });

  test("hover on each layout instance triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of ["test-mpt-default", "test-mpt-modern", "test-mpt-featured"]) {
      await page.locator(wrapper(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking default buy button causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(buyButton("test-mpt-default")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
