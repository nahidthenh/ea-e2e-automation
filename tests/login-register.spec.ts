/**
 * Covered: Essential Addons — Login / Register widget
 *
 * 1. Page health          — HTTP 200, no PHP errors, no JS errors
 * 2. Outer wrapper        — .eael-login-registration-wrapper rendered with data-widget-id
 * 3. Login form           — form.eael-login-form present; visible when default_form_type=login
 * 4. Register form        — form.eael-register-form present; visible when default_form_type=register
 * 5. Lost password form   — form.eael-lostpassword-form present; visible when default_form_type=lostpassword
 * 6. Login form fields    — username, password inputs rendered
 * 7. Remember me toggle   — checkbox present when on; absent when off
 * 8. Lost password link   — link present when on; absent when off
 * 9. Submit buttons       — login / register / lostpassword submit buttons present
 * 10. Form switching      — clicking register toggle hides login, shows register (JS)
 * 11. Interaction         — typing in fields produces no JS errors
 */
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.LOGIN_REGISTER_PAGE_SLUG ?? "login-register"}/`;

// -- selectors ---------------------------------------------------------------
// DOM shape (from Login_Register::render()):
//   .{hook}
//     .eael-login-registration-wrapper[data-widget-id][data-page-id][data-is-ajax]
//       section#eael-login-form-wrapper[.eael-lr-d-none when hidden]
//         .eael-login-form-wrapper.eael-lr-form-wrapper
//           .lr-form-wrapper
//             form.eael-login-form.eael-lr-form#eael-login-form
//               .eael-lr-form-group.eael-user-login   (username input)
//               .eael-lr-form-group.eael-user-password (password + toggle)
//               .eael-forever-forget.eael-lr-form-group (remember me + lost pw link)
//               .eael-lr-footer
//                 button[name="eael-login-submit"].eael-lr-btn
//       section[.eael-lr-d-none when hidden] (register wrapper)
//         .eael-register-form-wrapper.eael-lr-form-wrapper
//           form.eael-register-form.eael-lr-form
//               .eael-lr-footer
//                 button[name="eael-register-submit"].eael-lr-btn
//       (lostpassword section)
//         form.eael-lostpassword-form.eael-lr-form#eael-lostpassword-form
//               button[name="eael-lostpassword-submit"].eael-lr-btn

const wrapper       = (hook: string) => `.${hook} .eael-login-registration-wrapper`;
const loginForm     = (hook: string) => `.${hook} form.eael-login-form`;
const registerForm  = (hook: string) => `.${hook} form.eael-register-form`;
const lostpwForm    = (hook: string) => `.${hook} form.eael-lostpassword-form`;
const loginSection  = (hook: string) => `.${hook} #eael-login-form-wrapper`;
const usernameInput = (hook: string) => `.${hook} .eael-user-login input`;
const passwordInput = (hook: string) => `.${hook} .eael-user-password input[type="password"]`;
const rememberMe    = (hook: string) => `.${hook} .eael-forever-forget input[type="checkbox"]`;
const lostpwLink    = (hook: string) => `.${hook} .eael-forever-forget a`;
const loginBtn      = (hook: string) => `.${hook} button[name="eael-login-submit"]`;
const registerBtn   = (hook: string) => `.${hook} button[name="eael-register-submit"]`;
const lostpwBtn     = (hook: string) => `.${hook} button[name="eael-lostpassword-submit"]`;
const regToggle     = (hook: string) => `.${hook} #eael-lr-reg-toggle`;

async function openPage(page: Page) {
  await page.context().clearCookies();
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

// ============================================================================
// 1. Page health
// ============================================================================

test.describe("Page health", () => {
  test("returns HTTP 200", async ({ page }) => {
    await page.context().clearCookies();
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

// ============================================================================
// 2. Outer wrapper
// ============================================================================

test.describe("Outer wrapper", () => {
  test("test-lr-default: .eael-login-registration-wrapper is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(wrapper("test-lr-default")).first()).toBeVisible();
  });

  test("test-lr-default: wrapper has data-widget-id attribute", async ({ page }) => {
    await openPage(page);
    const attr = await page.locator(wrapper("test-lr-default")).first().getAttribute("data-widget-id");
    expect(attr).toBeTruthy();
  });

  test("test-lr-default: wrapper has data-page-id attribute", async ({ page }) => {
    await openPage(page);
    const attr = await page.locator(wrapper("test-lr-default")).first().getAttribute("data-page-id");
    expect(attr).toBeTruthy();
  });
});

// ============================================================================
// 3. Login form
// ============================================================================

test.describe("Login form", () => {
  test("test-lr-default: form.eael-login-form is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(loginForm("test-lr-default")).first()).toBeAttached();
  });

  test("test-lr-default: login section is visible (not hidden)", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(loginSection("test-lr-default")).first().getAttribute("class");
    expect(cls ?? "").not.toContain("eael-lr-d-none");
  });

  test("test-lr-register: login section is hidden when register is default", async ({ page }) => {
    await openPage(page);
    const cls = await page.locator(loginSection("test-lr-register")).first().getAttribute("class");
    expect(cls ?? "").toContain("eael-lr-d-none");
  });
});

// ============================================================================
// 4. Register form
// ============================================================================

test.describe("Register form", () => {
  test("test-lr-default: form.eael-register-form is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(registerForm("test-lr-default")).first()).toBeAttached();
  });

  test("test-lr-register: register form wrapper is visible (not hidden)", async ({ page }) => {
    await openPage(page);
    const registerSection = page.locator(".test-lr-register .eael-register-form-wrapper").first();
    await expect(registerSection).toBeAttached();
    const cls = await registerSection.getAttribute("class");
    expect(cls ?? "").not.toContain("eael-lr-d-none");
  });
});

// ============================================================================
// 5. Lost password form
// ============================================================================

test.describe("Lost password form", () => {
  test("test-lr-lostpw: form.eael-lostpassword-form is rendered", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(lostpwForm("test-lr-lostpw")).first()).toBeAttached();
  });

  test("test-lr-default: lostpassword form is also rendered (show_lost_password=yes)", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(lostpwForm("test-lr-default")).first()).toBeAttached();
  });
});

// ============================================================================
// 6. Login form fields
// ============================================================================

test.describe("Login form fields", () => {
  test("test-lr-default: username input is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(usernameInput("test-lr-default")).first()).toBeVisible();
  });

  test("test-lr-default: password input is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(passwordInput("test-lr-default")).first()).toBeVisible();
  });

  test("test-lr-default: username input accepts text", async ({ page }) => {
    await openPage(page);
    const input = page.locator(usernameInput("test-lr-default")).first();
    await input.fill("testuser");
    await expect(input).toHaveValue("testuser");
  });
});

// ============================================================================
// 7. Remember me toggle
// ============================================================================

test.describe("Remember me toggle", () => {
  test("test-lr-default: remember me checkbox is present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(rememberMe("test-lr-default")).first()).toBeVisible();
  });

  test("test-lr-no-remember: remember me checkbox is absent", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(rememberMe("test-lr-no-remember"))).toHaveCount(0);
  });
});

// ============================================================================
// 8. Lost password link
// ============================================================================

test.describe("Lost password link", () => {
  test("test-lr-default: lost password link is visible in login form", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(lostpwLink("test-lr-default")).first()).toBeVisible();
  });

  test("test-lr-no-lostpw: lost password link is absent", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(lostpwLink("test-lr-no-lostpw"))).toHaveCount(0);
  });
});

// ============================================================================
// 9. Submit buttons
// ============================================================================

test.describe("Submit buttons", () => {
  test("test-lr-default: login submit button is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(loginBtn("test-lr-default")).first()).toBeVisible();
  });

  test("test-lr-register: register submit button is attached", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(registerBtn("test-lr-register")).first()).toBeAttached();
  });

  test("test-lr-lostpw: lost password submit button is attached", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(lostpwBtn("test-lr-lostpw")).first()).toBeAttached();
  });
});

// ============================================================================
// 10. Form switching (JS interaction)
// ============================================================================

test.describe("Form switching", () => {
  test("clicking register toggle hides login section and shows register section", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    const toggle = page.locator(regToggle("test-lr-default")).first();
    await expect(toggle).toBeVisible();
    await toggle.click();

    // jQuery .hide() sets display:none; the login wrapper should no longer be visible
    await expect(page.locator(loginSection("test-lr-default")).first()).toBeHidden();

    // Register form wrapper should be attached and eventually visible after fadeIn
    const regSection = page.locator(".test-lr-default .eael-register-form-wrapper").first();
    await expect(regSection).toBeAttached();

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});

// ============================================================================
// 11. Interaction
// ============================================================================

test.describe("Interaction", () => {
  test("typing in login fields produces no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    await page.locator(usernameInput("test-lr-default")).first().fill("testuser@example.com");
    await page.locator(passwordInput("test-lr-default")).first().fill("password123");

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });

  test("hover over login form produces no JS errors", async ({ page }) => {
    const errs = watchErrors(page);
    await openPage(page);

    await page.locator(loginForm("test-lr-default")).first().hover();

    expect(errs, errs.join(" | ")).toHaveLength(0);
  });
});
