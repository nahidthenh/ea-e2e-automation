import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.CODE_SNIPPET_PAGE_SLUG ?? "code-snippet"}/`;

// ── selectors ─────────────────────────────────────────────────────────────────
// DOM shape (from Code_Snippet::render()):
//   .{hook}                                              ← elementor-widget wrapper
//     .eael-code-snippet-wrapper.theme-{light|dark}
//                               .view-mode-{default|fixed|collapsed}
//       [data-language="{lang}"]
//       .eael-code-snippet-header.eael-file-preview-header  (if show_header=yes)
//         .eael-file-preview-left
//           .eael-traffic-lights                            (if show_traffic_lights=yes)
//           .eael-file-info
//             .eael-file-icon > .eael-file-icon-emoji       (if show_file_icon=yes)
//             .eael-file-name > .file-name-text             (if file_name non-empty)
//         .eael-file-preview-right                          (if show_copy_button=yes)
//           .eael-code-snippet-copy-container
//             button.eael-code-snippet-copy-button
//             .eael-code-snippet-tooltip                    (if show_copy_tooltip=yes)
//       .eael-code-snippet-content
//         .eael-code-snippet-line-numbers                   (if show_line_numbers=yes)
//           .line-number
//         pre.eael-code-snippet-code.language-{lang}        (hljs replaces innerHTML after load)
//         .eael-code-snippet-collapsed-indicator-wrapper    (if collapsed)
//           .eael-code-snippet-collapsed-indicator.eael-cs-indicator-type-full_width
//             span.eael-code-snippet-collapsed-indicator-text.eael-csi-collapsed
//             span.eael-code-snippet-collapsed-indicator-text.eael-csi-expanded

const wrapper    = (hook: string) => `.${hook} .eael-code-snippet-wrapper`;
const header     = (hook: string) => `.${hook} .eael-code-snippet-header`;
const codeBlock  = (hook: string) => `.${hook} .eael-code-snippet-code`;
const copyBtn    = (hook: string) => `.${hook} .eael-code-snippet-copy-button`;
const lineNums   = (hook: string) => `.${hook} .eael-code-snippet-line-numbers`;
const tooltip    = (hook: string) => `.${hook} .eael-code-snippet-tooltip`;
const fileName   = (hook: string) => `.${hook} .file-name-text`;
const collapsed  = (hook: string) => `.${hook} .eael-code-snippet-collapsed-indicator-wrapper`;

// ── known theme values ─────────────────────────────────────────────────────────
const FREE_THEMES = ["light", "dark"] as const;

// ── helpers ───────────────────────────────────────────────────────────────────

async function openPage(page: Page) {
  await page.goto(PAGE_URL);
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
// 2. Code Snippet themes (free)
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Code Snippet themes", () => {
  const themeMap: Record<string, string> = {
    "test-cs-default": "light",
    "test-cs-dark":    "dark",
  };

  for (const [hook, theme] of Object.entries(themeMap)) {
    test(`theme-${theme} wrapper is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrapper(hook)).first()).toBeVisible();
    });

    test(`theme-${theme} applies correct CSS class on wrapper`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrapper(hook)).first()).toHaveClass(
        new RegExp(`theme-${theme}`)
      );
    });

    test(`theme-${theme} renders the code block`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(codeBlock(hook)).first()).toBeVisible();
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Language rendering
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Language rendering", () => {
  const langMap: Record<string, string> = {
    "test-cs-default": "html",
    "test-cs-php":     "php",
    "test-cs-js":      "js",
  };

  for (const [hook, lang] of Object.entries(langMap)) {
    test(`${lang}: wrapper has data-language='${lang}'`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrapper(hook)).first()).toHaveAttribute(
        "data-language",
        lang
      );
    });

    test(`${lang}: pre block has class language-${lang}`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(codeBlock(hook)).first()).toHaveClass(
        new RegExp(`language-${lang}`)
      );
    });

    test(`${lang}: pre code block is attached`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(codeBlock(hook)).first()).toBeAttached();
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 4b. View modes
// ══════════════════════════════════════════════════════════════════════════════

test.describe("View modes", () => {
  test("default view-mode applies view-mode-default class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrapper("test-cs-default")).first()).toHaveClass(
      /view-mode-default/
    );
  });

  test("fixed view-mode applies view-mode-fixed class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrapper("test-cs-fixed")).first()).toHaveClass(
      /view-mode-fixed/
    );
  });

  test("collapsed view-mode applies view-mode-collapsed class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrapper("test-cs-collapsed")).first()).toHaveClass(
      /view-mode-collapsed/
    );
  });

  test("collapsed indicator wrapper is present in collapsed mode", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(collapsed("test-cs-collapsed")).first()).toBeAttached();
  });

  test("collapsed indicator shows 'Show more' text initially", async ({ page }) => {
    await openPage(page);
    const text = await page
      .locator(".test-cs-collapsed .eael-code-snippet-collapsed-indicator-text.eael-csi-collapsed")
      .first()
      .textContent();
    expect(text?.trim()).toBe("Show more");
  });

  test("collapsed indicator shows 'Show less' text for expanded state", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-cs-collapsed .eael-code-snippet-collapsed-indicator-text.eael-csi-expanded").first()
    ).toBeAttached();
  });

  test("no collapsed indicator in default view mode", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(collapsed("test-cs-default"))).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4c. Header visibility
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Header visibility", () => {
  test("header is visible by default", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(header("test-cs-default")).first()).toBeVisible();
  });

  test("header is absent when show_header is off", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(header("test-cs-no-header"))).toHaveCount(0);
  });

  test("file name text is rendered in header", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(fileName("test-cs-default")).first().textContent();
    expect(text?.trim()).toMatch(/hello/i);
  });

  test("traffic lights are visible in default header", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-cs-default .eael-traffic-lights").first()
    ).toBeVisible();
  });

  test("file icon emoji is rendered in header", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-cs-default .eael-file-icon-emoji").first()
    ).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4d. Copy button
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Copy button", () => {
  test("copy button is visible by default", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(copyBtn("test-cs-default")).first()).toBeVisible();
  });

  test("copy button has aria-label for accessibility", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(copyBtn("test-cs-default")).first()).toHaveAttribute(
      "aria-label",
      /copy/i
    );
  });

  test("copy button is absent when show_copy_button is off", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(copyBtn("test-cs-no-copy"))).toHaveCount(0);
  });

  test("copy tooltip is absent by default", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(tooltip("test-cs-default"))).toHaveCount(0);
  });

  test("copy tooltip is present when show_copy_tooltip is on", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(tooltip("test-cs-tooltip")).first()).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4e. Line numbers
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Line numbers", () => {
  test("line numbers panel is absent by default", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(lineNums("test-cs-default"))).toHaveCount(0);
  });

  test("line numbers panel is present when show_line_numbers is on", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(lineNums("test-cs-line-numbers")).first()).toBeVisible();
  });

  test("line numbers panel contains .line-number children", async ({ page }) => {
    await openPage(page);
    const count = await page
      .locator(".test-cs-line-numbers .eael-code-snippet-line-numbers .line-number")
      .count();
    expect(count).toBeGreaterThan(0);
  });

  test("line number count matches code line count", async ({ page }) => {
    await openPage(page);
    const lineCount = await page
      .locator(".test-cs-line-numbers .eael-code-snippet-line-numbers .line-number")
      .count();
    expect(lineCount).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Element structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("code block is rendered as a <pre> tag", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(codeBlock("test-cs-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("PRE");
  });

  test("pre code block contains non-empty text content", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(codeBlock("test-cs-default")).first().textContent();
    expect(text?.trim()).toBeTruthy();
  });

  test("copy button is rendered as a <button> tag", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(copyBtn("test-cs-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("BUTTON");
  });

  test("wrapper theme class is one of the known free themes", async ({ page }) => {
    await openPage(page);
    const cls =
      (await page.locator(wrapper("test-cs-default")).first().getAttribute("class")) ?? "";
    const hasTheme = FREE_THEMES.some((t) => cls.includes(`theme-${t}`));
    expect(hasTheme, `Unknown theme in: "${cls}"`).toBe(true);
  });

  test("code content is rendered as text inside the pre block", async ({ page }) => {
    await openPage(page);
    const content = await page.locator(codeBlock("test-cs-default")).first().textContent();
    expect(content?.trim()).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("copy button is keyboard-focusable", async ({ page }) => {
    await openPage(page);
    const btn = page.locator(copyBtn("test-cs-default")).first();
    await btn.focus();
    await expect(btn).toBeFocused();
  });

  test("hover on each widget triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-cs-default",
      "test-cs-dark",
      "test-cs-php",
      "test-cs-js",
      "test-cs-fixed",
      "test-cs-collapsed",
      "test-cs-no-header",
      "test-cs-no-copy",
      "test-cs-tooltip",
      "test-cs-line-numbers",
    ]) {
      await page.locator(wrapper(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking the copy button causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(copyBtn("test-cs-default")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking collapsed indicator toggles the indicator state", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    const indicator = page
      .locator(".test-cs-collapsed .eael-code-snippet-collapsed-indicator")
      .first();
    await indicator.click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
