import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.STACKED_CARDS_PAGE_SLUG ?? "stacked-cards"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Stacked_Cards::render()):
//
//   .{hook}
//     .eael-stacked-cards                     ← outer wrapper, data-widget-id
//       .eael-stacked-cards__container        ← scroll-trigger wrapper
//         data-cadr_style="vertical|horizontal"
//         data-scrolltrigger="{...}"
//
//         [per card — vertical:]
//         .eael-stacked-cards__item           ← data-stacked_card, data-bgColor
//           (.eael-stacked-cards__media)       ← optional: image/video/icon
//           .eael-stacked-cards__content
//             .eael-stacked-cards__body
//               (.eael-stacked-cards__content__media)  ← optional: image/icon
//               {h2}.eael-stacked-cards__title
//               {content wysiwyg}
//               (a.eael-stacked-cards__link)   ← optional button
//
//         [per card — horizontal:]
//         .eael-stacked-cards__item_hr        ← data-stacked_card_hr, data-bgColor

const container  = (hook: string) => `.${hook} .eael-stacked-cards`;
const scrollWrap = (hook: string) => `.${hook} .eael-stacked-cards__container`;
const cardV      = (hook: string) => `.${hook} .eael-stacked-cards__item`;
const cardH      = (hook: string) => `.${hook} .eael-stacked-cards__item_hr`;
const title      = (hook: string) => `.${hook} .eael-stacked-cards__title`;
const readMore   = (hook: string) => `.${hook} .eael-stacked-cards__link`;

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

// ══════════════════════════════════════════════════════════════════════════
// 1. Page health
// ══════════════════════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════════════════════
// 2. Card style — vertical vs horizontal
// ══════════════════════════════════════════════════════════════════════════

test.describe("Card style", () => {
  test("default (vertical) — .eael-stacked-cards container is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-sc-default")).first()).toBeVisible();
  });

  test("default (vertical) — scroll container has data-cadr_style='vertical'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(scrollWrap("test-sc-default")).first()).toHaveAttribute(
      "data-cadr_style",
      "vertical"
    );
  });

  test("default (vertical) — renders .eael-stacked-cards__item cards", async ({ page }) => {
    await openPage(page);
    const cards = page.locator(cardV("test-sc-default"));
    await expect(cards.first()).toBeAttached();
    expect(await cards.count()).toBe(3);
  });

  test("default (vertical) — each card has data-bgColor set", async ({ page }) => {
    await openPage(page);
    const bgColor = await page
      .locator(cardV("test-sc-default"))
      .first()
      .getAttribute("data-bgColor");
    expect(bgColor).toBeTruthy();
  });

  test("horizontal — scroll container has data-cadr_style='horizontal'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(scrollWrap("test-sc-horizontal")).first()).toHaveAttribute(
      "data-cadr_style",
      "horizontal"
    );
  });

  test("horizontal — renders .eael-stacked-cards__item_hr cards", async ({ page }) => {
    await openPage(page);
    const cards = page.locator(cardH("test-sc-horizontal"));
    await expect(cards.first()).toBeAttached();
    expect(await cards.count()).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 3. Card titles
// ══════════════════════════════════════════════════════════════════════════

test.describe("Card titles", () => {
  test("default — three distinct titles rendered", async ({ page }) => {
    await openPage(page);
    const titles = page.locator(title("test-sc-default"));
    const texts  = await titles.allTextContents();
    expect(texts.map((t) => t.trim())).toEqual(
      expect.arrayContaining(["Alpha Card", "Beta Card", "Gamma Card"])
    );
  });

  test("default — title element is an <h2> tag", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(title("test-sc-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H2");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 4. Transform variants — data-stacked_card attribute reflects the type
// ══════════════════════════════════════════════════════════════════════════

test.describe("Transform variants", () => {
  const transformMap: Record<string, string> = {
    "test-sc-default":          "translate",
    "test-sc-transform-none":   "none",
    "test-sc-transform-rotate": "rotate",
    "test-sc-transform-scale":  "scale",
  };

  for (const [hook, transform] of Object.entries(transformMap)) {
    test(`${transform} — cards are present and have data-stacked_card`, async ({ page }) => {
      await openPage(page);
      const card = page.locator(cardV(hook)).first();
      await expect(card).toBeAttached();
      const attr = await card.getAttribute("data-stacked_card");
      expect(attr).toBeTruthy();
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 5. Read More button
// ══════════════════════════════════════════════════════════════════════════

test.describe("Read More button", () => {
  test("button absent when disabled (default)", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(readMore("test-sc-default"))).toHaveCount(0);
  });

  test("button present when enabled — one per card", async ({ page }) => {
    await openPage(page);
    const btns = page.locator(readMore("test-sc-with-button"));
    expect(await btns.count()).toBe(3);
  });

  test("button text is 'Read More'", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(readMore("test-sc-with-button")).first().textContent();
    expect(text?.trim()).toBe("Read More");
  });

  test("button is an <a> tag", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(readMore("test-sc-with-button"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("A");
  });

  test("button href is '#'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(readMore("test-sc-with-button")).first()).toHaveAttribute(
      "href",
      "#"
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 6. Media — icon type
// ══════════════════════════════════════════════════════════════════════════

test.describe("Media — icon type", () => {
  test("icon media — .eael-stacked-cards__media block is present", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-sc-media-icon .eael-stacked-cards__media").first()
    ).toBeAttached();
  });

  test("no media — .eael-stacked-cards__media block absent (default)", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-sc-default .eael-stacked-cards__media")
    ).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 7. Element structure
// ══════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("outer .eael-stacked-cards has data-widget-id attribute", async ({ page }) => {
    await openPage(page);
    const attr = await page
      .locator(container("test-sc-default"))
      .first()
      .getAttribute("data-widget-id");
    expect(attr).toBeTruthy();
  });

  test("scroll container has data-scrolltrigger attribute", async ({ page }) => {
    await openPage(page);
    const attr = await page
      .locator(scrollWrap("test-sc-default"))
      .first()
      .getAttribute("data-scrolltrigger");
    expect(attr).toBeTruthy();
    // Must be valid JSON
    expect(() => JSON.parse(attr!)).not.toThrow();
  });

  test(".eael-stacked-cards__content is present inside each card", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-sc-default .eael-stacked-cards__content").first()
    ).toBeAttached();
  });

  test(".eael-stacked-cards__body is present inside content", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-sc-default .eael-stacked-cards__body").first()
    ).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 8. Interaction
// ══════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover on each widget instance triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    const hooks = [
      "test-sc-default",
      "test-sc-horizontal",
      "test-sc-transform-none",
      "test-sc-transform-rotate",
      "test-sc-transform-scale",
      "test-sc-with-button",
      "test-sc-media-icon",
    ];

    for (const hook of hooks) {
      await page.locator(container(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("Read More button is keyboard-focusable", async ({ page }) => {
    await openPage(page);
    const btn = page.locator(readMore("test-sc-with-button")).first();
    await btn.focus();
    await expect(btn).toBeFocused();
  });

  test("clicking a Read More button causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(readMore("test-sc-with-button")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
