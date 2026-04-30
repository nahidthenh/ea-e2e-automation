import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.TEAM_MEMBER_PAGE_SLUG ?? "team-member"}/`;

// ── selectors ─────────────────────────────────────────────────────────────────
// DOM shape (from Team_Member::render()):
//   .{hook} [.eael-team-align-{value}]          ← Elementor outer wrapper
//                                                  prefix_class adds alignment class here
//     #eael-team-member-{id}
//       .eael-team-item.{preset-class}[.team-avatar-rounded]
//         .eael-team-item-inner
//           .eael-team-image
//             figure > img
//             [p.eael-team-text.eael-team-text-overlay]  ← when text overlay enabled
//           .eael-team-content
//             {name_tag}.eael-team-member-name
//             {position_tag}.eael-team-member-position
//             [ul.eael-team-member-social-profiles
//               li.eael-team-member-social-link > a]
//             p.eael-team-text

const item     = (hook: string) => `.${hook} .eael-team-item`;
const name     = (hook: string) => `.${hook} .eael-team-member-name`;
const position = (hook: string) => `.${hook} .eael-team-member-position`;
const social   = (hook: string) => `.${hook} .eael-team-member-social-profiles`;
const desc     = (hook: string) => `.${hook} .eael-team-text`;
const img      = (hook: string) => `.${hook} .eael-team-image figure img`;

// ── free presets ──────────────────────────────────────────────────────────────
const FREE_PRESETS: Record<string, string> = {
  "test-tm-default": "eael-team-members-simple",
  "test-tm-overlay": "eael-team-members-overlay",
} as const;

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
// 2. Free presets — one instance per free preset skin
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Free presets", () => {
  for (const [hook, presetClass] of Object.entries(FREE_PRESETS)) {
    test(`${presetClass}: team item is visible`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(item(hook)).first()).toBeVisible();
    });

    test(`${presetClass}: .eael-team-item carries correct preset class`, async ({ page }) => {
      await openPage(page);
      await expect(page.locator(item(hook)).first()).toHaveClass(
        new RegExp(presetClass)
      );
    });

    test(`${presetClass}: member name is rendered`, async ({ page }) => {
      await openPage(page);
      const text = await page.locator(name(hook)).first().textContent();
      expect(text?.trim()).toBe("John Doe");
    });

    test(`${presetClass}: job position is rendered`, async ({ page }) => {
      await openPage(page);
      const text = await page.locator(position(hook)).first().textContent();
      expect(text?.trim()).toBe("Software Engineer");
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Social profiles
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Social profiles", () => {
  test("enabled: social profiles list is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(social("test-tm-default")).first()).toBeVisible();
  });

  test("enabled: at least one social link item is present", async ({ page }) => {
    await openPage(page);
    const count = await page
      .locator(`${social("test-tm-default")} li.eael-team-member-social-link`)
      .count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("enabled: each social link item contains an <a> tag", async ({ page }) => {
    await openPage(page);
    const links = page.locator(
      `${social("test-tm-default")} li.eael-team-member-social-link > a`
    );
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("disabled: social profiles list is not rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(social("test-tm-no-social"))).toHaveCount(0);
  });

  test("disabled: description text is still shown", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(desc("test-tm-no-social")).first()).toBeVisible();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Content features
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Text overlay on image", () => {
  test("text overlay: p.eael-team-text-overlay is rendered inside .eael-team-image", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-tm-text-overlay .eael-team-image p.eael-team-text-overlay").first()
    ).toBeAttached();
  });

  test("text overlay: overlay paragraph contains description text", async ({ page }) => {
    await openPage(page);
    const text = await page
      .locator(".test-tm-text-overlay .eael-team-image p.eael-team-text-overlay")
      .first()
      .textContent();
    expect(text?.trim()).toContain("overlay on the image");
  });
});

test.describe("Rounded avatar", () => {
  test("rounded: .eael-team-item carries class 'team-avatar-rounded'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(item("test-tm-rounded")).first()).toHaveClass(
      /team-avatar-rounded/
    );
  });

  test("rounded: image is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(img("test-tm-rounded")).first()).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Alignment
//    prefix_class 'eael-team-align-' is applied to the Elementor widget wrapper
//    alongside the hook's _css_classes.
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Alignment", () => {
  test("align-left: widget wrapper carries class 'eael-team-align-left'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(".test-tm-align-left").first()).toHaveClass(
      /eael-team-align-left/
    );
  });

  test("align-centered: widget wrapper carries class 'eael-team-align-centered'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(".test-tm-align-centered").first()).toHaveClass(
      /eael-team-align-centered/
    );
  });

  test("align-right: widget wrapper carries class 'eael-team-align-right'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(".test-tm-align-right").first()).toHaveClass(
      /eael-team-align-right/
    );
  });

  test("align-left: team item is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(item("test-tm-align-left")).first()).toBeVisible();
  });

  test("align-centered: team item is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(item("test-tm-align-centered")).first()).toBeVisible();
  });

  test("align-right: team item is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(item("test-tm-align-right")).first()).toBeVisible();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. HTML tag configuration
// ══════════════════════════════════════════════════════════════════════════════

test.describe("HTML tag configuration", () => {
  test("default: name is rendered as <h2>", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(name("test-tm-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H2");
  });

  test("default: position is rendered as <h3>", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(position("test-tm-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H3");
  });

  test("name-h3: name is rendered as <h3>", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(name("test-tm-name-h3"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H3");
  });

  test("name-h3: position is rendered as <h4>", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(position("test-tm-name-h3"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("H4");
  });

  test("name-h3: renders custom name text", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(name("test-tm-name-h3")).first().textContent();
    expect(text?.trim()).toBe("Alice Smith");
  });

  test("name-h3: renders custom position text", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(position("test-tm-name-h3")).first().textContent();
    expect(text?.trim()).toBe("Lead Designer");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Element structure
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("default: .eael-team-item is attached", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(item("test-tm-default")).first()).toBeAttached();
  });

  test("default: .eael-team-item-inner is rendered inside the team item", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-tm-default .eael-team-item-inner").first()
    ).toBeAttached();
  });

  test("default: .eael-team-image is rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-tm-default .eael-team-image").first()
    ).toBeAttached();
  });

  test("default: .eael-team-content is rendered", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-tm-default .eael-team-content").first()
    ).toBeAttached();
  });

  test("default: description paragraph .eael-team-text is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(desc("test-tm-default")).first()).toBeAttached();
  });

  test("default: team item carries the simple preset class", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(item("test-tm-default")).first().getAttribute("class") ?? "";
    expect(cls).toContain("eael-team-members-simple");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Interaction
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("hover on each widget instance triggers no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-tm-default",
      "test-tm-overlay",
      "test-tm-no-social",
      "test-tm-text-overlay",
      "test-tm-rounded",
      "test-tm-align-left",
      "test-tm-align-centered",
      "test-tm-align-right",
      "test-tm-name-h3",
    ]) {
      await page.locator(item(hook)).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("social link is focusable via keyboard", async ({ page }) => {
    await openPage(page);
    const link = page
      .locator(`${social("test-tm-default")} li.eael-team-member-social-link > a`)
      .first();
    await link.focus();
    await expect(link).toBeFocused();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Visual regression
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Visual regression", () => {
  const HOOKS = [
    "test-tm-default",
    "test-tm-overlay",
    "test-tm-no-social",
    "test-tm-text-overlay",
    "test-tm-rounded",
    "test-tm-align-left",
    "test-tm-align-centered",
    "test-tm-align-right",
    "test-tm-name-h3",
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
