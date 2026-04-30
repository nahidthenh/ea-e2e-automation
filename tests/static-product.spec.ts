import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.STATIC_PRODUCT_PAGE_SLUG ?? "static-product"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Static_Product::render()):
//
// Layout default / two:
//   .{hook}
//     #eael-static-product-{id}.eael-static-product
//       .eael-static-product-media
//         .eael-static-product-thumb-overlay
//           a.eael-static-product-live-demo-btn   ← demo link (span inside)
//           .eael-static-product-add-to-cart      ← cart btn (layout=two only)
//         .eael-static-product-thumb > img
//       .eael-static-product-details
//         h2 > a                                  ← product heading link
//         p                                       ← description
//         .eael-static-product-price-and-reviews  ← conditional
//           span.eael-static-product-price
//           span.eael-static-product-reviews
//         .eael-static-product-btn-wrap
//           a.eael-static-product-btn             ← details button
//           .eael-static-product-add-to-cart      ← cart btn (layout=default only)
//
// Layout three (.eael-static-product--style-three):
//   .{hook}
//     .eael-static-product.eael-static-product--style-three
//       .eael-static-product-media
//         .eael-static-product-thumb-overlay
//           .eael-static-product-details          ← details inside overlay
//             h2 > a
//             .eael-static-product-price-and-reviews
//             p
//             .eael-static-product-btn-wrap
//               a.eael-static-product-btn
//               a.eael-static-product-live-demo-btn
//         .eael-static-product-thumb > img

const container  = (hook: string) => `.${hook} .eael-static-product`;
const heading    = (hook: string) => `.${hook} .eael-static-product-details h2 a`;
const detailsBtn = (hook: string) => `.${hook} .eael-static-product-btn`;
const demoLink   = (hook: string) => `.${hook} .eael-static-product-live-demo-btn`;
const thumb      = (hook: string) => `.${hook} .eael-static-product-thumb img`;
const priceEl    = (hook: string) => `.${hook} .eael-static-product-price`;
const reviewsEl  = (hook: string) => `.${hook} .eael-static-product-reviews`;

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
// 2. Layouts
// ══════════════════════════════════════════════════════════════════════════

test.describe("Layouts", () => {
  test("default layout — .eael-static-product container is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-sp-default")).first()).toBeVisible();
  });

  test("default layout — product image is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(thumb("test-sp-default")).first()).toBeAttached();
  });

  test("default layout — heading text rendered", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(heading("test-sp-default")).first().textContent();
    expect(text?.trim()).toBe("Test Static Product");
  });

  test("layout two — container is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-sp-layout-two")).first()).toBeVisible();
  });

  test("layout two — add-to-cart button is present in overlay", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-sp-layout-two .eael-static-product-thumb-overlay .eael-static-product-add-to-cart").first()
    ).toBeAttached();
  });

  test("layout three — has .eael-static-product--style-three class", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-sp-layout-three .eael-static-product").first()
    ).toHaveClass(/eael-static-product--style-three/);
  });

  test("layout three — details div is inside thumb-overlay", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-sp-layout-three .eael-static-product-thumb-overlay .eael-static-product-details").first()
    ).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 3. Price & rating
// ══════════════════════════════════════════════════════════════════════════

test.describe("Price and rating", () => {
  test("price hidden when disabled (default instance)", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(priceEl("test-sp-default"))).toHaveCount(0);
  });

  test("price visible when enabled — shows correct value", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(priceEl("test-sp-with-price")).first()).toBeVisible();
    const text = await page.locator(priceEl("test-sp-with-price")).first().textContent();
    expect(text?.trim()).toBe("$49.99");
  });

  test("rating hidden when disabled (default instance)", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(reviewsEl("test-sp-default"))).toHaveCount(0);
  });

  test("rating visible when enabled — shows review text", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(reviewsEl("test-sp-with-rating")).first()).toBeVisible();
    const text = await page.locator(reviewsEl("test-sp-with-rating")).first().textContent();
    expect(text?.trim()).toBe("(4.8 Reviews)");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 4. Buttons
// ══════════════════════════════════════════════════════════════════════════

test.describe("Buttons", () => {
  test("details button present when enabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(detailsBtn("test-sp-default")).first()).toBeVisible();
    const text = await page.locator(detailsBtn("test-sp-default")).first().textContent();
    expect(text?.trim()).toContain("View Details");
  });

  test("details button absent when disabled", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(detailsBtn("test-sp-no-details-btn"))).toHaveCount(0);
  });

  test("live demo link present by default", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(demoLink("test-sp-default")).first()).toBeAttached();
  });

  test("live demo shows text span when icon disabled", async ({ page }) => {
    await openPage(page);
    const span = page.locator(".test-sp-default .eael-static-product-live-demo-btn span").first();
    await expect(span).toBeAttached();
    const text = await span.textContent();
    expect(text?.trim()).toBe("Live Demo");
  });

  test("live demo shows icon element when icon enabled", async ({ page }) => {
    await openPage(page);
    // With demo icon enabled, the span holds the icon class, not text
    await expect(
      page.locator(".test-sp-demo-icon .eael-static-product-live-demo-btn span.eicon-eye").first()
    ).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 5. Link behaviour
// ══════════════════════════════════════════════════════════════════════════

test.describe("Link behaviour", () => {
  test("default product link href is '#'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(heading("test-sp-default")).first()).toHaveAttribute("href", "#");
  });

  test("external link has target='_blank'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(heading("test-sp-link-external")).first()).toHaveAttribute(
      "target",
      "_blank"
    );
  });

  test("external link href points to configured URL", async ({ page }) => {
    await openPage(page);
    const href = await page
      .locator(heading("test-sp-link-external"))
      .first()
      .getAttribute("href");
    expect(href).toContain("essential-addons.com");
  });

  test("details button inherits same href as heading link (default)", async ({ page }) => {
    await openPage(page);
    const headingHref = await page.locator(heading("test-sp-default")).first().getAttribute("href");
    const btnHref     = await page.locator(detailsBtn("test-sp-default")).first().getAttribute("href");
    expect(btnHref).toBe(headingHref);
  });

  test("demo link opens in _blank by default", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(demoLink("test-sp-default")).first()).toHaveAttribute(
      "target",
      "_blank"
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 6. Content alignment
// ══════════════════════════════════════════════════════════════════════════

test.describe("Content alignment", () => {
  test("default alignment is center", async ({ page }) => {
    await openPage(page);
    const align = await page
      .locator(".test-sp-default .eael-static-product-details")
      .first()
      .evaluate((el) => getComputedStyle(el).textAlign);
    expect(align).toBe("center");
  });

  test("left alignment sets text-align: left on details", async ({ page }) => {
    await openPage(page);
    const align = await page
      .locator(".test-sp-align-left .eael-static-product-details")
      .first()
      .evaluate((el) => getComputedStyle(el).textAlign);
    expect(align).toBe("left");
  });

  test("right alignment sets text-align: right on details", async ({ page }) => {
    await openPage(page);
    const align = await page
      .locator(".test-sp-align-right .eael-static-product-details")
      .first()
      .evaluate((el) => getComputedStyle(el).textAlign);
    expect(align).toBe("right");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 7. Element structure
// ══════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("product heading is rendered as an <h2> tag", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(".test-sp-default .eael-static-product-details h2")
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H2");
  });

  test("product heading wraps an <a> anchor", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(heading("test-sp-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("A");
  });

  test("product image renders in .eael-static-product-thumb", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(thumb("test-sp-default")).first()).toBeAttached();
  });

  test("details button is an <a> tag with class eael-static-product-btn", async ({ page }) => {
    await openPage(page);
    const tag = await page.locator(detailsBtn("test-sp-default")).first().evaluate((el) => el.tagName);
    expect(tag).toBe("A");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 8. Interaction
// ══════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("details button is keyboard-focusable", async ({ page }) => {
    await openPage(page);
    const btn = page.locator(detailsBtn("test-sp-default")).first();
    await btn.focus();
    await expect(btn).toBeFocused();
  });

  test("hover on each widget instance triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    const hooks = [
      "test-sp-default",
      "test-sp-layout-two",
      "test-sp-layout-three",
      "test-sp-with-price",
      "test-sp-with-rating",
      "test-sp-no-details-btn",
      "test-sp-demo-icon",
      "test-sp-link-external",
      "test-sp-align-left",
      "test-sp-align-right",
    ];

    for (const hook of hooks) {
      await page.locator(container(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking the details button causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(detailsBtn("test-sp-default")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});

  }
});
