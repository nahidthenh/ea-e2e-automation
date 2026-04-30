/**
 * Covered: Essential Addons — Image Hot Spots widget
 *
 * 1. Page health        — HTTP 200, no PHP errors, no JS errors
 * 2. Hotspot types      — icon (.eael-hotspot-icon-wrap) / text "Info" /
 *                         blank (no icon or text)
 * 3. Glow effect        — hotspot-animation class on / off
 * 4. Tooltip            — eael-hot-spot-tooptip class; data-tipso "This is tooltip text";
 *                         disabled (no class); global position "top"; local "bottom";
 *                         arrow "yes"
 * 5. Link behaviour     — external target="_blank"; data-link contains example.com;
 *                         no target default
 * 6. Image alignment    — centered / left / right prefix class
 * 7. Multiple hotspots  — 3 count; "Beta" text hotspot
 * 8. Element structure  — <a> tag; aria-label; eael-image-hotspots wrapper;
 *                         img inside hot-spot-image
 * 9. Interaction        — hover (no JS errors); click (no JS errors)
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.IMAGE_HOT_SPOTS_PAGE_SLUG ?? "image-hot-spots"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Image_Hot_Spots::render()):
//   .{hook}                                    ← elementor-widget wrapper
//     [class: eael-image-hotspot-align-{left|centered|right}]  ← prefix_class on widget
//     div.eael-image-hotspots                  ← main wrapper
//       div.eael-hot-spot-image               ← image container
//         a.eael-hot-spot-wrap                ← per hotspot (anchor tag)
//           [class: eael-hot-spot-tooptip]    ← added when tooltip enabled
//           [data-tipso]                      ← tooltip HTML
//           [data-tooltip-position-global]
//           [data-tooltip-position-local]     ← when per-item != 'global'
//           [data-tooltip-size]
//           [data-eael-tooltip-arrow]
//           [target=_blank]                   ← when hotspot_link_target=yes
//           span.eael-hot-spot-inner
//             [class: hotspot-animation]      ← added when hotspot_pulse=yes
//             span.eael-hotspot-icon-wrap
//               i.eael-hotspot-icon           ← type=icon
//               span.eael-hotspot-text        ← type=text
//         img                                 ← main image (from Group_Control_Image_Size)

const hotspots    = (hook: string) => `.${hook} .eael-image-hotspots`;
const hotSpotImg  = (hook: string) => `.${hook} .eael-hot-spot-image`;
const hotSpotWrap = (hook: string) => `.${hook} .eael-hot-spot-wrap`;
const hotSpotInner = (hook: string) => `.${hook} .eael-hot-spot-inner`;
const iconWrap    = (hook: string) => `.${hook} .eael-hotspot-icon-wrap`;
const textSpan    = (hook: string) => `.${hook} .eael-hotspot-text`;

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
// 2. Hotspot types
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Hotspot types", () => {
  test("default (icon) — renders .eael-hotspot-icon-wrap", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(iconWrap("test-ihs-default")).first()).toBeAttached();
  });

  test("default (icon) — .eael-hot-spot-wrap is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(hotSpotWrap("test-ihs-default")).first()).toBeAttached();
  });

  test("text type — renders .eael-hotspot-text span", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(textSpan("test-ihs-type-text")).first()).toBeAttached();
  });

  test("text type — span contains correct text", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(textSpan("test-ihs-type-text")).first()).toContainText("Info");
  });

  test("blank type — no .eael-hotspot-icon-wrap rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(iconWrap("test-ihs-type-blank"))).toHaveCount(0);
  });

  test("blank type — no .eael-hotspot-text rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(textSpan("test-ihs-type-blank"))).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Glow effect (pulse animation)
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Glow effect", () => {
  test("pulse on — .eael-hot-spot-inner has 'hotspot-animation' class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(hotSpotInner("test-ihs-default")).first()).toHaveClass(
      /hotspot-animation/
    );
  });

  test("pulse off — .eael-hot-spot-inner does NOT have 'hotspot-animation' class", async ({ page }) => {
    await openPage(page);
    const cls = (await page.locator(hotSpotInner("test-ihs-pulse-off")).first().getAttribute("class")) ?? "";
    expect(cls).not.toMatch(/hotspot-animation/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Tooltip
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Tooltip", () => {
  test("tooltip enabled — hotspot has 'eael-hot-spot-tooptip' class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(hotSpotWrap("test-ihs-tooltip")).first()).toHaveClass(
      /eael-hot-spot-tooptip/
    );
  });

  test("tooltip enabled — data-tipso attribute is present", async ({ page }) => {
    await openPage(page);
    const tipso = await page.locator(hotSpotWrap("test-ihs-tooltip")).first().getAttribute("data-tipso");
    expect(tipso).not.toBeNull();
    expect(tipso!.length).toBeGreaterThan(0);
  });

  test("tooltip enabled — data-tipso contains tooltip text", async ({ page }) => {
    await openPage(page);
    const tipso = await page.locator(hotSpotWrap("test-ihs-tooltip")).first().getAttribute("data-tipso");
    expect(tipso).toContain("This is tooltip text");
  });

  test("tooltip disabled — no 'eael-hot-spot-tooptip' class", async ({ page }) => {
    await openPage(page);
    const cls = (await page.locator(hotSpotWrap("test-ihs-default")).first().getAttribute("class")) ?? "";
    expect(cls).not.toMatch(/eael-hot-spot-tooptip/);
  });

  test("global position — data-tooltip-position-global is 'top'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(hotSpotWrap("test-ihs-tooltip")).first()).toHaveAttribute(
      "data-tooltip-position-global",
      "top"
    );
  });

  test("local position bottom — data-tooltip-position-local is 'bottom'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(hotSpotWrap("test-ihs-tooltip-bottom")).first()
    ).toHaveAttribute("data-tooltip-position-local", "bottom");
  });

  test("arrow enabled — data-eael-tooltip-arrow is 'yes'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(hotSpotWrap("test-ihs-tooltip")).first()).toHaveAttribute(
      "data-eael-tooltip-arrow",
      "yes"
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Link behaviour
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Link behaviour", () => {
  test("external link — hotspot has target=_blank", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(hotSpotWrap("test-ihs-link-external")).first()).toHaveAttribute(
      "target",
      "_blank"
    );
  });

  test("external link — data-link points to example.com", async ({ page }) => {
    await openPage(page);
    const dataLink = await page
      .locator(hotSpotWrap("test-ihs-link-external"))
      .first()
      .getAttribute("data-link");
    expect(dataLink).toContain("example.com");
  });

  test("default link — no target=_blank on hotspot", async ({ page }) => {
    await openPage(page);
    const target = await page.locator(hotSpotWrap("test-ihs-default")).first().getAttribute("target");
    expect(target).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Image alignment
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Image alignment", () => {
  const alignCases = [
    { hook: "test-ihs-default",     cls: "eael-image-hotspot-align-centered" },
    { hook: "test-ihs-align-left",  cls: "eael-image-hotspot-align-left" },
    { hook: "test-ihs-align-right", cls: "eael-image-hotspot-align-right" },
  ] as const;

  for (const { hook, cls } of alignCases) {
    test(`${cls} — widget wrapper has correct alignment class`, async ({ page }) => {
      await openPage(page);
      const widgetEl = page.locator(`.${hook}`).first();
      await expect(widgetEl).toHaveClass(new RegExp(cls));
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Multiple hotspots
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Multiple hotspots", () => {
  test("3-hotspot instance renders 3 .eael-hot-spot-wrap elements", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(hotSpotWrap("test-ihs-multi"))).toHaveCount(3);
  });

  test("text-type hotspot in multi — 'Beta' text is rendered", async ({ page }) => {
    await openPage(page);
    const texts = await page.locator(`${hotSpotWrap("test-ihs-multi")} .eael-hotspot-text`).allTextContents();
    expect(texts.map((t) => t.trim())).toContain("Beta");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Element structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("default — .eael-image-hotspots wrapper is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(hotspots("test-ihs-default")).first()).toBeAttached();
  });

  test("default — .eael-hot-spot-image container is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(hotSpotImg("test-ihs-default")).first()).toBeAttached();
  });

  test("default — main image tag is rendered inside .eael-hot-spot-image", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`${hotSpotImg("test-ihs-default")} img`).last()
    ).toBeAttached();
  });

  test("default — hotspot is an anchor (<a>) element", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(hotSpotWrap("test-ihs-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("A");
  });

  test("default — hotspot has aria-label attribute", async ({ page }) => {
    await openPage(page);
    const label = await page
      .locator(hotSpotWrap("test-ihs-default"))
      .first()
      .getAttribute("aria-label");
    expect(label).not.toBeNull();
    expect(label!.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("click on default hotspot causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(hotSpotWrap("test-ihs-default")).first().click();
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover on all instances triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-ihs-default",
      "test-ihs-type-text",
      "test-ihs-type-blank",
      "test-ihs-tooltip",
      "test-ihs-tooltip-bottom",
      "test-ihs-pulse-off",
      "test-ihs-link-external",
      "test-ihs-align-left",
      "test-ihs-align-right",
      "test-ihs-multi",
    ]) {
      await page.locator(hotSpotWrap(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
