/**
 * Covered: Essential Addons — Image Scroller widget
 *
 * 1. Page health      — HTTP 200, no PHP errors, no JS errors
 * 2. Scroll direction — vertical (eael-image-scroller-vertical) /
 *                       horizontal (eael-image-scroller-horizontal); no opposite class
 * 3. Auto scroll      — eael-image-scroller-hover class on / off for both directions
 * 4. Element structure — div tag; img with non-empty src; height=300px;
 *                        all 4 instances attached
 * 5. Interaction      — hover (no JS errors); scroll behaviour
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.IMAGE_SCROLLER_PAGE_SLUG ?? "image-scroller"}/`;

// -- selectors -----------------------------------------------------------
// DOM shape (from Image_Scroller::render()):
//
//   .{hook}
//     div.eael-image-scroller
//       .eael-image-scroller-vertical    ← when direction = 'vertical'
//       OR .eael-image-scroller-horizontal ← when direction = 'horizontal'
//       [.eael-image-scroller-hover]      ← present only when auto_scroll = 'yes'
//       img                               ← the scrollable image

const wrap = (hook: string) => `.${hook} .eael-image-scroller`;
const img  = (hook: string) => `.${hook} .eael-image-scroller img`;

// -- helpers -------------------------------------------------------------

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

// ========================================================================
// 1. Page health
// ========================================================================

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

// ========================================================================
// 2. Scroll direction
// ========================================================================

test.describe("Scroll direction", () => {
  test("default: .eael-image-scroller wrapper is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrap("test-is-default")).first()).toBeVisible();
  });

  test("default: has class eael-image-scroller-vertical", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrap("test-is-default")).first()).toHaveClass(
      /eael-image-scroller-vertical/
    );
  });

  test("default: does not have class eael-image-scroller-horizontal", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(wrap("test-is-default")).first().getAttribute("class") ?? "";
    expect(cls).not.toContain("eael-image-scroller-horizontal");
  });

  test("horizontal: .eael-image-scroller wrapper is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrap("test-is-horizontal")).first()).toBeVisible();
  });

  test("horizontal: has class eael-image-scroller-horizontal", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrap("test-is-horizontal")).first()).toHaveClass(
      /eael-image-scroller-horizontal/
    );
  });

  test("horizontal: does not have class eael-image-scroller-vertical", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(wrap("test-is-horizontal")).first().getAttribute("class") ?? "";
    expect(cls).not.toContain("eael-image-scroller-vertical");
  });
});

// ========================================================================
// 3. Auto scroll
//    auto_scroll = 'yes' → adds class .eael-image-scroller-hover
//    auto_scroll off     → class is absent
// ========================================================================

test.describe("Auto scroll", () => {
  test("auto_scroll on: .eael-image-scroller-hover class is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrap("test-is-default")).first()).toHaveClass(
      /eael-image-scroller-hover/
    );
  });

  test("horizontal auto_scroll on: .eael-image-scroller-hover class is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrap("test-is-horizontal")).first()).toHaveClass(
      /eael-image-scroller-hover/
    );
  });

  test("auto_scroll off (vertical): .eael-image-scroller-hover class is absent", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(wrap("test-is-autoscroll-off")).first().getAttribute("class") ?? "";
    expect(cls).not.toContain("eael-image-scroller-hover");
  });

  test("auto_scroll off (horizontal): .eael-image-scroller-hover class is absent", async ({ page }) => {
    await openPage(page);
    const cls =
      await page.locator(wrap("test-is-horizontal-autoscroll-off")).first().getAttribute("class") ?? "";
    expect(cls).not.toContain("eael-image-scroller-hover");
  });

  test("auto_scroll off (vertical): direction class is still set", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrap("test-is-autoscroll-off")).first()).toHaveClass(
      /eael-image-scroller-vertical/
    );
  });

  test("auto_scroll off (horizontal): direction class is still set", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrap("test-is-horizontal-autoscroll-off")).first()).toHaveClass(
      /eael-image-scroller-horizontal/
    );
  });
});

// ========================================================================
// 4. Element structure
// ========================================================================

test.describe("Element structure", () => {
  test(".eael-image-scroller is a div", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(wrap("test-is-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("DIV");
  });

  test("img element is rendered inside the wrapper", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(img("test-is-default")).first()).toBeAttached();
  });

  test("img has a non-empty src attribute", async ({ page }) => {
    await openPage(page);
    const src = await page.locator(img("test-is-default")).first().getAttribute("src");
    expect(src?.trim()).toBeTruthy();
  });

  test("img is visible inside horizontal instance", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(img("test-is-horizontal")).first()).toBeAttached();
  });

  test("container has inline height style applied (300px)", async ({ page }) => {
    await openPage(page);
    const height = await page
      .locator(wrap("test-is-default"))
      .first()
      .evaluate((el) => getComputedStyle(el).height);
    expect(height).toBe("300px");
  });

  test("all four instances render .eael-image-scroller", async ({ page }) => {
    await openPage(page);
    for (const hook of [
      "test-is-default",
      "test-is-horizontal",
      "test-is-autoscroll-off",
      "test-is-horizontal-autoscroll-off",
    ]) {
      await expect(page.locator(wrap(hook)).first()).toBeAttached();
    }
  });
});

// ========================================================================
// 5. Interaction
// ========================================================================

test.describe("Interaction", () => {
  test("hover over all instances causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-is-default",
      "test-is-horizontal",
      "test-is-autoscroll-off",
      "test-is-horizontal-autoscroll-off",
    ]) {
      await page.locator(wrap(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking the default instance causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(wrap("test-is-default")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
