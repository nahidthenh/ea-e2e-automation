import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.LIGHTBOX_PAGE_SLUG ?? "lightbox"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Lightbox::render()):
//   .{hook}                                    ← elementor-widget wrapper
//     .eael-lightbox-wrapper                   ← trigger outer div
//       [data-trigger] [data-lightbox-type] [data-type] [data-src]
//       [data-popup-layout] [data-close_button] [data-esc_exit] [data-click_exit]
//       [data-effect] [data-trigger-element]
//       .eael-lightbox-btn
//         [trigger_type=button]  span.eael-modal-popup-button.eael-modal-popup-link
//         [trigger_type=text]    span.eael-trigger-text.eael-modal-popup-link
//         [trigger_type=icon]    span.eael-trigger-icon.eael-trigger-svg-icon.eael-modal-popup-link
//         [trigger_type=image]   img.eael-trigger-image.eael-modal-popup-link
//     .eael-lightbox-popup-window              ← hidden popup content (sibling of wrapper)
//       .eael-lightbox-container
//         [if title]  .eael-lightbox-header > .eael-lightbox-title
//         [if image]  img
//         [if content] .eael-lightbox-content
//         [if custom_html] raw HTML

const lbWrapper     = (hook: string) => `.${hook} .eael-lightbox-wrapper`;
const lbBtn         = (hook: string) => `.${hook} .eael-lightbox-btn`;
const popupBtn      = (hook: string) => `.${hook} .eael-modal-popup-button`;
const triggerText   = (hook: string) => `.${hook} .eael-trigger-text`;
const triggerIcon   = (hook: string) => `.${hook} .eael-trigger-icon`;
const triggerImage  = (hook: string) => `.${hook} .eael-trigger-image`;
const popupWindow   = (hook: string) => `.${hook} .eael-lightbox-popup-window`;
const popupContainer= (hook: string) => `.${hook} .eael-lightbox-container`;
const popupTitle    = (hook: string) => `.${hook} .eael-lightbox-title`;
const popupContent  = (hook: string) => `.${hook} .eael-lightbox-content`;

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
// 2. Default widget structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Default widget structure", () => {
  test("wrapper element is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(lbWrapper("test-lb-default")).first()).toBeAttached();
  });

  test("trigger button container is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(lbBtn("test-lb-default")).first()).toBeAttached();
  });

  test("button trigger span is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(popupBtn("test-lb-default")).first()).toBeAttached();
  });

  test("button trigger renders default text 'Open Popup'", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(popupBtn("test-lb-default")).first().textContent();
    expect(text?.trim()).toBe("Open Popup");
  });

  test("hidden popup window is in DOM", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(popupWindow("test-lb-default")).first()).toBeAttached();
  });

  test("popup container is in DOM", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(popupContainer("test-lb-default")).first()).toBeAttached();
  });

  test("button trigger has tabindex='0' (keyboard-focusable)", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(popupBtn("test-lb-default")).first()).toHaveAttribute("tabindex", "0");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Data attributes on the wrapper
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Wrapper data attributes", () => {
  test("default: data-trigger is 'eael_lightbox_trigger_button'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(lbWrapper("test-lb-default")).first()).toHaveAttribute(
      "data-trigger",
      "eael_lightbox_trigger_button"
    );
  });

  test("default: data-lightbox-type is 'lightbox_type_image'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(lbWrapper("test-lb-default")).first()).toHaveAttribute(
      "data-lightbox-type",
      "lightbox_type_image"
    );
  });

  test("default: data-type is 'inline' for image type", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(lbWrapper("test-lb-default")).first()).toHaveAttribute(
      "data-type",
      "inline"
    );
  });

  test("URL type: data-lightbox-type is 'lightbox_type_url'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(lbWrapper("test-lb-type-url")).first()).toHaveAttribute(
      "data-lightbox-type",
      "lightbox_type_url"
    );
  });

  test("URL type: data-type is 'iframe'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(lbWrapper("test-lb-type-url")).first()).toHaveAttribute(
      "data-type",
      "iframe"
    );
  });

  test("content type: data-lightbox-type is 'lightbox_type_content'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(lbWrapper("test-lb-type-content")).first()).toHaveAttribute(
      "data-lightbox-type",
      "lightbox_type_content"
    );
  });

  test("content type: data-type is 'inline'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(lbWrapper("test-lb-type-content")).first()).toHaveAttribute(
      "data-type",
      "inline"
    );
  });

  test("custom-html type: data-lightbox-type is 'lightbox_type_custom_html'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(lbWrapper("test-lb-type-custom-html")).first()).toHaveAttribute(
      "data-lightbox-type",
      "lightbox_type_custom_html"
    );
  });

  test("default: data-close_button is 'yes'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(lbWrapper("test-lb-default")).first()).toHaveAttribute(
      "data-close_button",
      "yes"
    );
  });

  test("no-close: data-close_button attribute is absent", async ({ page }) => {
    await openPage(page);
    const attr = await page.locator(lbWrapper("test-lb-no-close")).first().getAttribute("data-close_button");
    expect(attr).toBeNull();
  });

  test("default: data-esc_exit is 'yes'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(lbWrapper("test-lb-default")).first()).toHaveAttribute(
      "data-esc_exit",
      "yes"
    );
  });

  test("default: data-click_exit is 'yes'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(lbWrapper("test-lb-default")).first()).toHaveAttribute(
      "data-click_exit",
      "yes"
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Content types — popup window classes and DOM content
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Content types", () => {
  test("image type popup window has lightbox_type_image class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(popupWindow("test-lb-default")).first()).toHaveClass(
      /lightbox_type_image/
    );
  });

  test("content type popup window has lightbox_type_content class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(popupWindow("test-lb-type-content")).first()).toHaveClass(
      /lightbox_type_content/
    );
  });

  test("content type popup has .eael-lightbox-content element", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(popupContent("test-lb-type-content")).first()).toBeAttached();
  });

  test("custom-html type popup has rendered paragraph in container", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`${popupContainer("test-lb-type-custom-html")} p`).first()
    ).toBeAttached();
  });

  test("URL type popup window has lightbox_type_url class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(popupWindow("test-lb-type-url")).first()).toHaveClass(
      /lightbox_type_url/
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Trigger type variants
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Trigger type variants", () => {
  test("button trigger: span.eael-modal-popup-button is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(popupBtn("test-lb-default")).first()).toBeAttached();
  });

  test("button trigger: span has eael-modal-popup-link class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(popupBtn("test-lb-default")).first()).toHaveClass(
      /eael-modal-popup-link/
    );
  });

  test("text trigger: span.eael-trigger-text is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(triggerText("test-lb-trigger-text")).first()).toBeAttached();
  });

  test("text trigger: renders the configured text", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(triggerText("test-lb-trigger-text")).first().textContent();
    expect(text?.trim()).toBe("Click to Open");
  });

  test("text trigger: span has eael-modal-popup-link class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(triggerText("test-lb-trigger-text")).first()).toHaveClass(
      /eael-modal-popup-link/
    );
  });

  test("icon trigger: span.eael-trigger-icon is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(triggerIcon("test-lb-trigger-icon")).first()).toBeAttached();
  });

  test("icon trigger: span has eael-modal-popup-link class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(triggerIcon("test-lb-trigger-icon")).first()).toHaveClass(
      /eael-modal-popup-link/
    );
  });

  test("image trigger: img.eael-trigger-image is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(triggerImage("test-lb-trigger-image")).first()).toBeAttached();
  });

  test("image trigger: img has eael-modal-popup-link class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(triggerImage("test-lb-trigger-image")).first()).toHaveClass(
      /eael-modal-popup-link/
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Layout variants
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Layout variants", () => {
  test("standard layout: data-popup-layout is 'eael-lightbox-popup-standard'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(lbWrapper("test-lb-default")).first()).toHaveAttribute(
      "data-popup-layout",
      "eael-lightbox-popup-standard"
    );
  });

  test("fullscreen layout: data-popup-layout is 'eael-lightbox-popup-fullscreen'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(lbWrapper("test-lb-layout-fullscreen")).first()).toHaveAttribute(
      "data-popup-layout",
      "eael-lightbox-popup-fullscreen"
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Title, animation, and feature toggles
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Feature toggles", () => {
  test("title-on: .eael-lightbox-title is in DOM", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(popupTitle("test-lb-title-on")).first()).toBeAttached();
  });

  test("title-on: title text matches configured value", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(popupTitle("test-lb-title-on")).first().textContent();
    expect(text?.trim()).toBe("Popup Title Text");
  });

  test("title-on: .eael-lightbox-header wrapper is present", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.test-lb-title-on .eael-lightbox-header`).first()
    ).toBeAttached();
  });

  test("default: no title element present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(popupTitle("test-lb-default"))).toHaveCount(0);
  });

  test("animation-zoom: data-effect contains 'mfp-zoom-in'", async ({ page }) => {
    await openPage(page);
    const effect = await page.locator(lbWrapper("test-lb-animation-zoom")).first().getAttribute("data-effect");
    expect(effect).toContain("mfp-zoom-in");
  });

  test("default: data-effect contains 'animated'", async ({ page }) => {
    await openPage(page);
    const effect = await page.locator(lbWrapper("test-lb-default")).first().getAttribute("data-effect");
    expect(effect).toContain("animated");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Trigger alignment
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Trigger alignment", () => {
  test("center-aligned wrapper has justify-content: center", async ({ page }) => {
    await openPage(page);
    const jc = await page
      .locator(lbWrapper("test-lb-align-center"))
      .first()
      .evaluate((el) => getComputedStyle(el).justifyContent);
    expect(jc).toBe("center");
  });

  test("right-aligned wrapper has justify-content: flex-end", async ({ page }) => {
    await openPage(page);
    const jc = await page
      .locator(lbWrapper("test-lb-align-right"))
      .first()
      .evaluate((el) => getComputedStyle(el).justifyContent);
    expect(jc).toBe("flex-end");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. Interaction — open the popup
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("clicking button trigger opens MFP popup (.mfp-container visible)", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    const trigger = page.locator(popupBtn("test-lb-default")).first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    await page.locator(".mfp-container").waitFor({ state: "visible", timeout: 5000 });
    await expect(page.locator(".mfp-container")).toBeVisible();

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking text trigger opens MFP popup", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    const trigger = page.locator(triggerText("test-lb-trigger-text")).first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    await page.locator(".mfp-container").waitFor({ state: "visible", timeout: 5000 });
    await expect(page.locator(".mfp-container")).toBeVisible();

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("popup can be closed by clicking .mfp-close button", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    const trigger = page.locator(popupBtn("test-lb-default")).first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    await page.locator(".mfp-container").waitFor({ state: "visible", timeout: 5000 });

    const closeBtn = page.locator(".mfp-close").first();
    await closeBtn.click();

    await page.locator(".mfp-container").waitFor({ state: "detached", timeout: 5000 });
    await expect(page.locator(".mfp-container")).not.toBeVisible();

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover on trigger elements causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const selector of [
      `.test-lb-default .eael-modal-popup-button`,
      `.test-lb-trigger-text .eael-trigger-text`,
      `.test-lb-trigger-icon .eael-trigger-icon`,
      `.test-lb-trigger-image .eael-trigger-image`,
    ]) {
      const el = page.locator(selector).first();
      if (await el.count() > 0) {
        await el.hover({ force: true });
        await page.waitForTimeout(150);
      }
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Visual regression
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Visual regression", () => {
  const HOOKS = [
    "test-lb-default",
    "test-lb-type-content",
    "test-lb-type-url",
    "test-lb-type-custom-html",
    "test-lb-trigger-text",
    "test-lb-trigger-icon",
    "test-lb-trigger-image",
    "test-lb-layout-fullscreen",
    "test-lb-title-on",
    "test-lb-no-close",
    "test-lb-animation-zoom",
    "test-lb-align-center",
    "test-lb-align-right",
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
