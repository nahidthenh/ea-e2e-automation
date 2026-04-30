import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.TESTIMONIAL_PAGE_SLUG ?? "testimonial"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Testimonial::render()):
//   .{hook}                                  ← elementor-widget wrapper
//     .eael-testimonial-item.{style}.{rating-cls}
//       ul.testimonial-star-rating           ← only when rating_position=top
//       .eael-testimonial-image (optional)
//         figure > img
//       .eael-testimonial-content
//         .eael-testimonial-text
//         ul.testimonial-star-rating         ← default rating position
//         p.eael-testimonial-user            (h3 for simple-layout)
//         p.eael-testimonial-user-company
//       span.eael-testimonial-quote          ← only when show_quote=yes

const item    = (hook: string) => `.${hook} .eael-testimonial-item`;
const content = (hook: string) => `.${hook} .eael-testimonial-content`;
const text    = (hook: string) => `.${hook} .eael-testimonial-text`;
const user    = (hook: string) => `.${hook} .eael-testimonial-user`;
const company = (hook: string) => `.${hook} .eael-testimonial-user-company`;
const stars   = (hook: string) => `.${hook} .testimonial-star-rating`;
const quote   = (hook: string) => `.${hook} .eael-testimonial-quote`;
const avatar  = (hook: string) => `.${hook} .eael-testimonial-image`;

// ── free skin classes ─────────────────────────────────────────────────────
const FREE_STYLES = [
  "default-style",
  "classic-style",
  "middle-style",
  "icon-img-left-content",
  "icon-img-right-content",
  "content-top-icon-title-inline",
  "content-bottom-icon-title-inline",
  "simple-layout",
] as const;

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
// 2. Testimonial skins (free — 8 layouts)
// ══════════════════════════════════════════════════════════════════════════

test.describe("Testimonial skins", () => {
  const skinMap: Record<string, string> = {
    "test-t-default":      "default-style",
    "test-t-classic":      "classic-style",
    "test-t-middle":       "middle-style",
    "test-t-icon-left":    "icon-img-left-content",
    "test-t-icon-right":   "icon-img-right-content",
    "test-t-top-inline":   "content-top-icon-title-inline",
    "test-t-bottom-inline":"content-bottom-icon-title-inline",
    "test-t-simple":       "simple-layout",
  };

  for (const [hook, styleClass] of Object.entries(skinMap)) {
    test(`${styleClass} item is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(item(hook)).first()).toBeVisible();
    });

    test(`${styleClass} applies correct CSS class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(item(hook)).first()).toHaveClass(
        new RegExp(styleClass)
      );
    });

    test(`${styleClass} renders description text`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(text(hook)).first()).toBeVisible();
    });

    test(`${styleClass} renders user name`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(user(hook)).first()).toBeVisible();
    });

    test(`${styleClass} renders company name`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(company(hook)).first()).toBeVisible();
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 3. Content toggles
// ══════════════════════════════════════════════════════════════════════════

test.describe("Avatar toggle", () => {
  test("avatar enabled: .eael-testimonial-image is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(avatar("test-t-default")).first()).toBeAttached();
  });

  test("avatar disabled: .eael-testimonial-image is absent", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(avatar("test-t-no-avatar"))).toHaveCount(0);
  });

  test("avatar disabled: content still renders", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(content("test-t-no-avatar")).first()).toBeVisible();
    await expect(page.locator(text("test-t-no-avatar")).first()).toBeVisible();
  });
});

test.describe("Quote icon toggle", () => {
  test("quote enabled: span.eael-testimonial-quote is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(quote("test-t-default")).first()).toBeAttached();
  });

  test("quote disabled: span.eael-testimonial-quote is absent", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(quote("test-t-no-quote"))).toHaveCount(0);
  });
});

test.describe("Rating toggle", () => {
  test("rating enabled: .testimonial-star-rating is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(stars("test-t-default")).first()).toBeAttached();
  });

  test("rating enabled: item carries rating CSS class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(item("test-t-default")).first()).toHaveClass(/rating-five/);
  });

  test("rating disabled: .testimonial-star-rating is absent", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(stars("test-t-no-rating"))).toHaveCount(0);
  });

  test("rating disabled: item has no rating CSS class", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(item("test-t-no-rating")).first().getAttribute("class") ?? "";
    expect(cls).not.toMatch(/rating-/);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 4. Rating variants
// ══════════════════════════════════════════════════════════════════════════

test.describe("Rating number", () => {
  test("rating-one: item carries class 'rating-one'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(item("test-t-rating-one")).first()).toHaveClass(/rating-one/);
  });

  test("rating-one: five star elements still in DOM (CSS hides extras)", async ({ page }) => {
    await openPage(page);
    const liCount = await page
      .locator(`${stars("test-t-rating-one")} li`)
      .count();
    expect(liCount).toBe(5);
  });
});

test.describe("Rating position", () => {
  test("position=default: stars are inside .eael-testimonial-content", async ({ page }) => {
    await openPage(page);
    await expect(
      page
        .locator(content("test-t-default"))
        .locator(".testimonial-star-rating")
        .first()
    ).toBeAttached();
  });

  test("position=top: stars appear as sibling before .eael-testimonial-content", async ({ page }) => {
    await openPage(page);
    // Stars must precede content in DOM order.
    const starsIdx = await page
      .locator(`${stars("test-t-rating-top")}`)
      .first()
      .evaluate((el) => {
        const parent = el.parentElement;
        if (!parent) return -1;
        return Array.from(parent.children).indexOf(el);
      });
    const contentIdx = await page
      .locator(content("test-t-rating-top"))
      .first()
      .evaluate((el) => {
        const parent = el.parentElement;
        if (!parent) return -1;
        return Array.from(parent.children).indexOf(el);
      });
    expect(starsIdx).toBeLessThan(contentIdx);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 5. Content alignment
//    Alignment is applied via Elementor's generated CSS:
//    text-align on .eael-testimonial-content and .eael-testimonial-image.
// ══════════════════════════════════════════════════════════════════════════

test.describe("Content alignment", () => {
  test("center alignment: .eael-testimonial-content has text-align center", async ({ page }) => {
    await openPage(page);
    const ta = await page
      .locator(content("test-t-align-center"))
      .first()
      .evaluate((el) => getComputedStyle(el).textAlign);
    expect(ta).toBe("center");
  });

  test("right alignment: .eael-testimonial-content has text-align right", async ({ page }) => {
    await openPage(page);
    const ta = await page
      .locator(content("test-t-align-right"))
      .first()
      .evaluate((el) => getComputedStyle(el).textAlign);
    expect(ta).toBe("right");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 6. Element structure
// ══════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("testimonial item is a div", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(item("test-t-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("DIV");
  });

  test("user name in default-style is a <p> element", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(user("test-t-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("P");
  });

  test("user name in simple-layout is an <h3> element", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(user("test-t-simple"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H3");
  });

  test("star rating list has exactly 5 items", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(`${stars("test-t-default")} li`).count();
    expect(count).toBe(5);
  });

  test("item skin class is one of the known free styles", async ({ page }) => {
    await openPage(page);
    const cls = await page
      .locator(item("test-t-default"))
      .first()
      .getAttribute("class") ?? "";
    const hasStyle = FREE_STYLES.some((s) => cls.includes(s));
    expect(hasStyle, `Unknown skin in: "${cls}"`).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 7. Interaction
// ══════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover on each skin instance triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-t-default",
      "test-t-classic",
      "test-t-middle",
      "test-t-icon-left",
      "test-t-icon-right",
      "test-t-top-inline",
      "test-t-bottom-inline",
      "test-t-simple",
    ]) {
      await page.locator(item(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking the default testimonial causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(item("test-t-default")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});

  }
});
