import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.COUNTDOWN_PAGE_SLUG ?? "countdown"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Countdown::render()):
//   .{hook}                                  ← elementor-widget wrapper
//     .eael-countdown-wrapper                (data-countdown-type, data-expire-type, data-evergreen-time)
//       .eael-countdown-container            (.eael-countdown-label-block | .eael-countdown-label-inline)
//         ul.eael-countdown-items            (data-date)
//           li.eael-countdown-item
//             div.eael-countdown-days
//               span[data-days].eael-countdown-digits   "00"
//               span.eael-countdown-label               "Days"
//           li.eael-countdown-item
//             div.eael-countdown-hours …
//           li.eael-countdown-item
//             div.eael-countdown-minutes …
//           li.eael-countdown-item
//             div.eael-countdown-seconds …

const cdWrapper   = (hook: string) => `.${hook} .eael-countdown-wrapper`;
const cdContainer = (hook: string) => `.${hook} .eael-countdown-container`;
const cdItems     = (hook: string) => `.${hook} .eael-countdown-items`;
const unitDiv     = (hook: string, unit: string) => `.${hook} .eael-countdown-${unit}`;
const digits      = (hook: string, unit: string) => `.${hook} .eael-countdown-${unit} .eael-countdown-digits`;
const label       = (hook: string, unit: string) => `.${hook} .eael-countdown-${unit} .eael-countdown-label`;

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
// 2. Default countdown — all four units visible with correct labels
// ══════════════════════════════════════════════════════════════════════════

test.describe("Default countdown", () => {
  const hook = "test-c-default";

  test("countdown wrapper is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(cdWrapper(hook)).first()).toBeVisible();
  });

  test("countdown items list is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(cdItems(hook)).first()).toBeAttached();
  });

  for (const unit of ["days", "hours", "minutes", "seconds"]) {
    test(`${unit} digit is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(digits(hook, unit)).first()).toBeVisible();
    });

    test(`${unit} label is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(label(hook, unit)).first()).toBeVisible();
    });
  }

  test("days label text is 'Days'", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(label(hook, "days")).first().textContent();
    expect(text?.trim()).toBe("Days");
  });

  test("hours label text is 'Hours'", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(label(hook, "hours")).first().textContent();
    expect(text?.trim()).toBe("Hours");
  });

  test("minutes label text is 'Minutes'", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(label(hook, "minutes")).first().textContent();
    expect(text?.trim()).toBe("Minutes");
  });

  test("seconds label text is 'Seconds'", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(label(hook, "seconds")).first().textContent();
    expect(text?.trim()).toBe("Seconds");
  });

  test("data-countdown-type is 'due_date'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(cdWrapper(hook)).first()).toHaveAttribute(
      "data-countdown-type",
      "due_date"
    );
  });

  test("data-expire-type is 'none'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(cdWrapper(hook)).first()).toHaveAttribute(
      "data-expire-type",
      "none"
    );
  });

  test("container has label-block class by default", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(cdContainer(hook)).first()).toHaveClass(
      /eael-countdown-label-block/
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 3. Timer type variants
// ══════════════════════════════════════════════════════════════════════════

test.describe("Timer type — evergreen", () => {
  const hook = "test-c-evergreen";

  test("data-countdown-type is 'evergreen'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(cdWrapper(hook)).first()).toHaveAttribute(
      "data-countdown-type",
      "evergreen"
    );
  });

  test("data-evergreen-time attribute is present and non-zero", async ({ page }) => {
    await openPage(page);
    const val = await page
      .locator(cdWrapper(hook))
      .first()
      .getAttribute("data-evergreen-time");
    expect(Number(val)).toBeGreaterThan(0);
  });

  test("countdown items list is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(cdItems(hook)).first()).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 4. Label position variants
// ══════════════════════════════════════════════════════════════════════════

test.describe("Label position — inline", () => {
  const hook = "test-c-label-inline";

  test("container has eael-countdown-label-inline class", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(cdContainer(hook)).first()).toHaveClass(
      /eael-countdown-label-inline/
    );
  });

  test("container does NOT have label-block class", async ({ page }) => {
    await openPage(page);
    const cls =
      (await page.locator(cdContainer(hook)).first().getAttribute("class")) ?? "";
    expect(cls).not.toContain("eael-countdown-label-block");
  });

  test("all four units are still rendered", async ({ page }) => {
    await openPage(page);
    for (const unit of ["days", "hours", "minutes", "seconds"]) {
      await expect(page.locator(digits(hook, unit)).first()).toBeAttached();
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 5. Layout variants
// ══════════════════════════════════════════════════════════════════════════

test.describe("Layout — list view", () => {
  const hook = "test-c-layout-list";

  test("countdown items list is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(cdItems(hook)).first()).toBeAttached();
  });

  test("list-view li items have display:grid applied", async ({ page }) => {
    await openPage(page);
    const display = await page
      .locator(`${cdItems(hook)} > li`)
      .first()
      .evaluate((el) => getComputedStyle(el).display);
    expect(display).toBe("grid");
  });
});

test.describe("Layout — grid view (default table-cell)", () => {
  const hook = "test-c-default";

  test("grid-view li items have display:table-cell applied", async ({ page }) => {
    await openPage(page);
    const display = await page
      .locator(`${cdItems(hook)} > li`)
      .first()
      .evaluate((el) => getComputedStyle(el).display);
    expect(display).toBe("table-cell");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 6. Unit visibility
// ══════════════════════════════════════════════════════════════════════════

test.describe("Unit visibility — no hours", () => {
  const hook = "test-c-no-hours";

  test(".eael-countdown-hours is not rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(unitDiv(hook, "hours"))).toHaveCount(0);
  });

  test("days, minutes, and seconds are still rendered", async ({ page }) => {
    await openPage(page);
    for (const unit of ["days", "minutes", "seconds"]) {
      await expect(page.locator(digits(hook, unit)).first()).toBeAttached();
    }
  });
});

test.describe("Unit visibility — no seconds", () => {
  const hook = "test-c-no-seconds";

  test(".eael-countdown-seconds is not rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(unitDiv(hook, "seconds"))).toHaveCount(0);
  });

  test("days, hours, and minutes are still rendered", async ({ page }) => {
    await openPage(page);
    for (const unit of ["days", "hours", "minutes"]) {
      await expect(page.locator(digits(hook, unit)).first()).toBeAttached();
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 7. Separator variants
// ══════════════════════════════════════════════════════════════════════════

test.describe("Separator", () => {
  const separatorMap: Record<string, string> = {
    "test-c-separator-solid":  "eael-countdown-separator-solid",
    "test-c-separator-dotted": "eael-countdown-separator-dotted",
  };

  for (const [hook, separatorClass] of Object.entries(separatorMap)) {
    test(`${separatorClass}: container has eael-countdown-show-separator class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(cdContainer(hook)).first()).toHaveClass(
        /eael-countdown-show-separator/
      );
    });

    test(`${separatorClass}: container has correct style class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(cdContainer(hook)).first()).toHaveClass(
        new RegExp(separatorClass)
      );
    });
  }

  test("default countdown has no separator class", async ({ page }) => {
    await openPage(page);
    const cls =
      (await page
        .locator(cdContainer("test-c-default"))
        .first()
        .getAttribute("class")) ?? "";
    expect(cls).not.toContain("eael-countdown-show-separator");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 8. Expire action
// ══════════════════════════════════════════════════════════════════════════

test.describe("Expire action — text message", () => {
  const hook = "test-c-expire-text";

  test("data-expire-type is 'text'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(cdWrapper(hook)).first()).toHaveAttribute(
      "data-expire-type",
      "text"
    );
  });

  test("data-expiry-title contains the configured title", async ({ page }) => {
    await openPage(page);
    const title = await page
      .locator(cdWrapper(hook))
      .first()
      .getAttribute("data-expiry-title");
    expect(title).toContain("Sale Ended!");
  });

  test("data-expiry-text contains the configured message", async ({ page }) => {
    await openPage(page);
    const text = await page
      .locator(cdWrapper(hook))
      .first()
      .getAttribute("data-expiry-text");
    expect(text).toContain("The promotion has expired");
  });

  test("countdown items are visible (timer not yet expired)", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(cdItems(hook)).first()).toBeVisible();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 9. Alignment variants
//    Selector: {{WRAPPER}} .eael-countdown-item > div → text-align: {VALUE}
// ══════════════════════════════════════════════════════════════════════════

test.describe("Alignment", () => {
  test("default (center) — days div has text-align: center", async ({ page }) => {
    await openPage(page);
    const align = await page
      .locator(unitDiv("test-c-default", "days"))
      .first()
      .evaluate((el) => getComputedStyle(el).textAlign);
    expect(align).toBe("center");
  });

  test("align-left — days div has text-align: left", async ({ page }) => {
    await openPage(page);
    const align = await page
      .locator(unitDiv("test-c-align-left", "days"))
      .first()
      .evaluate((el) => getComputedStyle(el).textAlign);
    expect(align).toBe("left");
  });

  test("align-right — days div has text-align: right", async ({ page }) => {
    await openPage(page);
    const align = await page
      .locator(unitDiv("test-c-align-right", "days"))
      .first()
      .evaluate((el) => getComputedStyle(el).textAlign);
    expect(align).toBe("right");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 10. Element structure
// ══════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  const hook = "test-c-default";

  test("digits span carries data-days attribute", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-countdown-days [data-days]`).first()
    ).toBeAttached();
  });

  test("digits span carries data-hours attribute", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-countdown-hours [data-hours]`).first()
    ).toBeAttached();
  });

  test("digits span carries data-minutes attribute", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-countdown-minutes [data-minutes]`).first()
    ).toBeAttached();
  });

  test("digits span carries data-seconds attribute", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(`.${hook} .eael-countdown-seconds [data-seconds]`).first()
    ).toBeAttached();
  });

  test("each unit is wrapped in a li.eael-countdown-item", async ({ page }) => {
    await openPage(page);
    const count = await page
      .locator(`.${hook} .eael-countdown-items > li.eael-countdown-item`)
      .count();
    expect(count).toBe(4);
  });

  test("countdown wrapper carries data-countdown-id attribute", async ({ page }) => {
    await openPage(page);
    const id = await page
      .locator(cdWrapper(hook))
      .first()
      .getAttribute("data-countdown-id");
    expect(id).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 11. Interaction
// ══════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover on each countdown instance triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-c-default",
      "test-c-evergreen",
      "test-c-label-inline",
      "test-c-layout-list",
      "test-c-no-hours",
      "test-c-no-seconds",
      "test-c-separator-solid",
      "test-c-separator-dotted",
      "test-c-expire-text",
      "test-c-align-left",
      "test-c-align-right",
    ]) {
      await page.locator(cdWrapper(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("clicking countdown wrapper causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(cdWrapper("test-c-default")).first().click();
    await page.waitForTimeout(300);
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});

  }
});
