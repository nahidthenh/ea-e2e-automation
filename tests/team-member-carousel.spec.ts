import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.TEAM_MEMBER_CAROUSEL_PAGE_SLUG ?? "team-member-carousel"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Team_Member_Carousel::render()):
//   .{hook}
//     .swiper-container-wrap.eael-team-member-carousel-wrap
//       .swiper.eael-tm-wrapper.eael-tm-carousel    (data-items, data-autoplay, data-arrows, data-dots …)
//         .swiper-wrapper
//           .swiper-slide
//             .eael-tm
//               .eael-tm-image > img
//               [.eael-tm-overlay-content-wrap]           ← overlay_content != 'none'
//                 .eael-tm-content
//                   .eael-tm-social-links-wrap            ← overlay = social_icons
//                   .eael-tm-description                  ← overlay = all_content | atoz_content
//               .eael-tm-content.eael-tm-content-normal
//                 {name_tag}.eael-tm-name
//                 {pos_tag}.eael-tm-position
//                 [.eael-tm-social-links-wrap]            ← overlay = none && social=yes
//                 [.eael-tm-description]
//       [.swiper-pagination]                             ← dots=yes
//       [.swiper-button-next]                            ← arrows=yes
//       [.swiper-button-prev]                            ← arrows=yes

const carouselWrap = (hook: string) =>
  `.${hook} .eael-team-member-carousel-wrap`;
const carousel     = (hook: string) => `.${hook} .eael-tm-carousel`;
const slide        = (hook: string) => `.${hook} .swiper-slide`;
const memberBox    = (hook: string) => `.${hook} .eael-tm`;
const memberImage  = (hook: string) => `.${hook} .eael-tm-image`;
const memberName   = (hook: string) => `.${hook} .eael-tm-name`;
const memberPos    = (hook: string) => `.${hook} .eael-tm-position`;
const memberDesc   = (hook: string) => `.${hook} .eael-tm-description`;
const socialWrap   = (hook: string) => `.${hook} .eael-tm-social-links-wrap`;
const overlay      = (hook: string) => `.${hook} .eael-tm-overlay-content-wrap`;
const pagination   = (hook: string) => `.${hook} .swiper-pagination`;
const arrowNext    = (hook: string) => `.${hook} .swiper-button-next`;
const arrowPrev    = (hook: string) => `.${hook} .swiper-button-prev`;

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
// 2. Default carousel — baseline smoke tests
// ══════════════════════════════════════════════════════════════════════════

test.describe("Default carousel", () => {
  const hook = "test-tmc-default";

  test("carousel wrapper is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(carouselWrap(hook)).first()).toBeAttached();
  });

  test("carousel swiper element is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(carousel(hook)).first()).toBeAttached();
  });

  test("three slides are rendered", async ({ page }) => {
    await openPage(page);
    const count = await page.locator(slide(hook)).count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("member image container is present in first slide", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(memberImage(hook)).first()).toBeAttached();
  });

  test("member name 'Alice Johnson' is rendered", async ({ page }) => {
    await openPage(page);
    const names = await page.locator(memberName(hook)).allTextContents();
    expect(names.some((n) => n.includes("Alice Johnson"))).toBe(true);
  });

  test("member name 'Bob Smith' is rendered", async ({ page }) => {
    await openPage(page);
    const names = await page.locator(memberName(hook)).allTextContents();
    expect(names.some((n) => n.includes("Bob Smith"))).toBe(true);
  });

  test("member name 'Carol White' is rendered", async ({ page }) => {
    await openPage(page);
    const names = await page.locator(memberName(hook)).allTextContents();
    expect(names.some((n) => n.includes("Carol White"))).toBe(true);
  });

  test("member position is rendered", async ({ page }) => {
    await openPage(page);
    const positions = await page.locator(memberPos(hook)).allTextContents();
    expect(positions.some((p) => p.includes("Lead Developer"))).toBe(true);
  });

  test("social links are present by default", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(socialWrap(hook)).first()).toBeAttached();
  });

  test("pagination (dots) are rendered by default", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(pagination(hook)).first()).toBeAttached();
  });

  test("next arrow is rendered by default", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(arrowNext(hook)).first()).toBeAttached();
  });

  test("prev arrow is rendered by default", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(arrowPrev(hook)).first()).toBeAttached();
  });

  test("no overlay content-wrap by default (overlay=none)", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(overlay(hook))).toHaveCount(0);
  });

  test("data-arrows attribute is set to '1'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(carousel(hook)).first()).toHaveAttribute(
      "data-arrows",
      "1"
    );
  });

  test("data-dots attribute is set to '1'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(carousel(hook)).first()).toHaveAttribute(
      "data-dots",
      "1"
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 3. Overlay content variants
// ══════════════════════════════════════════════════════════════════════════

test.describe("Overlay — social icons", () => {
  const hook = "test-tmc-overlay-social";

  test("overlay content-wrap is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(overlay(hook)).first()).toBeAttached();
  });

  test("social links are inside the overlay", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`${overlay(hook)} .eael-tm-social-links`).first()
    ).toBeAttached();
  });

  test("name and position are still in normal content area", async ({ page }) => {
    await openPage(page);
    await expect(
      page
        .locator(`.${hook} .eael-tm-content-normal .eael-tm-name`)
        .first()
    ).toBeAttached();
  });
});

test.describe("Overlay — description + social icons (all_content)", () => {
  const hook = "test-tmc-overlay-all";

  test("overlay content-wrap is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(overlay(hook)).first()).toBeAttached();
  });

  test("description is inside the overlay", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`${overlay(hook)} .eael-tm-description`).first()
    ).toBeAttached();
  });

  test("name is still rendered in normal content", async ({ page }) => {
    await openPage(page);
    await expect(
      page
        .locator(`.${hook} .eael-tm-content-normal .eael-tm-name`)
        .first()
    ).toBeAttached();
  });
});

test.describe("Overlay — all content (atoz_content)", () => {
  const hook = "test-tmc-overlay-atoz";

  test("overlay content-wrap is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(overlay(hook)).first()).toBeAttached();
  });

  test("name is inside the overlay for atoz mode", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`${overlay(hook)} .eael-tm-name`).first()
    ).toBeAttached();
  });

  test("position is inside the overlay for atoz mode", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`${overlay(hook)} .eael-tm-position`).first()
    ).toBeAttached();
  });

  test("normal content area has no name (atoz hides it there)", async ({
    page,
  }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-tm-content-normal .eael-tm-name`)
    ).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 4. Navigation variants
// ══════════════════════════════════════════════════════════════════════════

test.describe("Navigation — no arrows", () => {
  const hook = "test-tmc-no-arrows";

  test("swiper-button-next is not rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(arrowNext(hook))).toHaveCount(0);
  });

  test("swiper-button-prev is not rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(arrowPrev(hook))).toHaveCount(0);
  });

  test("carousel is still rendered without arrows", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(carousel(hook)).first()).toBeAttached();
  });
});

test.describe("Navigation — no dots", () => {
  const hook = "test-tmc-no-dots";

  test("swiper-pagination is not rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(pagination(hook))).toHaveCount(0);
  });

  test("carousel is still rendered without dots", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(carousel(hook)).first()).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 5. Social links visibility
// ══════════════════════════════════════════════════════════════════════════

test.describe("Social links — hidden", () => {
  const hook = "test-tmc-no-social";

  test("no .eael-tm-social-links-wrap rendered when social=off", async ({
    page,
  }) => {
    await openPage(page);
    await expect(page.locator(socialWrap(hook))).toHaveCount(0);
  });

  test("member names are still rendered without social links", async ({
    page,
  }) => {
    await openPage(page);
    await expect(page.locator(memberName(hook)).first()).toBeAttached();
  });
});

test.describe("Social links — visible (default)", () => {
  const hook = "test-tmc-default";

  test("social links ul is present", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} ul.eael-tm-social-links`).first()
    ).toBeAttached();
  });

  test("facebook link renders as an anchor with href '#'", async ({ page }) => {
    await openPage(page);
    const link = page
      .locator(`.${hook} .eael-tm-social-links li a[aria-label="Facebook"]`)
      .first();
    await expect(link).toBeAttached();
    await expect(link).toHaveAttribute("href", "#");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 6. Member HTML tags
// ══════════════════════════════════════════════════════════════════════════

test.describe("Member HTML tags", () => {
  test("default name tag is <h4>", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(memberName("test-tmc-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H4");
  });

  test("default position tag is <div>", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(memberPos("test-tmc-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("DIV");
  });

  test("name-h2 config renders name as <h2>", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(memberName("test-tmc-name-h2"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H2");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 7. Box alignment
//    Selector: {{WRAPPER}} .eael-tm → text-align: {VALUE}
// ══════════════════════════════════════════════════════════════════════════

test.describe("Box alignment", () => {
  test("align-center — .eael-tm has text-align: center", async ({ page }) => {
    await openPage(page);
    const align = await page
      .locator(memberBox("test-tmc-align-center"))
      .first()
      .evaluate((el) => getComputedStyle(el).textAlign);
    expect(align).toBe("center");
  });

  test("align-right — .eael-tm has text-align: right", async ({ page }) => {
    await openPage(page);
    const align = await page
      .locator(memberBox("test-tmc-align-right"))
      .first()
      .evaluate((el) => getComputedStyle(el).textAlign);
    expect(align).toBe("right");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 8. Element structure
// ══════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  const hook = "test-tmc-default";

  test("swiper wrapper div is present inside carousel", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .swiper-wrapper`).first()
    ).toBeAttached();
  });

  test("eael-tm box is inside swiper-slide", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .swiper-slide .eael-tm`).first()
    ).toBeAttached();
  });

  test("img tag is rendered inside .eael-tm-image", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-tm-image img`).first()
    ).toBeAttached();
  });

  test("normal content area carries both classes", async ({ page }) => {
    await openPage(page);
    const el = page
      .locator(`.${hook} .eael-tm-content.eael-tm-content-normal`)
      .first();
    await expect(el).toBeAttached();
  });

  test("description text matches seeded content", async ({ page }) => {
    await openPage(page);
    const descs = await page.locator(memberDesc(hook)).allTextContents();
    expect(
      descs.some((d) => d.includes("backend development"))
    ).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 9. Interaction
// ══════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover on each carousel instance triggers no JS errors", async ({
    page,
  }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-tmc-default",
      "test-tmc-overlay-social",
      "test-tmc-overlay-all",
      "test-tmc-overlay-atoz",
      "test-tmc-no-arrows",
      "test-tmc-no-dots",
      "test-tmc-no-social",
      "test-tmc-name-h2",
      "test-tmc-align-center",
      "test-tmc-align-right",
    ]) {
      await page.locator(carouselWrap(hook)).first().hover({ force: true });
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking next arrow on default carousel causes no JS errors", async ({
    page,
  }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(arrowNext("test-tmc-default")).first().click({ force: true });
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});

  }
});
