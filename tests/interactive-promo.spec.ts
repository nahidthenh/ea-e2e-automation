import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.INTERACTIVE_PROMO_PAGE_SLUG ?? "interactive-promo"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Interactive_Promo::render()):
//   .{hook}                                        ← elementor-widget wrapper
//     .eael-interactive-promo[id="eael-promo-{id}"]
//       figure.{effect-class}
//         img[alt][src]
//         figcaption
//           div
//             h2                                   ← promo heading
//             p                                    ← promo content
//           a                                      ← overlay link (if url set)

const promo   = (hook: string) => `.${hook} .eael-interactive-promo`;
const figure  = (hook: string) => `.${hook} .eael-interactive-promo figure`;
const heading = (hook: string) => `.${hook} .eael-interactive-promo figcaption h2`;
const body    = (hook: string) => `.${hook} .eael-interactive-promo figcaption p`;
const link    = (hook: string) => `.${hook} .eael-interactive-promo figcaption a`;

// ── all 15 effect classes ──────────────────────────────────────────────────
const EFFECTS = [
  "effect-lily",
  "effect-sadie",
  "effect-layla",
  "effect-oscar",
  "effect-marley",
  "effect-ruby",
  "effect-roxy",
  "effect-bubba",
  "effect-romeo",
  "effect-sarah",
  "effect-chico",
  "effect-milo",
  "effect-apollo",
  "effect-jazz",
  "effect-ming",
] as const;

// ── hook → effect class ────────────────────────────────────────────────────
const effectMap: Record<string, string> = Object.fromEntries(
  EFFECTS.map((e) => [`test-ip-${e.replace("effect-", "")}`, e])
);

// ── helpers ────────────────────────────────────────────────────────────────

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
// 2. Promo effects — one instance per effect class
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Promo effects", () => {
  for (const [hook, effectClass] of Object.entries(effectMap)) {
    test(`${effectClass} — promo container is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(promo(hook)).first()).toBeVisible();
    });

    test(`${effectClass} — figure has correct CSS class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(figure(hook)).first()).toHaveClass(
        new RegExp(effectClass)
      );
    });

    test(`${effectClass} — heading renders default text`, async ({ page }) => {
      await openPage(page);
      const txt = await page.locator(heading(hook)).first().textContent();
      expect(txt?.trim()).toBe("I am Interactive");
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Link behaviour
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Link behaviour", () => {
  test("default: overlay link href is '#'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(link("test-ip-lily")).first()).toHaveAttribute("href", "#");
  });

  test("external link: <a> has target='_blank'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(link("test-ip-link-ext")).first()).toHaveAttribute(
      "target",
      "_blank"
    );
  });

  test("external link: href contains configured domain", async ({ page }) => {
    await openPage(page);
    const href = await page
      .locator(link("test-ip-link-ext"))
      .first()
      .getAttribute("href");
    expect(href).toContain("essential-addons.com");
  });

  test("nofollow link: rel contains 'nofollow'", async ({ page }) => {
    await openPage(page);
    const rel = await page
      .locator(link("test-ip-link-nofollow"))
      .first()
      .getAttribute("rel");
    expect(rel).toContain("nofollow");
  });

  test("non-external link has no target='_blank'", async ({ page }) => {
    await openPage(page);
    const target = await page
      .locator(link("test-ip-lily"))
      .first()
      .getAttribute("target");
    expect(target).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Element structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("container has class 'eael-interactive-promo'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(promo("test-ip-lily")).first()).toBeAttached();
  });

  test("container id begins with 'eael-promo-'", async ({ page }) => {
    await openPage(page);
    const id = await page
      .locator(promo("test-ip-lily"))
      .first()
      .getAttribute("id");
    expect(id).toMatch(/^eael-promo-/);
  });

  test("figure wraps an <img> element", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ip-lily .eael-interactive-promo figure img").first()
    ).toBeAttached();
  });

  test("figcaption contains both heading and paragraph", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(heading("test-ip-lily")).first()).toBeAttached();
    await expect(page.locator(body("test-ip-lily")).first()).toBeAttached();
  });

  test("content paragraph renders default text", async ({ page }) => {
    await openPage(page);
    const txt = await page.locator(body("test-ip-lily")).first().textContent();
    expect(txt?.trim()).toContain("Click to inspect");
  });

  test("effect class is one of the known 15 effects", async ({ page }) => {
    await openPage(page);
    const cls = (await page.locator(figure("test-ip-lily")).first().getAttribute("class")) ?? "";
    const hasEffect = EFFECTS.some((e) => cls.includes(e));
    expect(hasEffect, `Unknown effect in: "${cls}"`).toBe(true);
  });

  test("overlay link is an <a> tag", async ({ page }) => {
    await openPage(page);
    const tag = await page.locator(link("test-ip-lily")).first().evaluate((el) => el.tagName);
    expect(tag).toBe("A");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover on each effect instance triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of Object.keys(effectMap)) {
      await page.locator(figure(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking the overlay link on default instance causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(link("test-ip-lily")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
