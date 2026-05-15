/**
 * Covered: Essential Addons — Sticky Video widget (Free)
 *
 * 1. Page health          — HTTP 200, no PHP errors, no JS errors
 * 2. Video sources        — YouTube (data-plyr-provider="youtube"); Vimeo; self-hosted (<video>)
 * 3. Sticky behaviour     — sticky on: data-sticky="yes" + close button; sticky off: data-sticky="no"|absent
 * 4. Sticky position      — data-position attribute for top-left / top-right / bottom-left / bottom-right
 * 5. Overlay              — transparent: wrapper has eaelsv-overlay-visibility-transparent class
 * 6. Playback options     — autoplay: data-autoplay="yes"; loop: data-plyr-config contains loop active
 * 7. Element structure    — .eael-sticky-video-wrapper; .eael-sticky-video-player2; close button span
 * 8. Plyr JS init         — Plyr library attaches .plyr class to player container after init
 * 9. Interaction          — hover on each source variant triggers no JS errors
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.STICKY_VIDEO_PAGE_SLUG ?? "sticky-video"}/`;

// -- selectors -----------------------------------------------------------
// DOM shape (from Sticky_Video::render()):
//   .{hook}                                              ← elementor-widget wrapper
//     .eael-sticky-video-wrapper
//       .eaelsv-overlay-visibility-{|yes|transparent}   ← class on wrapper
//       [.eaelsv-overlay style="background-image:..."]  ← overlay=yes with image
//         .eaelsv-overlay-icon
//       .eael-sticky-video-player2
//         [data-sticky="yes|no"]
//         [data-position="bottom-right|top-left|..."]
//         [data-autoplay="yes|no"]
//         [data-overlay="yes|no"]
//         div#eaelsv-player-{id}                         ← YouTube/Vimeo (Plyr target)
//           [data-plyr-provider="youtube|vimeo"]
//           [data-plyr-embed-id="..."]
//           [data-plyr-config="..."]
//         video.eaelsv-player#eaelsv-player-{id}         ← self-hosted
//           source[src][type="video/mp4"]
//         span.eaelsv-sticky-player-close
//           i.fas.fa-times-circle

const wrapper    = (hook: string) => `.${hook} .eael-sticky-video-wrapper`;
const player2    = (hook: string) => `.${hook} .eael-sticky-video-player2`;
const closeBtn   = (hook: string) => `.${hook} .eaelsv-sticky-player-close`;
const plyrTarget = (hook: string) => `.${hook} [id^="eaelsv-player-"]`;
const selfHosted = (hook: string) => `.${hook} video.eaelsv-player`;
const plyrInited = (hook: string) => `.${hook} .plyr`;

// -- source hooks -------------------------------------------------------
const SOURCE_HOOKS: Record<string, string> = {
  "test-sv-default":           "youtube",
  "test-sv-source-vimeo":      "vimeo",
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

// ========================================================================
// 1. Page health
// ========================================================================

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

// ========================================================================
// 2. Video sources
// ========================================================================

test.describe("Video sources", () => {
  for (const [hook, provider] of Object.entries(SOURCE_HOOKS)) {
    test(`${provider}: wrapper is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(wrapper(hook)).first()).toBeVisible();
    });

    test(`${provider}: data-plyr-provider="${provider}" is set`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(plyrTarget(hook)).first()).toHaveAttribute(
        "data-plyr-provider",
        provider
      );
    });

    test(`${provider}: data-plyr-embed-id is non-empty`, async ({ page }) => {
      await openPage(page);
      const embedId = await page
        .locator(plyrTarget(hook))
        .first()
        .getAttribute("data-plyr-embed-id");
      expect(embedId).toBeTruthy();
    });
  }

  test("self-hosted: <video> element is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(selfHosted("test-sv-source-self-hosted")).first()).toBeAttached();
  });

  test("self-hosted: <source> has type video/mp4", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-sv-source-self-hosted video source").first()
    ).toHaveAttribute("type", "video/mp4");
  });

  test("self-hosted: <source> src is non-empty", async ({ page }) => {
    await openPage(page);
    const src = await page
      .locator(".test-sv-source-self-hosted video source")
      .first()
      .getAttribute("src");
    expect(src).toBeTruthy();
  });
});

// ========================================================================
// 3. Sticky behaviour
// ========================================================================

test.describe("Sticky behaviour", () => {
  test("sticky on: data-sticky='yes' on player container", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(player2("test-sv-default")).first()).toHaveAttribute(
      "data-sticky",
      "yes"
    );
  });

  test("sticky on: close button is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(closeBtn("test-sv-default")).first()).toBeAttached();
  });

  test("sticky off: data-sticky is not 'yes'", async ({ page }) => {
    await openPage(page);
    const val = await page
      .locator(player2("test-sv-sticky-off"))
      .first()
      .getAttribute("data-sticky");
    expect(val).not.toBe("yes");
  });
});

// ========================================================================
// 4. Sticky position
// ========================================================================

test.describe("Sticky position", () => {
  const POSITIONS: Record<string, string> = {
    "test-sv-default":        "bottom-right",
    "test-sv-pos-top-left":   "top-left",
    "test-sv-pos-top-right":  "top-right",
    "test-sv-pos-bottom-left": "bottom-left",
  };

  for (const [hook, position] of Object.entries(POSITIONS)) {
    test(`${position}: data-position="${position}"`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(player2(hook)).first()).toHaveAttribute(
        "data-position",
        position
      );
    });
  }
});

// ========================================================================
// 5. Overlay options
// ========================================================================

test.describe("Overlay options", () => {
  test("default: wrapper has eaelsv-overlay-visibility- class (empty value)", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrapper("test-sv-default")).first()).toHaveClass(
      /eaelsv-overlay-visibility-/
    );
  });

  test("transparent: wrapper has eaelsv-overlay-visibility-transparent class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrapper("test-sv-overlay-transparent")).first()).toHaveClass(
      /eaelsv-overlay-visibility-transparent/
    );
  });

  test("transparent: data-overlay is 'no' (no custom overlay image)", async ({ page }) => {
    await openPage(page);
    const val = await page
      .locator(player2("test-sv-overlay-transparent"))
      .first()
      .getAttribute("data-overlay");
    expect(val).toBe("no");
  });
});

// ========================================================================
// 6. Playback options
// ========================================================================

test.describe("Playback options", () => {
  test("autoplay on: data-autoplay='yes' on player container", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(player2("test-sv-autoplay")).first()).toHaveAttribute(
      "data-autoplay",
      "yes"
    );
  });

  test("autoplay off (default): data-autoplay='no'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(player2("test-sv-default")).first()).toHaveAttribute(
      "data-autoplay",
      "no"
    );
  });

  test("loop on: data-plyr-config contains 'loop'", async ({ page }) => {
    await openPage(page);
    const config = await page
      .locator(plyrTarget("test-sv-loop"))
      .first()
      .getAttribute("data-plyr-config");
    expect(config).toContain("loop");
  });
});

// ========================================================================
// 7. Element structure
// ========================================================================

test.describe("Element structure", () => {
  test("outer wrapper .eael-sticky-video-wrapper is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrapper("test-sv-default")).first()).toBeAttached();
  });

  test(".eael-sticky-video-player2 container is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(player2("test-sv-default")).first()).toBeAttached();
  });

  test("player2 has data-sheight attribute", async ({ page }) => {
    await openPage(page);
    const val = await page
      .locator(player2("test-sv-default"))
      .first()
      .getAttribute("data-sheight");
    expect(val).toBeTruthy();
  });

  test("player2 has data-swidth attribute", async ({ page }) => {
    await openPage(page);
    const val = await page
      .locator(player2("test-sv-default"))
      .first()
      .getAttribute("data-swidth");
    expect(val).toBeTruthy();
  });

  test("close button .eaelsv-sticky-player-close is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(closeBtn("test-sv-default")).first()).toBeAttached();
  });

  test("YouTube Plyr target div has id starting with eaelsv-player-", async ({ page }) => {
    await openPage(page);
    const id = await page
      .locator(plyrTarget("test-sv-default"))
      .first()
      .getAttribute("id");
    expect(id).toMatch(/^eaelsv-player-/);
  });
});

// ========================================================================
// 8. Plyr JS initialisation
// ========================================================================

test.describe("Plyr JS initialisation", () => {
  test("YouTube: Plyr attaches .plyr class to the player container", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(plyrInited("test-sv-default")).first()).toBeAttached({
      timeout: 10000,
    });
  });

  test("Vimeo: Plyr attaches .plyr class to the player container", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(plyrInited("test-sv-source-vimeo")).first()).toBeAttached({
      timeout: 10000,
    });
  });

  test("self-hosted: Plyr attaches .plyr class to the video element", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(plyrInited("test-sv-source-self-hosted")).first()).toBeAttached({
      timeout: 10000,
    });
  });
});

// ========================================================================
// 9. Interaction
// ========================================================================

test.describe("Interaction", () => {
  test("hover on each source variant triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    for (const hook of [...Object.keys(SOURCE_HOOKS), "test-sv-source-self-hosted"]) {
      await page.locator(wrapper(hook)).first().hover();
      await page.waitForTimeout(150);
    }
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover on sticky position variants triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    for (const hook of ["test-sv-pos-top-left", "test-sv-pos-top-right", "test-sv-pos-bottom-left"]) {
      await page.locator(wrapper(hook)).first().hover();
      await page.waitForTimeout(150);
    }
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
