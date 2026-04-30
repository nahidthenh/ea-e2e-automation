import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.PROTECTED_CONTENT_PAGE_SLUG ?? "protected-content"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from Protected_Content::render()):
//
// Role protection (unauthenticated visitor — content locked out):
//   .{hook}                                      ← elementor widget wrapper
//     .eael-protected-content                    ← EA outer div
//       .eael-protected-content-message          ← message wrapper
//         .eael-protected-content-message-text   ← rendered message text
//
// Password protection (unauthenticated visitor — form shown):
//   .{hook}
//     .eael-protected-content-message            ← message wrapper (sibling, no outer div)
//       .eael-protected-content-message-text
//     .eael-password-protected-content-fields    ← form container
//       form
//         input.eael-password                    ← password input (type=password)
//         input[type=hidden]                     ← nonce
//         input.eael-submit                      ← submit button (type=submit)

const outerWrap   = (hook: string) => `.${hook} .eael-protected-content`;
const msgWrap     = (hook: string) => `.${hook} .eael-protected-content-message`;
const msgText     = (hook: string) => `.${hook} .eael-protected-content-message-text`;
const formWrap    = (hook: string) => `.${hook} .eael-password-protected-content-fields`;
const pwdInput    = (hook: string) => `.${hook} .eael-password`;
const submitBtn   = (hook: string) => `.${hook} .eael-submit`;

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
// 2. Role-protected content — permission message
//    Unauthenticated visitors see the message, not the content.
// ══════════════════════════════════════════════════════════════════════════

test.describe("Role protection — permission message", () => {
  test("default: .eael-protected-content wrapper is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(outerWrap("test-pc-default")).first()).toBeAttached();
  });

  test("default: permission message wrapper is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(msgWrap("test-pc-default")).first()).toBeVisible();
  });

  test("default: message text renders correctly", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(msgText("test-pc-default")).first().textContent();
    expect(text?.trim()).toBe("You do not have permission to see this content.");
  });

  test("default: protected content body is not visible to unauthenticated visitor", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pc-default .protected-content")
    ).toHaveCount(0);
  });

  test("custom message: custom text is rendered", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(msgText("test-pc-message-custom")).first().textContent();
    expect(text?.trim()).toBe("Restricted to Members Only");
  });

  test("custom message: wrapper is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(msgWrap("test-pc-message-custom")).first()).toBeVisible();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 3. Message type: none
//    When message_type = 'none', the message wrapper is rendered but empty.
// ══════════════════════════════════════════════════════════════════════════

test.describe("Message type: none", () => {
  test("message wrapper is attached", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(msgWrap("test-pc-message-none")).first()).toBeAttached();
  });

  test("no message text node is rendered inside the wrapper", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pc-message-none .eael-protected-content-message-text")
    ).toHaveCount(0);
  });

  test("outer .eael-protected-content wrapper is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(outerWrap("test-pc-message-none")).first()).toBeAttached();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 4. Password protection — form display
//    Unauthenticated visitors see the message + the password form.
// ══════════════════════════════════════════════════════════════════════════

test.describe("Password protection — form display", () => {
  test("message is shown above the form", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(msgWrap("test-pc-password-form")).first()).toBeVisible();
  });

  test("message text is rendered", async ({ page }) => {
    await openPage(page);
    const text = await page.locator(msgText("test-pc-password-form")).first().textContent();
    expect(text?.trim()).toBe("Enter the password to access this content.");
  });

  test("password form container is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(formWrap("test-pc-password-form")).first()).toBeVisible();
  });

  test("password input field is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(pwdInput("test-pc-password-form")).first()).toBeVisible();
  });

  test("password input has default placeholder 'Enter Password'", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(pwdInput("test-pc-password-form")).first()).toHaveAttribute(
      "placeholder",
      "Enter Password"
    );
  });

  test("submit button is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(submitBtn("test-pc-password-form")).first()).toBeVisible();
  });

  test("submit button has default text 'Submit'", async ({ page }) => {
    await openPage(page);
    const val = await page
      .locator(submitBtn("test-pc-password-form"))
      .first()
      .getAttribute("value");
    expect(val?.trim()).toBe("Submit");
  });

  test("protected content is not visible before password entry", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pc-password-form .eael-protected-content")
    ).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 5. Password form inputs — custom placeholder and button text
// ══════════════════════════════════════════════════════════════════════════

test.describe("Password form inputs", () => {
  test("custom placeholder is applied to the password input", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(pwdInput("test-pc-password-placeholder")).first()).toHaveAttribute(
      "placeholder",
      "Type your secret key"
    );
  });

  test("custom button text is rendered on the submit button", async ({ page }) => {
    await openPage(page);
    const val = await page
      .locator(submitBtn("test-pc-password-btn"))
      .first()
      .getAttribute("value");
    expect(val?.trim()).toBe("Unlock");
  });

  test("password input is type=password", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(pwdInput("test-pc-password-form")).first()).toHaveAttribute(
      "type",
      "password"
    );
  });

  test("submit button is type=submit", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(submitBtn("test-pc-password-form")).first()).toHaveAttribute(
      "type",
      "submit"
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 6. Element structure
// ══════════════════════════════════════════════════════════════════════════

test.describe("Element structure", () => {
  test("role-protected: .eael-protected-content uses a div tag", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(outerWrap("test-pc-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("DIV");
  });

  test("password-protected: form element is present inside the form wrapper", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pc-password-form .eael-password-protected-content-fields form").first()
    ).toBeAttached();
  });

  test("password-protected: nonce hidden input is present", async ({ page }) => {
    await openPage(page);
    await expect(
      page.locator(".test-pc-password-form input[type='hidden']").first()
    ).toBeAttached();
  });

  test("role-protected: .eael-protected-content-message-text is a div", async ({ page }) => {
    await openPage(page);
    const tag = await page
      .locator(msgText("test-pc-default"))
      .first()
      .evaluate((el) => el.tagName);
    expect(tag).toBe("DIV");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 7. Interaction
// ══════════════════════════════════════════════════════════════════════════

test.describe("Interaction", () => {
  test("password input is keyboard-focusable", async ({ page }) => {
    await openPage(page);
    const input = page.locator(pwdInput("test-pc-password-form")).first();
    await input.focus();
    await expect(input).toBeFocused();
  });

  test("submit button is keyboard-focusable", async ({ page }) => {
    await openPage(page);
    const btn = page.locator(submitBtn("test-pc-password-form")).first();
    await btn.focus();
    await expect(btn).toBeFocused();
  });

  test("typing in the password input causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);
    await page.locator(pwdInput("test-pc-password-form")).first().fill("testpassword");
    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover over all widget instances causes no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    for (const hook of [
      "test-pc-default",
      "test-pc-message-none",
      "test-pc-message-custom",
      "test-pc-password-form",
      "test-pc-password-placeholder",
      "test-pc-password-btn",
    ]) {
      await page.locator(`.${hook}`).first().hover();
      await page.waitForTimeout(150);
    }

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("submitting an incorrect password renders the error message", async ({ page }) => {
    await openPage(page);
    await page.locator(pwdInput("test-pc-password-form")).first().fill("wrongpassword");
    await page.locator(submitBtn("test-pc-password-form")).first().click();
    await expect(
      page.locator(".test-pc-password-form .protected-content-error-msg").first()
    ).toBeVisible();
  });
});

  }
});
