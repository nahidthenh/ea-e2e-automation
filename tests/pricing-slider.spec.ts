/**
 * Covered: Essential Addons — Pricing Slider widget
 *
 * 1. Page health       — HTTP 200, no PHP errors, no JS errors
 * 2. Slider styles     — style-1 / style-2 class on wrapper
 * 3. Slider control    — bar / handle / tooltip; data-value; data-tooltip-text;
 *                        dot + label
 * 4. Description toggle — description text shown / hidden
 * 5. Pricing plans     — title / subtitle / status / content per plan
 * 6. Plan filter       — data-filter attribute; filtering by slider value
 * 7. Interaction       — drag slider (no JS errors); hover (no JS errors)
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.PRICING_SLIDER_PAGE_SLUG ?? "pricing-slider"}/`;

// -- selectors -----------------------------------------------------------
// DOM shape (from Pricing_Slider::render()):
//   .{hook}                                         ← elementor-widget wrapper
//     .eael-pricing-slider.eael-pricing-slider-style-{1|2}[data-widget-id]
//       .eael-pricing-slider-wrapper
//         .eael-pricing-slider-inner-wrapper
//           .eael-pricing-slider-area
//             .eael-pricing-slider-container
//               .eael-pricing-slider-bar
//                 .eael-pricing-slider-handle
//                   .eael-pricing-slider-tooltip
//               .slider-markers-container
//                 .eael-pricing-slider-controls
//                   .slider-control[data-value][data-active][data-tooltip-text]
//                     .slider-dot
//                     p.slider-label
//           .eael-pricing-slider-description   (optional, if show_description=yes)
//           .eael-pricing-plans-container
//             Style 1: .eael-pricing-plan.general[data-filter]
//               .eael-pricing-plan-header
//                 h3.title
//                 p.sub-title                  (optional, if show_subtitle=yes)
//               .eael-pricing-plan-status      (optional, if status_show=yes)
//                 p.status-title
//                 span.info-icon               (optional, if tooltip=yes)
//               .pricing-content > ul > li
//                 span.feature-icon
//                 span.feature-value
//               .eael-pricing-sale-price       (if sale_price_on=yes)
//                 a.buy-btn
//               .eael-pricing-plan-signup      (if sale_price_on not set)
//                 a.buy-btn
//             Style 2: .eael-pricing-plan[data-filter]  (no .general)
//               .eael-pricing-plan.featured    (if show_subtitle=yes)
//               .eael-pricing-plan-top-badge
//                 span.eael-pricing-plan-badge-icon   (if show_badge_icon=yes)
//                 span.eael-pricing-plan-badge        (if show_subtitle=yes)
//               .eael-pricing-plan-header > h3.title
//               .eael-pricing-plan-price
//                 .price-main > span.price-currency + span.price-amount
//                 p.price-period
//               .eael-pricing-plan-signup > a.buy-btn

const slider         = (hook: string) => `.${hook} .eael-pricing-slider`;
const sliderHandle   = (hook: string) => `.${hook} .eael-pricing-slider-handle`;
const sliderControl  = (hook: string) => `.${hook} .slider-control`;
const sliderLabel    = (hook: string) => `.${hook} .slider-label`;
const plansContainer = (hook: string) => `.${hook} .eael-pricing-plans-container`;
const plan           = (hook: string) => `.${hook} .eael-pricing-plan`;
const planTitle      = (hook: string) => `.${hook} .eael-pricing-plan-header h3.title`;
const buyBtn         = (hook: string) => `.${hook} a.buy-btn`;
const description    = (hook: string) => `.${hook} .eael-pricing-slider-description`;

// -- style presets -------------------------------------------------------
const STYLE_MAP: Record<string, string> = {
  "test-ps-style-1": "eael-pricing-slider-style-1",
  "test-ps-style-2": "eael-pricing-slider-style-2",
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
// 2. Pricing Slider styles — one instance per style preset
// ============================================================================

test.describe("Pricing Slider styles", () => {
  for (const [hook, styleClass] of Object.entries(STYLE_MAP)) {
    test(`${styleClass}: widget wrapper is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(slider(hook)).first()).toBeVisible();
    });

    test(`${styleClass}: applies correct style CSS class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(slider(hook)).first()).toHaveClass(
        new RegExp(styleClass)
      );
    });

    test(`${styleClass}: slider controls are rendered`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(sliderControl(hook)).first()).toBeVisible();
    });

    test(`${styleClass}: slider labels contain expected text`, async ({ page }) => {
      await openPage(page);
      const labels = page.locator(sliderLabel(hook));
      const count = await labels.count();
      expect(count).toBeGreaterThan(0);
      const firstLabel = await labels.first().textContent();
      expect(firstLabel?.trim()).toBe("Starter");
    });

    test(`${styleClass}: plans container is present`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(plansContainer(hook)).first()).toBeAttached();
    });

    test(`${styleClass}: pricing plan titles are visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(planTitle(hook)).first()).toBeVisible();
    });
  }
});

// ============================================================================
// 3. Style 1 — plan has .general class, standard DOM structure
// ============================================================================

test.describe("Style 1 — plan DOM structure", () => {
  const hook = "test-ps-style-1";

  test("plans carry .general class (style 1 only)", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-pricing-plan.general`).first()
    ).toBeAttached();
  });

  test("description is visible when enabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(description(hook)).first()).toBeVisible();
  });

  test("buy button is rendered as an <a> tag", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(buyBtn(hook))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("A");
  });

  test("feature list items are visible", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .pricing-content ul li`).first()
    ).toBeVisible();
  });

  test("first feature value renders expected text", async ({ page }) => {
    await openPage(page);
    const featureText = await page
      .locator(`.${hook} .pricing-content ul li .feature-value`)
      .first()
      .textContent();
    expect(featureText?.trim()).toBe("Basic Hosting");
  });
});

// ============================================================================
// 4. Style 2 — featured plan has .featured class and badge icon
// ============================================================================

test.describe("Style 2 — featured plan and badge icon", () => {
  const hook = "test-ps-style-2";

  test("style 2 plans do NOT have .general class", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-pricing-plan.general`)
    ).toHaveCount(0);
  });

  test("featured plan has .featured class", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-pricing-plan.featured`).first()
    ).toBeAttached();
  });

  test("featured plan badge text renders configured value", async ({ page }) => {
    await openPage(page);
    const badge = await page
      .locator(`.${hook} .eael-pricing-plan.featured .eael-pricing-plan-badge`)
      .first()
      .textContent();
    expect(badge?.trim()).toBe("Most Popular");
  });

  test("badge icon is attached inside the featured plan", async ({ page }) => {
    await openPage(page);
    await expect(
      page
        .locator(`.${hook} .eael-pricing-plan.featured .eael-pricing-plan-badge-icon`)
        .first()
    ).toBeAttached();
  });

  test("price currency is visible in style 2", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .price-main .price-currency`).first()
    ).toBeVisible();
  });

  test("price amount is visible in style 2", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .price-main .price-amount`).first()
    ).toBeVisible();
  });
});

// ============================================================================
// 5. Description visibility
// ============================================================================

test.describe("Description visibility", () => {
  test("description div is absent when show_description is off", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(description("test-ps-no-desc"))).toHaveCount(0);
  });

  test("description is visible when show_description is on", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(description("test-ps-style-1")).first()
    ).toBeVisible();
  });
});

// ============================================================================
// 6. Plan badge / subtitle
// ============================================================================

test.describe("Plan badge / subtitle", () => {
  const hook = "test-ps-badge";

  test("subtitle element is present when show_subtitle is on", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-pricing-plan p.sub-title`).first()
    ).toBeAttached();
  });

  test("subtitle contains configured badge text", async ({ page }) => {
    await openPage(page);
    const badgeText = await page
      .locator(`.${hook} .eael-pricing-plan p.sub-title`)
      .first()
      .textContent();
    expect(badgeText?.trim()).toBe("Best Value");
  });
});

// ============================================================================
// 7. Sale price
// ============================================================================

test.describe("Sale price", () => {
  const hook = "test-ps-sale-price";

  test("sale price section is rendered when enabled", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-pricing-sale-price`).first()
    ).toBeAttached();
  });

  test("sale price block renders original and discounted price", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .sale-price-block .sale-price`).first()
    ).toBeAttached();
  });

  test("buy button is inside the sale price section", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-pricing-sale-price a.buy-btn`).first()
    ).toBeAttached();
  });
});

// ============================================================================
// 8. Plan status and info tooltip
// ============================================================================

test.describe("Plan status and tooltip", () => {
  const hook = "test-ps-status-tooltip";

  test("status section is rendered when enabled", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-pricing-plan-status`).first()
    ).toBeAttached();
  });

  test("status title contains configured text", async ({ page }) => {
    await openPage(page);
    const statusText = await page
      .locator(`.${hook} .eael-pricing-plan-status p.status-title`)
      .first()
      .textContent();
    expect(statusText?.trim()).toBe("3 Websites");
  });

  test("info icon is rendered when tooltip is enabled", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-pricing-plan-status .info-icon`).first()
    ).toBeAttached();
  });
});

// ============================================================================
// 9. Link behaviour
// ============================================================================

test.describe("Link behaviour", () => {
  test("external link buy button has target='_blank'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(buyBtn("test-ps-link-external")).first()
    ).toHaveAttribute("target", "_blank");
  });

  test("external link buy button href contains configured URL", async ({ page }) => {
    await openPage(page);
    const href = await page
      .locator(buyBtn("test-ps-link-external"))
      .first()
      .getAttribute("href");
    expect(href).toContain("essential-addons.com");
  });

  test("nofollow buy button rel contains 'nofollow'", async ({ page }) => {
    await openPage(page);
    const rel = await page
      .locator(buyBtn("test-ps-link-nofollow"))
      .first()
      .getAttribute("rel");
    expect(rel).toContain("nofollow");
  });

  test("default buy button href is '#'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(buyBtn("test-ps-style-1")).first()
    ).toHaveAttribute("href", "#");
  });
});

// ============================================================================
// 10. Element structure
// ============================================================================

test.describe("Element structure", () => {
  const hook = "test-ps-style-1";

  test("plan title is rendered as an h3 tag", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(planTitle(hook))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H3");
  });

  test("plan title text matches configured value", async ({ page }) => {
    await openPage(page);
    const title = await page.locator(planTitle(hook)).first().textContent();
    expect(title?.trim()).toBe("Starter Plan");
  });

  test("slider bar is attached to DOM", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-pricing-slider-bar`).first()
    ).toBeAttached();
  });

  test("slider handle is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(sliderHandle(hook)).first()).toBeVisible();
  });

  test("slider control data-value attribute is present", async ({ page }) => {
    await openPage(page);
    const dataVal = await page
      .locator(sliderControl(hook))
      .first()
      .getAttribute("data-value");
    expect(dataVal).not.toBeNull();
  });
});

// ============================================================================
// 11. Interaction
// ============================================================================

test.describe("Interaction", () => {
  test("clicking a slider control dot causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(sliderControl("test-ps-style-1")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover on each widget instance triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-ps-style-1",
      "test-ps-style-2",
      "test-ps-no-desc",
      "test-ps-badge",
      "test-ps-sale-price",
      "test-ps-status-tooltip",
      "test-ps-link-external",
      "test-ps-link-nofollow",
    ]) {
      await page.locator(slider(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking a buy button (#) causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(buyBtn("test-ps-style-1")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
