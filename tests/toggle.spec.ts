import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.TOGGLE_PAGE_SLUG ?? "toggle"}/`;

// ── selectors ─────────────────────────────────────────────────────────────────
// DOM shape (from Toggle::render()):
//   .{hook}                                        ← elementor-widget wrapper
//     .eael-toggle-{center|left|right}             ← switch alignment (prefix_class)
//     .eael-toggle-container                       ← main container
//       .eael-toggle-switch-wrap
//         .eael-toggle-switch-inner
//           .eael-primary-toggle-label             ← primary label (not grasshopper)
//           div[tabindex=0].eael-toggle-switch-container
//             .eael-toggle-switch-{round|rectangle}
//             — default style:
//                 label.eael-toggle-switch
//                   input[type="checkbox"]
//                   span.eael-toggle-slider
//             — glossy style (.eael-glossy-switcher):
//                 label.eael-glossy-switcher__option[data-option="1"] > input[type="radio"]
//                 label.eael-glossy-switcher__option[data-option="2"] > input[type="radio"]
//             — grasshopper style:
//                 div.eael-toggle-flip-switch
//                   input.eael-flip-switcher__input[c-option="1"]
//                   input.eael-flip-switcher__input[c-option="2"]
//                   label.eael-switch-button[data-option="1"]
//                     div.eael-primary-toggle-label
//                   label.eael-switch-button[data-option="2"]
//                     div.eael-secondary-toggle-label
//           .eael-secondary-toggle-label           ← secondary label (not grasshopper)
//       .eael-toggle-content-wrap.primary
//         .eael-toggle-primary-wrap                ← primary content panel
//         .eael-toggle-secondary-wrap              ← secondary content panel

const container   = (hook: string) => `.${hook} .eael-toggle-container`;
const switchWrap  = (hook: string) => `.${hook} .eael-toggle-switch-container`;
const primaryWrap = (hook: string) => `.${hook} .eael-toggle-primary-wrap`;
const secondaryWrap = (hook: string) => `.${hook} .eael-toggle-secondary-wrap`;
const primaryLabel  = (hook: string) => `.${hook} .eael-primary-toggle-label`;
const secondaryLabel = (hook: string) => `.${hook} .eael-secondary-toggle-label`;
const contentWrap = (hook: string) => `.${hook} .eael-toggle-content-wrap`;

// ── known effects styles ──────────────────────────────────────────────────────
const EFFECTS_STYLES = ["default", "glossy", "grasshopper"] as const;

// ── helpers ───────────────────────────────────────────────────────────────────

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
// 2. Effects styles
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Effects styles", () => {
  const styleHookMap: Record<string, string> = {
    "test-t-default":     "default",
    "test-t-glossy":      "glossy",
    "test-t-grasshopper": "grasshopper",
  };

  for (const [hook, style] of Object.entries(styleHookMap)) {
    test(`${style}: .eael-toggle-container is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(container(hook)).first()).toBeVisible();
    });

    test(`${style}: .eael-toggle-switch-container is rendered`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(switchWrap(hook)).first()).toBeAttached();
    });
  }

  test("default: switch container has .eael-toggle-switch-round class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(switchWrap("test-t-default")).first()).toHaveClass(
      /eael-toggle-switch-round/
    );
  });

  test("default: renders a checkbox input inside .eael-toggle-switch", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator('.test-t-default .eael-toggle-switch input[type="checkbox"]').first()
    ).toBeAttached();
  });

  test("default: .eael-toggle-slider is rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-t-default .eael-toggle-slider").first()
    ).toBeAttached();
  });

  test("glossy: switch container has .eael-glossy-switcher class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(switchWrap("test-t-glossy")).first()).toHaveClass(
      /eael-glossy-switcher/
    );
  });

  test("glossy: renders two radio inputs (.eael-glossy-switcher__input)", async ({ page }) => {
    await openPage(page);
    const radios = page.locator(
      '.test-t-glossy .eael-glossy-switcher__input[type="radio"]'
    );
    expect(await radios.count()).toBe(2);
  });

  test("glossy: option labels have data-option attributes 1 and 2", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator('.test-t-glossy .eael-glossy-switcher__option[data-option="1"]').first()
    ).toBeAttached();
    await expect(
      page.locator('.test-t-glossy .eael-glossy-switcher__option[data-option="2"]').first()
    ).toBeAttached();
  });

  test("grasshopper: .eael-toggle-flip-switch is rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-t-grasshopper .eael-toggle-flip-switch").first()
    ).toBeAttached();
  });

  test("grasshopper: renders two .eael-flip-switcher__input radio inputs", async ({ page }) => {
    await openPage(page);
    const radios = page.locator(
      '.test-t-grasshopper .eael-flip-switcher__input[type="radio"]'
    );
    expect(await radios.count()).toBe(2);
  });

  test("grasshopper: .eael-switch-button labels have data-option attributes 1 and 2", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator('.test-t-grasshopper .eael-switch-button[data-option="1"]').first()
    ).toBeAttached();
    await expect(
      page.locator('.test-t-grasshopper .eael-switch-button[data-option="2"]').first()
    ).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Switch styles
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Switch styles", () => {
  const switchStyleMap: Record<string, string> = {
    "test-t-default":   "eael-toggle-switch-round",
    "test-t-rectangle": "eael-toggle-switch-rectangle",
  };

  for (const [hook, styleClass] of Object.entries(switchStyleMap)) {
    test(`${styleClass}: switch container has correct class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(switchWrap(hook)).first()).toHaveClass(
        new RegExp(styleClass)
      );
    });
  }

  test("rectangle: .eael-toggle-switch is still rendered inside rectangle container", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-t-rectangle .eael-toggle-switch").first()
    ).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Alignment (switch alignment prefix_class)
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Switch alignment", () => {
  test("default alignment: widget wrapper has .eael-toggle-center class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(".test-t-default").first()).toHaveClass(
      /eael-toggle-center/
    );
  });

  test("left alignment: widget wrapper has .eael-toggle-left class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(".test-t-align-left").first()).toHaveClass(
      /eael-toggle-left/
    );
  });

  test("right alignment: widget wrapper has .eael-toggle-right class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(".test-t-align-right").first()).toHaveClass(
      /eael-toggle-right/
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Content panels and labels
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Content panels and labels", () => {
  const hook = "test-t-default";

  test("primary label renders configured text 'Light'", async ({ page }) => {
    await openPage(page);
    const text = await page
      .locator(primaryLabel(hook))
      .first()
      .textContent();
    expect(text?.trim()).toBe("Light");
  });

  test("secondary label renders configured text 'Dark'", async ({ page }) => {
    await openPage(page);
    const text = await page
      .locator(secondaryLabel(hook))
      .first()
      .textContent();
    expect(text?.trim()).toBe("Dark");
  });

  test(".eael-toggle-primary-wrap is in the DOM", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(primaryWrap(hook)).first()).toBeAttached();
  });

  test(".eael-toggle-secondary-wrap is in the DOM", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(secondaryWrap(hook)).first()).toBeAttached();
  });

  test("primary wrap contains the configured primary content", async ({ page }) => {
    await openPage(page);
    const text = await page
      .locator(primaryWrap(hook))
      .first()
      .textContent();
    expect(text?.trim()).toContain("Primary Content");
  });

  test("secondary wrap contains the configured secondary content", async ({ page }) => {
    await openPage(page);
    const text = await page
      .locator(secondaryWrap(hook))
      .first()
      .textContent();
    expect(text?.trim()).toContain("Secondary Content");
  });

  test(".eael-toggle-content-wrap has 'primary' class on initial render", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(contentWrap(hook)).first()).toHaveClass(/primary/);
  });

  test("grasshopper: primary label is inside .eael-switch-button (not outside)", async ({ page }) => {
    await openPage(page);
    await expect(
      page
        .locator('.test-t-grasshopper .eael-switch-button[data-option="1"] .eael-primary-toggle-label')
        .first()
    ).toBeAttached();
  });

  test("grasshopper: secondary label is inside .eael-switch-button", async ({ page }) => {
    await openPage(page);
    await expect(
      page
        .locator('.test-t-grasshopper .eael-switch-button[data-option="2"] .eael-secondary-toggle-label')
        .first()
    ).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Element structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  const hook = "test-t-default";

  test(".eael-toggle-container is attached", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container(hook)).first()).toBeAttached();
  });

  test(".eael-toggle-switch-wrap is attached", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-toggle-switch-wrap`).first()
    ).toBeAttached();
  });

  test(".eael-toggle-switch-inner is attached", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-toggle-switch-inner`).first()
    ).toBeAttached();
  });

  test(".eael-toggle-switch-container has tabindex='0'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(switchWrap(hook)).first()).toHaveAttribute(
      "tabindex",
      "0"
    );
  });

  test("all three effects styles render .eael-toggle-container", async ({ page }) => {
    await openPage(page);
    for (const style of EFFECTS_STYLES) {
      const h =
        style === "default"
          ? "test-t-default"
          : style === "glossy"
          ? "test-t-glossy"
          : "test-t-grasshopper";
      await expect(page.locator(container(h)).first()).toBeAttached();
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("default switch container is keyboard-focusable (tabindex=0)", async ({ page }) => {
    await openPage(page);
    const sw = page.locator(switchWrap("test-t-default")).first();
    await sw.focus();
    await expect(sw).toBeFocused();
  });

  test("clicking the default checkbox switch causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page
      .locator(".test-t-default label.eael-toggle-switch")
      .first()
      .click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking glossy option-2 radio causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page
      .locator('.test-t-glossy .eael-glossy-switcher__option[data-option="2"]')
      .first()
      .click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking grasshopper option-2 label causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page
      .locator('.test-t-grasshopper .eael-switch-button[data-option="2"]')
      .first()
      .click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover on each effects style triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of ["test-t-default", "test-t-glossy", "test-t-grasshopper"]) {
      await page.locator(container(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});

  }
});
