/**
 * Covered: Essential Addons — NFT Gallery widget
 *
 * NOTE: These tests require valid OPEN_SEA_API and OPEN_SEA_COLLECTIONS
 * env vars (configured in GitHub Actions). Without them the widget renders
 * an error message and gallery-specific assertions will fail.
 *
 * 1. Page health       — HTTP 200, no PHP errors, no JS errors
 * 2. Layout types      — grid (preset-1), grid (preset-2), list
 *                        verified via CSS class on .eael-nft-gallery-items
 * 3. Content toggles   — title / current-price / image / chain-badge hidden
 * 4. Element structure — wrapper, items container, individual NFT items
 * 5. Load more button  — rendered; .eael-nft-gallery-loadmore-wrap present
 * 6. Interaction       — hover (no JS errors)
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.NFT_GALLERY_PAGE_SLUG ?? "nft-gallery"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from NFT_Gallery::print_nft_gallery() + print_nft_gallery_item_grid()):
//
// When API succeeds:
//   .{hook}                                      ← elementor-widget wrapper
//     .eael-nft-gallery-wrapper                  ← outer wrapper
//       .eael-nft-gallery-items                  ← items container
//         .eael-nft-grid | .eael-nft-list        ← layout class
//         .preset-1 | .preset-2                  ← preset class (grid only)
//           .eael-nft-item                       ← per-NFT card
//             .eael-nft-chain                    ← chain badge (optional)
//             .eael-nft-thumbnail                ← image wrapper
//               img
//             .eael-nft-main-content
//               .eael-nft-content
//                 h3.eael-nft-title              ← title (optional)
//                 .eael-nft-current-price-wrapper
//                   .eael-nft-current-price      ← price (optional)
//       .eael-nft-gallery-loadmore-wrap          ← load-more area (optional)
//
// When API fails:
//   .{hook}
//     p.eael-nft-gallery-error-message

const wrapper  = (hook: string) => `.${hook} .eael-nft-gallery-wrapper`;
const items    = (hook: string) => `.${hook} .eael-nft-gallery-items`;
const nftItem  = (hook: string) => `.${hook} .eael-nft-item`;
const errMsg   = (hook: string) => `.${hook} .eael-nft-gallery-error-message`;
const loadMore = (hook: string) => `.${hook} .eael-nft-gallery-loadmore-wrap`;

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
// 2. Layout types
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Layout types", () => {
  const layoutMap: Record<string, { layoutClass: string; presetClass?: string }> = {
    "test-ng-default":  { layoutClass: "eael-nft-grid",  presetClass: "preset-1" },
    "test-ng-preset-2": { layoutClass: "eael-nft-grid",  presetClass: "preset-2" },
    "test-ng-list":     { layoutClass: "eael-nft-list" },
  };

  for (const [hook, { layoutClass, presetClass }] of Object.entries(layoutMap)) {
    test(`${hook}: gallery wrapper is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrapper(hook)).first()).toBeVisible();
    });

    test(`${hook}: items container has layout class "${layoutClass}"`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(items(hook)).first()).toHaveClass(
        new RegExp(layoutClass)
      );
    });

    if (presetClass) {
      test(`${hook}: items container has preset class "${presetClass}"`, async ({ page }) => {
        await openPage(page);
        await expect(page.locator(items(hook)).first()).toHaveClass(
          new RegExp(presetClass)
        );
      });
    }

    test(`${hook}: at least one NFT item is rendered`, async ({ page }) => {
      await openPage(page);
      const count = await page.locator(nftItem(hook)).count();
      expect(count, `Expected ≥1 .eael-nft-item in ${hook}`).toBeGreaterThan(0);
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Content toggles
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Content toggles — title", () => {
  test("test-ng-default: .eael-nft-title is visible", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ng-default .eael-nft-title").first()
    ).toBeVisible();
  });

  test("test-ng-no-title: .eael-nft-title is not rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ng-no-title .eael-nft-title")
    ).toHaveCount(0);
  });
});

test.describe("Content toggles — current price", () => {
  test("test-ng-default: .eael-nft-current-price-wrapper is present", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ng-default .eael-nft-current-price-wrapper").first()
    ).toBeAttached();
  });

  test("test-ng-no-price: .eael-nft-current-price-wrapper is not rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ng-no-price .eael-nft-current-price-wrapper")
    ).toHaveCount(0);
  });
});

test.describe("Content toggles — thumbnail", () => {
  test("test-ng-default: .eael-nft-thumbnail is visible", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ng-default .eael-nft-thumbnail").first()
    ).toBeVisible();
  });

  test("test-ng-no-image: .eael-nft-thumbnail img is not rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ng-no-image .eael-nft-thumbnail img")
    ).toHaveCount(0);
  });
});

test.describe("Content toggles — chain badge", () => {
  test("test-ng-default: .eael-nft-chain is visible", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ng-default .eael-nft-chain").first()
    ).toBeVisible();
  });

  test("test-ng-no-chain: .eael-nft-chain is not rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ng-no-chain .eael-nft-chain")
    ).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Element structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("wrapper has data-posts-per-page attribute", async ({ page }) => {
    await openPage(page);
    const attr = await page
      .locator(".test-ng-default .eael-nft-gallery-wrapper")
      .first()
      .getAttribute("data-posts-per-page");
    expect(attr).toBeTruthy();
  });

  test("items container has an id starting with eael-nft-gallery-", async ({ page }) => {
    await openPage(page);
    const id = await page
      .locator(items("test-ng-default"))
      .first()
      .getAttribute("id");
    expect(id).toMatch(/^eael-nft-gallery-/);
  });

  test("each NFT item contains .eael-nft-thumbnail", async ({ page }) => {
    await openPage(page);
    const firstItem = page.locator(".test-ng-default .eael-nft-item").first();
    await expect(firstItem.locator(".eael-nft-thumbnail")).toBeAttached();
  });

  test("each NFT item contains .eael-nft-content", async ({ page }) => {
    await openPage(page);
    const firstItem = page.locator(".test-ng-default .eael-nft-item").first();
    await expect(firstItem.locator(".eael-nft-content")).toBeAttached();
  });

  test("preset-2 items container has preset-2 class", async ({ page }) => {
    await openPage(page);
    const cls = await page
      .locator(items("test-ng-preset-2"))
      .first()
      .getAttribute("class");
    expect(cls).toContain("preset-2");
  });

  test("list layout items container always carries preset-1 class (EA default)", async ({ page }) => {
    await openPage(page);
    const cls = await page
      .locator(items("test-ng-list"))
      .first()
      .getAttribute("class");
    // The widget unconditionally applies preset-1 as a fallback even for list layout.
    expect(cls).toContain("preset-1");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Load more button
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Load more button", () => {
  test("test-ng-load-more: .eael-nft-gallery-loadmore-wrap is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(loadMore("test-ng-load-more")).first()).toBeAttached();
  });

  test("test-ng-load-more: load-more button contains 'Load More' text", async ({ page }) => {
    await openPage(page);
    const btnText = await page
      .locator(".test-ng-load-more .eael-nft-gallery-loadmore-wrap")
      .first()
      .textContent();
    expect(btnText?.trim()).toContain("Load More");
  });

  test("test-ng-default: no .eael-nft-gallery-loadmore-wrap without pagination", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ng-default .eael-nft-gallery-loadmore-wrap")
    ).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover on default gallery items triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    const itemCount = await page.locator(".test-ng-default .eael-nft-item").count();
    for (let i = 0; i < Math.min(itemCount, 3); i++) {
      await page.locator(".test-ng-default .eael-nft-item").nth(i).hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover on list-layout gallery triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    const itemCount = await page.locator(".test-ng-list .eael-nft-item").count();
    for (let i = 0; i < Math.min(itemCount, 2); i++) {
      await page.locator(".test-ng-list .eael-nft-item").nth(i).hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("chain badge button is visible and focusable", async ({ page }) => {
    await openPage(page);
    const chainBtn = page
      .locator(".test-ng-default .eael-nft-chain .eael-nft-chain-button")
      .first();
    await expect(chainBtn).toBeVisible();
    await chainBtn.focus();
    await expect(chainBtn).toBeFocused();
  });
});
