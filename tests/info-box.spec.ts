import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.INFO_BOX_PAGE_SLUG ?? "info-box"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Info_Box::render()):
//   .{hook}                              ← elementor-widget wrapper (_css_classes)
//     [a href="..."]                     ← clickable wrapper (optional)
//       .eael-infobox.icon-on-{pos}      ← main container; position class varies
//         .infobox-icon[.eael-icon-only] ← icon/image area
//           .infobox-icon-wrap           ← present for icon/number types
//             svg / i                    ← icon element
//             span.infobox-icon-number   ← number element
//         .infobox-content               ← text area
//           .infobox-title-section
//             {tag}.sub_title            ← sub title (when enabled)
//             {tag}.title                ← main title
//           div > p                      ← body text
//           .infobox-button              ← button wrapper (when enabled)
//             a.eael-infobox-button      ← button anchor
//               span.infobox-button-text ← button label

const infobox = (hook: string) => `.${hook} .eael-infobox`;
const icon    = (hook: string) => `.${hook} .infobox-icon`;
const content = (hook: string) => `.${hook} .infobox-content`;
const title   = (hook: string) => `.${hook} .title`;
const button  = (hook: string) => `.${hook} .eael-infobox-button`;

// ── position classes set by eael_infobox_before() ─────────────────────────
const POSITION_MAP: Record<string, string> = {
  "test-ib-default":    "icon-on-top",
  "test-ib-img-bottom": "icon-on-bottom",
  "test-ib-img-left":   "icon-on-left",
  "test-ib-img-right":  "icon-on-right",
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
// 2. Image/Icon position variants
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Image/Icon position", () => {
  for (const [hook, posClass] of Object.entries(POSITION_MAP)) {
    test(`${posClass} — infobox is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(infobox(hook)).first()).toBeVisible();
    });

    test(`${posClass} — applies correct position class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(infobox(hook)).first()).toHaveClass(
        new RegExp(posClass)
      );
    });

    test(`${posClass} — title renders`, async ({ page }) => {
      await openPage(page);
      const text = await page.locator(title(hook)).first().textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Icon / Media type variants
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Icon / Media type", () => {
  test("none — no .infobox-icon element rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(icon("test-ib-icon-none"))).toHaveCount(0);
  });

  test("none — content still renders", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(content("test-ib-icon-none")).first()).toBeVisible();
  });

  test("number — .infobox-icon-number is rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ib-icon-number .infobox-icon-number").first()
    ).toBeAttached();
  });

  test("number — displays the configured number value", async ({ page }) => {
    await openPage(page);
    const num = await page
      .locator(".test-ib-icon-number .infobox-icon-number")
      .first()
      .textContent();
    expect(num?.trim()).toBe("42");
  });

  test("icon — .infobox-icon-wrap contains an icon element", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ib-default .infobox-icon-wrap").first()
    ).toBeAttached();
  });

  test("icon — .eael-icon-only class applied to icon container", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ib-default .infobox-icon.eael-icon-only").first()
    ).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Sub title
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Sub title", () => {
  test("sub title element is rendered when enabled", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ib-subtitle .sub_title").first()
    ).toBeVisible();
  });

  test("sub title displays the configured text", async ({ page }) => {
    await openPage(page);
    const subText = await page
      .locator(".test-ib-subtitle .sub_title")
      .first()
      .textContent();
    expect(subText?.trim()).toBe("This Is A Sub Title");
  });

  test("sub title is absent when not enabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(".test-ib-default .sub_title")).toHaveCount(0);
  });

  test(".infobox-title-section contains both title and sub_title", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ib-subtitle .infobox-title-section .title").first()
    ).toBeVisible();
    await expect(
      page.locator(".test-ib-subtitle .infobox-title-section .sub_title").first()
    ).toBeVisible();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Button
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Button", () => {
  test("button is visible when enabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(button("test-ib-btn")).first()).toBeVisible();
  });

  test("button renders configured text", async ({ page }) => {
    await openPage(page);
    const btnText = await page
      .locator(".test-ib-btn .infobox-button-text")
      .first()
      .textContent();
    expect(btnText?.trim()).toBe("Learn More");
  });

  test("button is absent when not enabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(button("test-ib-default"))).toHaveCount(0);
  });

  test("default button has href='#'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(button("test-ib-btn")).first()).toHaveAttribute(
      "href",
      "#"
    );
  });

  test("external button has target='_blank'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(button("test-ib-btn-external")).first()
    ).toHaveAttribute("target", "_blank");
  });

  test("external button href points to the configured URL", async ({ page }) => {
    await openPage(page);
    const href = await page
      .locator(button("test-ib-btn-external"))
      .first()
      .getAttribute("href");
    expect(href).toContain("essential-addons.com");
  });

  test("nofollow button has rel containing 'nofollow'", async ({ page }) => {
    await openPage(page);
    const rel = await page
      .locator(button("test-ib-btn-nofollow"))
      .first()
      .getAttribute("rel");
    expect(rel).toContain("nofollow");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Clickable infobox
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Clickable infobox", () => {
  test("clickable wrapper <a> containing .eael-infobox is rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ib-clickable a:has(.eael-infobox)").first()
    ).toBeAttached();
  });

  test("clickable link href points to the configured URL", async ({ page }) => {
    await openPage(page);
    const href = await page
      .locator(".test-ib-clickable a:has(.eael-infobox)")
      .first()
      .getAttribute("href");
    expect(href).toContain("essential-addons.com");
  });

  test("clickable link opens in new tab", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ib-clickable a:has(.eael-infobox)").first()
    ).toHaveAttribute("target", "_blank");
  });

  test("no .infobox-button rendered when infobox is clickable", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(button("test-ib-clickable"))).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Content alignment
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Content alignment", () => {
  test("left-aligned wrapper has alignment class applied", async ({ page }) => {
    await openPage(page);
    const cls =
      (await page.locator(".test-ib-align-left").first().getAttribute("class")) ?? "";
    expect(cls).toMatch(/eael-infobox-content-align.*left/);
  });

  test("right-aligned wrapper has alignment class applied", async ({ page }) => {
    await openPage(page);
    const cls =
      (await page.locator(".test-ib-align-right").first().getAttribute("class")) ?? "";
    expect(cls).toMatch(/eael-infobox-content-align.*right/);
  });

  test("left-aligned .infobox-content has text-align: left", async ({ page }) => {
    await openPage(page);
    const textAlign = await page
      .locator(".test-ib-align-left .infobox-content")
      .first()
      .evaluate((el) => getComputedStyle(el).textAlign);
    expect(textAlign).toBe("left");
  });

  test("right-aligned .infobox-content has text-align: right", async ({ page }) => {
    await openPage(page);
    const textAlign = await page
      .locator(".test-ib-align-right .infobox-content")
      .first()
      .evaluate((el) => getComputedStyle(el).textAlign);
    expect(textAlign).toBe("right");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Element structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("title renders as the configured heading tag (default h2)", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(title("test-ib-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H2");
  });

  test(".infobox-content container is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(content("test-ib-default")).first()).toBeAttached();
  });

  test(".infobox-title-section is present inside content", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ib-default .infobox-title-section").first()
    ).toBeAttached();
  });

  test("button anchor is rendered as an <a> tag", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(button("test-ib-btn"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("A");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("button is keyboard-focusable", async ({ page }) => {
    await openPage(page);
    const btn = page.locator(button("test-ib-btn")).first();
    await btn.focus();
    await expect(btn).toBeFocused();
  });

  test("hover on each position variant triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of Object.keys(POSITION_MAP)) {
      await page.locator(infobox(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking button (href='#') causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(button("test-ib-btn")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
