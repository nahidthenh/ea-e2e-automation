import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.INTERACTIVE_CIRCLE_PAGE_SLUG ?? "interactive-circle"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Interactive_Circle::render()):
//   .{hook}                                       ← elementor-widget wrapper
//     .eael-interactive-circle                    ← container
//       .eael-circle-wrapper.{preset-cls}.{event-cls}
//         .eael-circle-info[data-items=N]         ← presets 1,3,4
//           .eael-circle-inner
//             .eael-circle-item                   ← per item
//               .eael-circle-btn[tabindex="0"]    ← button (clickable)
//                 .eael-circle-btn-icon
//                   .eael-circle-icon-inner       ← presets 1,3,4
//                     i/svg                       ← btn icon (if show_btn_icon)
//                     .eael-circle-btn-txt        ← btn text
//               .eael-circle-btn-content.eael-circle-item-N
//                 .eael-circle-content            ← content text
//   Preset 2: .eael-circle-inner[data-items=N], inner uses .eael-circle-btn-icon-inner
//   Presets 3,4: .eael-circle-icon-shapes > .eael-shape-1 + .eael-shape-2 inside button

const container  = (hook: string) => `.${hook} .eael-interactive-circle`;
const wrapper    = (hook: string) => `.${hook} .eael-circle-wrapper`;
const circleItem = (hook: string) => `.${hook} .eael-circle-item`;
const circleBtn  = (hook: string) => `.${hook} .eael-circle-btn`;
const btnText    = (hook: string) => `.${hook} .eael-circle-btn-txt`;
const content    = (hook: string) => `.${hook} .eael-circle-content`;

// ── known preset values ────────────────────────────────────────────────────
const FREE_PRESETS = [
  "eael-interactive-circle-preset-1",
  "eael-interactive-circle-preset-2",
  "eael-interactive-circle-preset-3",
  "eael-interactive-circle-preset-4",
] as const;

// ── preset → hook map ──────────────────────────────────────────────────────
const presetMap: Record<string, string> = {
  "test-ic-default":  "eael-interactive-circle-preset-1",
  "test-ic-preset-2": "eael-interactive-circle-preset-2",
  "test-ic-preset-3": "eael-interactive-circle-preset-3",
  "test-ic-preset-4": "eael-interactive-circle-preset-4",
};

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
// 2. Preset styles (free) — one instance per preset
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Preset styles (free)", () => {
  for (const [hook, presetClass] of Object.entries(presetMap)) {
    test(`${presetClass} wrapper is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrapper(hook)).first()).toBeVisible();
    });

    test(`${presetClass} applies correct CSS class to wrapper`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrapper(hook)).first()).toHaveClass(
        new RegExp(presetClass)
      );
    });

    test(`${presetClass} renders circle items`, async ({ page }) => {
      await openPage(page);
      const items = page.locator(circleItem(hook));
      await expect(items.first()).toBeAttached();
      expect(await items.count()).toBeGreaterThanOrEqual(1);
    });

    test(`${presetClass} default item button text is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(btnText(hook)).first()).toBeVisible();
    });

    test(`${presetClass} content area is attached`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(content(hook)).first()).toBeAttached();
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Button visibility controls
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Button visibility", () => {
  test("btn-icon-off: button icon element is absent", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ic-btn-icon-off .eael-circle-btn-icon i, .test-ic-btn-icon-off .eael-circle-btn-icon svg")
    ).toHaveCount(0);
  });

  test("btn-icon-off: button text is still visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(btnText("test-ic-btn-icon-off")).first()).toBeVisible();
  });

  test("btn-text-off: .eael-circle-btn-txt elements are absent", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ic-btn-text-off .eael-circle-btn-txt")
    ).toHaveCount(0);
  });

  test("btn-text-off: button icon is still rendered", async ({ page }) => {
    await openPage(page);
    const icon = page.locator(
      ".test-ic-btn-text-off .eael-circle-btn-icon i, .test-ic-btn-text-off .eael-circle-btn-icon svg"
    );
    await expect(icon.first()).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Content icon (Preset 2 only)
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Content icon — Preset 2", () => {
  test("content-icon-on: .eael-circle-content-icon is rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ic-content-icon .eael-circle-content-icon").first()
    ).toBeVisible();
  });

  test("content-icon-on: icon element inside content-icon div is attached", async ({ page }) => {
    await openPage(page);
    const icon = page.locator(
      ".test-ic-content-icon .eael-circle-content-icon i, .test-ic-content-icon .eael-circle-content-icon svg"
    );
    await expect(icon.first()).toBeAttached();
  });

  test("default preset-2 has no content icon when not enabled", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ic-preset-2 .eael-circle-content-icon")
    ).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Mouse event variants
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Mouse event", () => {
  test("event-click (default): wrapper has eael-interactive-circle-event-click class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrapper("test-ic-default")).first()).toHaveClass(
      /eael-interactive-circle-event-click/
    );
  });

  test("event-hover: wrapper has eael-interactive-circle-event-hover class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrapper("test-ic-event-hover")).first()).toHaveClass(
      /eael-interactive-circle-event-hover/
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Rotation animation
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Rotation animation", () => {
  test("rotation-on: wrapper has eael-interactive-circle-rotate class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrapper("test-ic-rotation")).first()).toHaveClass(
      /eael-interactive-circle-rotate/
    );
  });

  test("rotation-off (default): wrapper does not have rotate class", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(wrapper("test-ic-default")).first().getAttribute("class") ?? "";
    expect(cls).not.toContain("eael-interactive-circle-rotate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Item link behaviour
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Item link", () => {
  test("linked item renders an <a> tag inside the button", async ({ page }) => {
    await openPage(page);
    const link = page.locator(".test-ic-link .eael-circle-item .eael-circle-btn a").first();
    await expect(link).toBeAttached();
  });

  test("linked item <a> has target='_blank' for external link", async ({ page }) => {
    await openPage(page);
    const link = page.locator(".test-ic-link .eael-circle-item .eael-circle-btn a").first();
    await expect(link).toHaveAttribute("target", "_blank");
  });

  test("linked item <a> href points to configured URL", async ({ page }) => {
    await openPage(page);
    const href = await page
      .locator(".test-ic-link .eael-circle-item .eael-circle-btn a")
      .first()
      .getAttribute("href");
    expect(href).toContain("essential-addons.com");
  });

  test("non-linked item has no <a> inside the button", async ({ page }) => {
    await openPage(page);
    // The default instance has no item links enabled.
    await expect(
      page.locator(".test-ic-default .eael-circle-item .eael-circle-btn a")
    ).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Preset 3 & 4 — connector shapes
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Connector shapes (Presets 3 & 4)", () => {
  for (const hook of ["test-ic-preset-3", "test-ic-preset-4"]) {
    test(`${hook}: .eael-circle-icon-shapes is rendered inside button`, async ({ page }) => {
      await openPage(page);
      await expect(
        page.locator(`.${hook} .eael-circle-btn .eael-circle-icon-shapes`).first()
      ).toBeAttached();
    });

    test(`${hook}: .eael-shape-1 is rendered`, async ({ page }) => {
      await openPage(page);
      await expect(
        page.locator(`.${hook} .eael-shape-1`).first()
      ).toBeAttached();
    });
  }

  test("preset-1: no .eael-circle-icon-shapes inside button", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ic-default .eael-circle-btn .eael-circle-icon-shapes")
    ).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. Element structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("container has class eael-interactive-circle", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(container("test-ic-default")).first()).toBeAttached();
  });

  test("wrapper preset class is one of the known free presets", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(wrapper("test-ic-default")).first().getAttribute("class") ?? "";
    const hasPreset = FREE_PRESETS.some((p) => cls.includes(p));
    expect(hasPreset, `Unknown preset in: "${cls}"`).toBe(true);
  });

  test("each item has a .eael-circle-btn with tabindex='0'", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(circleBtn("test-ic-default")).first()
    ).toHaveAttribute("tabindex", "0");
  });

  test("each item has a .eael-circle-btn-content panel", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-ic-default .eael-circle-btn-content").first()
    ).toBeAttached();
  });

  test("content area has text in default item", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(content("test-ic-default")).first().textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("circle button is keyboard-focusable", async ({ page }) => {
    await openPage(page);
    const btn = page.locator(circleBtn("test-ic-default")).first();
    await btn.focus();
    await expect(btn).toBeFocused();
  });

  test("hover on each preset instance triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of Object.keys(presetMap)) {
      await page.locator(circleBtn(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking the default instance button causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(circleBtn("test-ic-default")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("button text reflects configured title", async ({ page }) => {
    await openPage(page);
    const texts = await page.locator(btnText("test-ic-default")).allTextContents();
    expect(texts.map((t) => t.trim())).toContain("Home");
  });
});

  }
});
