/**
 * Covered: Essential Addons — Image Accordion widget
 *
 * 1. Page health        — HTTP 200, no PHP errors, no JS errors
 * 2. Accordion type     — on-hover / on-click via data-img-accordion-type; 3 items
 * 3. Direction          — horizontal / vertical class
 * 4. Content alignment  — horizontal: center/left/right;
 *                         vertical: center/top/bottom via eael-img-accordion-*-align-*
 * 5. Active item        — overlay-active class; overlay-inner-show class;
 *                         no overlay-active on default
 * 6. Link behaviour     — external target="_blank" href example.com; nofollow; disabled (no <a>)
 * 7. Element structure  — titles "City Lights"/"Ocean Breeze"/"Mountain Peak";
 *                         h2 default/h3/span title tags; overlay divs match item count;
 *                         tabindex=0; data-img-accordion-id
 * 8. Interaction        — hover / click to open (no JS errors); keyboard focus
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.IMAGE_ACCORDION_PAGE_SLUG ?? "image-accordion"}/`;

// -- selectors -----------------------------------------------------------
// DOM shape (from Image_Accordion::render()):
//   .{hook}                                    ← elementor-widget wrapper
//     div.eael-img-accordion                   ← main wrapper
//       [class: accordion-direction-horizontal | accordion-direction-vertical]
//       [class: eael-img-accordion-horizontal-align-{left|center|right}]
//       [class: eael-img-accordion-vertical-align-{top|center|bottom}]
//       [data-img-accordion-type="on-hover|on-click"]
//         div.eael-image-accordion-hover.eael-image-accordion-item  ← per item
//           [class: overlay-active  (if item is active)]
//           div.overlay
//             div.overlay-inner
//               {h2|h3|...}.img-accordion-title   ← title
//               <p>                               ← content
//               <a>                               ← conditional link wrapper

const accordion = (hook: string) => `.${hook} .eael-img-accordion`;
const items     = (hook: string) => `.${hook} .eael-image-accordion-item`;
const overlay   = (hook: string) => `.${hook} .overlay`;
const title     = (hook: string) => `.${hook} .img-accordion-title`;
const content   = (hook: string) => `.${hook} .overlay-inner p`;

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
// 2. Accordion type
// ============================================================================

test.describe("Accordion type", () => {
  test("default (on-hover) — data-img-accordion-type is 'on-hover'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(accordion("test-ia-default")).first()).toHaveAttribute(
      "data-img-accordion-type",
      "on-hover"
    );
  });

  test("on-click — data-img-accordion-type is 'on-click'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(accordion("test-ia-on-click")).first()).toHaveAttribute(
      "data-img-accordion-type",
      "on-click"
    );
  });

  test("default — renders 3 accordion items", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(items("test-ia-default"))).toHaveCount(3);
  });
});

// ============================================================================
// 3. Direction
// ============================================================================

test.describe("Direction", () => {
  test("horizontal (default) — wrapper has accordion-direction-horizontal class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(accordion("test-ia-default")).first()).toHaveClass(
      /accordion-direction-horizontal/
    );
  });

  test("vertical — wrapper has accordion-direction-vertical class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(accordion("test-ia-vertical")).first()).toHaveClass(
      /accordion-direction-vertical/
    );
  });
});

// ============================================================================
// 4. Content alignment
// ============================================================================

test.describe("Content alignment", () => {
  const horizontalCases = [
    { hook: "test-ia-default",     cls: "eael-img-accordion-horizontal-align-center" },
    { hook: "test-ia-halign-left", cls: "eael-img-accordion-horizontal-align-left" },
    { hook: "test-ia-halign-right", cls: "eael-img-accordion-horizontal-align-right" },
  ] as const;

  for (const { hook, cls } of horizontalCases) {
    test(`${cls} is applied to ${hook}`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(accordion(hook)).first()).toHaveClass(
        new RegExp(cls)
      );
    });
  }

  const verticalCases = [
    { hook: "test-ia-default",      cls: "eael-img-accordion-vertical-align-center" },
    { hook: "test-ia-valign-top",    cls: "eael-img-accordion-vertical-align-top" },
    { hook: "test-ia-valign-bottom", cls: "eael-img-accordion-vertical-align-bottom" },
  ] as const;

  for (const { hook, cls } of verticalCases) {
    test(`${cls} is applied to ${hook}`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(accordion(hook)).first()).toHaveClass(
        new RegExp(cls)
      );
    });
  }
});

// ============================================================================
// 5. Active item
// ============================================================================

test.describe("Active item", () => {
  test("first item has overlay-active class when marked active", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(items("test-ia-active-item")).first()
    ).toHaveClass(/overlay-active/);
  });

  test("non-active items do not have overlay-active class", async ({ page }) => {
    await openPage(page);
    const second = page.locator(items("test-ia-active-item")).nth(1);
    const cls = (await second.getAttribute("class")) ?? "";
    expect(cls).not.toMatch(/overlay-active/);
  });

  test("active item's overlay-inner has overlay-inner-show class", async ({ page }) => {
    await openPage(page);
    const activeItem  = page.locator(items("test-ia-active-item")).first();
    const innerOverlay = activeItem.locator(".overlay-inner");
    await expect(innerOverlay).toHaveClass(/overlay-inner-show/);
  });

  test("default widget has no item pre-expanded (no overlay-active)", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`${accordion("test-ia-default")} .overlay-active`)
    ).toHaveCount(0);
  });
});

// ============================================================================
// 6. Link behaviour
// ============================================================================

test.describe("Link behaviour", () => {
  test("external link — first item renders an <a> with target=_blank", async ({ page }) => {
    await openPage(page);
    const link = page
      .locator(`${items("test-ia-link-external")}`)
      .first()
      .locator("a")
      .first();
    await expect(link).toHaveAttribute("target", "_blank");
  });

  test("external link — href points to example.com", async ({ page }) => {
    await openPage(page);
    const link = page
      .locator(`${items("test-ia-link-external")}`)
      .first()
      .locator("a")
      .first();
    const href = (await link.getAttribute("href")) ?? "";
    expect(href).toContain("example.com");
  });

  test("nofollow link — rel contains nofollow", async ({ page }) => {
    await openPage(page);
    const link = page
      .locator(`${items("test-ia-link-nofollow")}`)
      .first()
      .locator("a")
      .first();
    const rel = (await link.getAttribute("rel")) ?? "";
    expect(rel).toContain("nofollow");
  });

  test("link disabled — first item renders no <a> tag", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`${items("test-ia-link-disabled")}`).first().locator("a")
    ).toHaveCount(0);
  });
});

// ============================================================================
// 7. Element structure
// ============================================================================

test.describe("Element structure", () => {
  test("item titles are rendered with correct text", async ({ page }) => {
    await openPage(page);
    const texts = await page.locator(title("test-ia-default")).allTextContents();
    expect(texts.map((t) => t.trim())).toEqual(["City Lights", "Ocean Breeze", "Mountain Peak"]);
  });

  test("default title tag is h2", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(title("test-ia-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H2");
  });

  test("title tag h3 — renders as h3", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(title("test-ia-title-h3"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H3");
  });

  test("title tag span — renders as span", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(title("test-ia-title-span"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("SPAN");
  });

  test("each item has a .overlay div", async ({ page }) => {
    await openPage(page);
    const itemCount   = await page.locator(items("test-ia-default")).count();
    const overlayCount = await page.locator(overlay("test-ia-default")).count();
    expect(overlayCount).toBe(itemCount);
  });

  test("items have tabindex attribute for keyboard accessibility", async ({ page }) => {
    await openPage(page);
    const tabindexVal = await page
      .locator(items("test-ia-default"))
      .first()
      .getAttribute("tabindex");
    expect(tabindexVal).toBe("0");
  });

  test("main wrapper carries data-img-accordion-id attribute", async ({ page }) => {
    await openPage(page);
    const id = await page
      .locator(accordion("test-ia-default"))
      .first()
      .getAttribute("data-img-accordion-id");
    expect(id).not.toBeNull();
    expect(id!.length).toBeGreaterThan(0);
  });

  test("content paragraph is rendered inside overlay-inner", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(content("test-ia-default")).count();
    expect(count).toBeGreaterThan(0);
  });
});

// ============================================================================
// 8. Interaction
// ============================================================================

test.describe("Interaction", () => {
  test("click on on-click accordion item triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(items("test-ia-on-click")).first().click();
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover on all instances triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-ia-default",
      "test-ia-on-click",
      "test-ia-vertical",
      "test-ia-halign-left",
      "test-ia-halign-right",
      "test-ia-valign-top",
      "test-ia-valign-bottom",
      "test-ia-active-item",
      "test-ia-link-external",
      "test-ia-link-nofollow",
      "test-ia-link-disabled",
      "test-ia-title-h3",
      "test-ia-title-span",
    ]) {
      await page.locator(accordion(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
