/**
 * Covered: Essential Addons — Image Comparison widget
 *
 * 1. Page health        — HTTP 200, no PHP errors, no JS errors
 * 2. Orientation        — horizontal / vertical via data-orientation
 * 3. Slider interaction — data-onhover / data-onclick; toggle buttons count=2;
 *                         "Show Before"/"Show After" labels; active class
 * 4. Toggle button content — icon-only (empty text) / icon present; text+icon both
 * 5. Overlay            — data-overlay yes / empty
 * 6. Labels             — data-before_label "Before" / custom "Original";
 *                         data-after_label "After" / custom "Edited"
 * 7. Offset             — data-offset 0.7 default / 0.3 variant
 * 8. Element structure  — eael-before-img; eael-after-img; twentytwenty-container;
 *                         id="eael-image-comparison-*"
 * 9. Interaction        — drag handle (no JS errors); toggle button click
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.IMAGE_COMPARISON_PAGE_SLUG ?? "image-comparison"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Image_Comparison::render()):
//   .{hook}                                   ← elementor-widget wrapper
//     div.eael-img-comp-wrapper               ← outer wrapper
//       [div.eael-img-comp-toggle-btns]       ← toggle buttons (interaction=toggle only)
//         button.eael-img-comp-toggle-btn.active
//         button.eael-img-comp-toggle-btn
//       div.eael-img-comp-container.twentytwenty-container
//         [data-offset]
//         [data-orientation]
//         [data-before_label]
//         [data-after_label]
//         [data-overlay]
//         [data-onhover]
//         [data-onclick]
//         img.eael-before-img
//         img.eael-after-img

const wrapper     = (hook: string) => `.${hook} .eael-img-comp-wrapper`;
const container   = (hook: string) => `.${hook} .eael-img-comp-container`;
const beforeImg   = (hook: string) => `.${hook} .eael-before-img`;
const afterImg    = (hook: string) => `.${hook} .eael-after-img`;
const toggleBtns  = (hook: string) => `.${hook} .eael-img-comp-toggle-btns`;
const toggleBtn   = (hook: string) => `.${hook} .eael-img-comp-toggle-btn`;

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
// 2. Orientation
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Orientation", () => {
  test("default — data-orientation is 'horizontal'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-ic-default")).first()).toHaveAttribute(
      "data-orientation",
      "horizontal"
    );
  });

  test("vertical — data-orientation is 'vertical'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-ic-vertical")).first()).toHaveAttribute(
      "data-orientation",
      "vertical"
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Slider interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Slider interaction", () => {
  const interactionCases = [
    { hook: "test-ic-default",            onhover: "no",  onclick: "no"  },
    { hook: "test-ic-interaction-click",  onhover: "no",  onclick: "yes" },
    { hook: "test-ic-interaction-hover",  onhover: "yes", onclick: "no"  },
  ] as const;

  for (const { hook, onhover, onclick } of interactionCases) {
    test(`${hook} — data-onhover="${onhover}" data-onclick="${onclick}"`, async ({ page }) => {
      await openPage(page);
      const el = page.locator(container(hook)).first();
      await expect(el).toHaveAttribute("data-onhover", onhover);
      await expect(el).toHaveAttribute("data-onclick", onclick);
    });
  }

  test("toggle — renders .eael-img-comp-toggle-btns with two buttons", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(toggleBtns("test-ic-interaction-toggle")).first()).toBeAttached();
    await expect(page.locator(toggleBtn("test-ic-interaction-toggle"))).toHaveCount(2);
  });

  test("toggle — first button has 'active' class by default", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(toggleBtn("test-ic-interaction-toggle")).first()
    ).toHaveClass(/active/);
  });

  test("toggle — buttons show correct label text", async ({ page }) => {
    await openPage(page);
    const btns = page.locator(toggleBtn("test-ic-interaction-toggle"));
    await expect(btns.nth(0)).toContainText("Show Before");
    await expect(btns.nth(1)).toContainText("Show After");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Toggle button content types
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Toggle button content types", () => {
  test("icon-only — buttons have no visible text span", async ({ page }) => {
    await openPage(page);
    const textSpans = page.locator(
      `${toggleBtns("test-ic-toggle-icon")} .eael-img-comp-toggle-text`
    );
    // Rendered but empty when content type is 'icon'
    for (let i = 0; i < (await textSpans.count()); i++) {
      const txt = (await textSpans.nth(i).textContent()) ?? "";
      expect(txt.trim()).toBe("");
    }
  });

  test("icon-only — buttons render an icon element", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`${toggleBtns("test-ic-toggle-icon")} .eael-img-comp-toggle-icon`).first()
    ).toBeAttached();
  });

  test("text+icon (both) — buttons contain text AND icon", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`${toggleBtns("test-ic-toggle-both")} .eael-img-comp-toggle-text`).first()
    ).toBeAttached();
    await expect(
      page.locator(`${toggleBtns("test-ic-toggle-both")} .eael-img-comp-toggle-icon`).first()
    ).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Overlay
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Overlay", () => {
  test("default — data-overlay is 'yes'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-ic-default")).first()).toHaveAttribute(
      "data-overlay",
      "yes"
    );
  });

  test("overlay off — data-overlay is ''", async ({ page }) => {
    await openPage(page);
    const el = page.locator(container("test-ic-overlay-off")).first();
    const val = (await el.getAttribute("data-overlay")) ?? "";
    expect(val).toBe("");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Labels
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Labels", () => {
  test("default — data-before_label is 'Before'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-ic-default")).first()).toHaveAttribute(
      "data-before_label",
      "Before"
    );
  });

  test("default — data-after_label is 'After'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-ic-default")).first()).toHaveAttribute(
      "data-after_label",
      "After"
    );
  });

  test("custom labels — data-before_label is 'Original'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-ic-custom-labels")).first()).toHaveAttribute(
      "data-before_label",
      "Original"
    );
  });

  test("custom labels — data-after_label is 'Edited'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-ic-custom-labels")).first()).toHaveAttribute(
      "data-after_label",
      "Edited"
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Offset
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Offset", () => {
  test("default — data-offset is '0.7'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-ic-default")).first()).toHaveAttribute(
      "data-offset",
      "0.7"
    );
  });

  test("offset 30% — data-offset is '0.3'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-ic-offset-30")).first()).toHaveAttribute(
      "data-offset",
      "0.3"
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Element structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("default — .eael-before-img is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(beforeImg("test-ic-default")).first()).toBeAttached();
  });

  test("default — .eael-after-img is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(afterImg("test-ic-default")).first()).toBeAttached();
  });

  test("default — container has 'twentytwenty-container' class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-ic-default")).first()).toHaveClass(
      /twentytwenty-container/
    );
  });

  test("default — container has unique id attribute", async ({ page }) => {
    await openPage(page);
    const id = await page
      .locator(container("test-ic-default"))
      .first()
      .getAttribute("id");
    expect(id).not.toBeNull();
    expect(id!).toMatch(/^eael-image-comparison-/);
  });

  test("default — wrapper element is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrapper("test-ic-default")).first()).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("clicking toggle button causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(toggleBtn("test-ic-interaction-toggle")).nth(1).click();
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover on all instances triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-ic-default",
      "test-ic-vertical",
      "test-ic-interaction-click",
      "test-ic-interaction-hover",
      "test-ic-interaction-toggle",
      "test-ic-toggle-icon",
      "test-ic-toggle-both",
      "test-ic-overlay-off",
      "test-ic-custom-labels",
      "test-ic-offset-30",
    ]) {
      await page.locator(container(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
