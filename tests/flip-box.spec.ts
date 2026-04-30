import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.FLIP_BOX_PAGE_SLUG ?? "flip-box"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Flip_Box::render()):
//   .{hook}                                                 ← Elementor widget wrapper
//     [also carries prefix_class: eael-flipbox-content-align-{value}]
//     .eael-elements-flip-box-container
//       .eael-animate-flip
//       .eael-{flipbox_type}                               ← e.g. eael-animate-left
//       .eael-content
//       .eael-flip-box-{event_type}                        ← eael-flip-box-hover|click
//       .eael-flipbox-fixed-height (or -auto-height)
//       <div|a class="eael-elements-flip-box-flip-card">   ← <a> when link_type=box
//         .eael-elements-flip-box-front-container
//           .eael-elements-slider-display-table
//             .eael-elements-flip-box-vertical-align
//               .eael-elements-flip-box-padding
//                 .eael-elements-flip-box-icon-image        ← absent when icon_type=none
//                   img.eael-flipbox-image-as-icon          ← image type
//                   <svg|i>                                 ← icon type
//                 {tag}.eael-elements-flip-box-heading      ← front title
//                 .eael-elements-flip-box-content
//         .eael-elements-flip-box-rear-container
//           ...padding
//             .eael-elements-flip-box-icon-image
//             {tag|a}.eael-elements-flip-box-heading        ← <a>.flipbox-linked-title when link_type=title
//             .eael-elements-flip-box-content
//             <a class="flipbox-button">                    ← when link_type=button

const container     = (hook: string) => `.${hook} .eael-elements-flip-box-container`;
const flipCard      = (hook: string) => `.${hook} .eael-elements-flip-box-flip-card`;
const front         = (hook: string) => `.${hook} .eael-elements-flip-box-front-container`;
const rear          = (hook: string) => `.${hook} .eael-elements-flip-box-rear-container`;
const frontTitle    = (hook: string) => `${front(hook)} .eael-elements-flip-box-heading`;
const backTitle     = (hook: string) => `${rear(hook)} .eael-elements-flip-box-heading`;
const frontIconWrap = (hook: string) => `${front(hook)} .eael-elements-flip-box-icon-image`;
const frontContent  = (hook: string) => `${front(hook)} .eael-elements-flip-box-content`;
const flipButton    = (hook: string) => `.${hook} .flipbox-button`;

// ── flip type map: hook → expected CSS class on .eael-elements-flip-box-container
const FLIP_TYPE_MAP: Record<string, string> = {
  "test-fb-default":  "eael-animate-left",
  "test-fb-right":    "eael-animate-right",
  "test-fb-up":       "eael-animate-up",
  "test-fb-down":     "eael-animate-down",
  "test-fb-zoom-in":  "eael-animate-zoom-in",
  "test-fb-zoom-out": "eael-animate-zoom-out",
  "test-fb-fade-in":  "eael-animate-fade-in",
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
// 2. Flip types — one instance per animation type
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Flip types", () => {
  for (const [hook, flipClass] of Object.entries(FLIP_TYPE_MAP)) {
    test(`${flipClass} — container is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(container(hook)).first()).toBeVisible();
    });

    test(`${flipClass} — applies correct animation class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(container(hook)).first()).toHaveClass(
        new RegExp(flipClass)
      );
    });

    test(`${flipClass} — front container is rendered`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(front(hook)).first()).toBeAttached();
    });

    test(`${flipClass} — rear container is rendered`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(rear(hook)).first()).toBeAttached();
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Event type
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Event type", () => {
  test("hover (default) — container has eael-flip-box-hover class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-fb-default")).first()).toHaveClass(
      /eael-flip-box-hover/
    );
  });

  test("click — container has eael-flip-box-click class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-fb-click")).first()).toHaveClass(
      /eael-flip-box-click/
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Front icon types
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Front icon types", () => {
  test("icon (default) — .eael-elements-flip-box-icon-image rendered in front", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(frontIconWrap("test-fb-default")).first()).toBeAttached();
  });

  test("none — icon-image div has no child img, svg, or i elements", async ({ page }) => {
    await openPage(page);
    const wrap = frontIconWrap("test-fb-icon-none");
    await expect(
      page.locator(`${wrap} img, ${wrap} svg, ${wrap} i`)
    ).toHaveCount(0);
  });

  test("image — .eael-elements-flip-box-icon-image rendered in front", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(frontIconWrap("test-fb-icon-img")).first()).toBeAttached();
  });

  test("image — img.eael-flipbox-image-as-icon is present", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`${frontIconWrap("test-fb-icon-img")} img.eael-flipbox-image-as-icon`).first()
    ).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Link types
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Link types", () => {
  test("none (default) — flip-card renders as div", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(flipCard("test-fb-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("DIV");
  });

  test("box — flip-card renders as <a>", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(flipCard("test-fb-link-box"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("A");
  });

  test("title — back heading has flipbox-linked-title class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(backTitle("test-fb-link-title")).first()).toHaveClass(
      /flipbox-linked-title/
    );
  });

  test("title — back heading renders as <a>", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(backTitle("test-fb-link-title"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("A");
  });

  test("button — .flipbox-button element is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(flipButton("test-fb-link-btn")).first()).toBeAttached();
  });

  test("button — .flipbox-button shows the configured text", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(flipButton("test-fb-link-btn")).first().textContent();
    expect(text?.trim()).toBe("Get Started");
  });

  test("button — .flipbox-button renders as <a>", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(flipButton("test-fb-link-btn"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("A");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Content alignment (prefix_class: eael-flipbox-content-align-)
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Content alignment", () => {
  test("center (default) — eael-flipbox-content-align-center applied to wrapper", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-fb-default.eael-flipbox-content-align-center").first()
    ).toBeAttached();
  });

  test("left — eael-flipbox-content-align-left applied to wrapper", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-fb-align-left.eael-flipbox-content-align-left").first()
    ).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Element structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("front title text is 'Front Title'", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(frontTitle("test-fb-default")).first().textContent();
    expect(text?.trim()).toBe("Front Title");
  });

  test("back title text is 'Back Title'", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(backTitle("test-fb-default")).first().textContent();
    expect(text?.trim()).toBe("Back Title");
  });

  test("front title renders as the configured HTML tag (default: h2)", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(frontTitle("test-fb-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H2");
  });

  test("front content div is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(frontContent("test-fb-default")).first()).toBeAttached();
  });

  test("container has eael-animate-flip class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-fb-default")).first()).toHaveClass(
      /eael-animate-flip/
    );
  });

  test("container has eael-flipbox-fixed-height class by default", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-fb-default")).first()).toHaveClass(
      /eael-flipbox-fixed-height/
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover on each flip type variant triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of Object.keys(FLIP_TYPE_MAP)) {
      await page.locator(container(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover on link type variants triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of ["test-fb-link-box", "test-fb-link-title", "test-fb-link-btn"]) {
      await page.locator(container(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("click event widget — click on container triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(container("test-fb-click")).first().click();
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Visual regression
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Visual regression", () => {
  const HOOKS = [
    "test-fb-default",
    "test-fb-right",
    "test-fb-up",
    "test-fb-down",
    "test-fb-zoom-in",
    "test-fb-zoom-out",
    "test-fb-fade-in",
    "test-fb-click",
    "test-fb-icon-none",
    "test-fb-icon-img",
    "test-fb-link-box",
    "test-fb-link-title",
    "test-fb-link-btn",
    "test-fb-align-left",
  ];

  for (const hook of HOOKS) {
    test(`${hook} matches visual snapshot`, async ({ page }) => {
      await openPage(page);
      await page.waitForLoadState("networkidle");
      await page.locator(`.${hook}`).first().scrollIntoViewIfNeeded();
      await expect(page.locator(`.${hook}`).first()).toHaveScreenshot(
        `${hook}.png`,
        { animations: "disabled" }
      );
    });
  }
});
