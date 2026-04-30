---
name: ea-update-widget
description: Update an existing EA widget's seeded test page and Playwright spec when a new option/feature is added to the widget. Invoke as /ea-update-widget <widget-slug> "<what changed>", e.g. /ea-update-widget counter "new circular layout option added". Reads the widget PHP, diffs against the existing setup script, adds new widget instances + test cases, and re-seeds the page.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash(find *)
  - Bash(grep *)
  - Bash(docker compose *)
  - Bash(python3 *)
---

# /ea-update-widget — EA Widget Test Updater

Updates the seeded test page and Playwright spec for an **existing** EA widget when
a new option or feature is added. Does NOT create new files — only appends to existing ones.

**Arguments:** `$ARGUMENTS` — widget slug + description of what changed  
e.g. `counter "new circular layout option added in free"`  
e.g. `flip-box "pro glass-morphism style added"`

---

## Fixed paths — never ask the user for these

| Name | Path |
|---|---|
| Free plugin root | `/Users/md.nahidhasan/ea-plugins/essential-addons-for-elementor-lite` |
| Pro plugin root | `/Users/md.nahidhasan/ea-plugins/essential-addons-elementor` |
| Free Elements dir | `{FREE_ROOT}/includes/Elements/` |
| Pro Extender | `{PRO_ROOT}/includes/Traits/Extender.php` |
| Scripts dir | `/Users/md.nahidhasan/ea-e2e-automation/scripts/` |
| Tests dir | `/Users/md.nahidhasan/ea-e2e-automation/tests/` |
| docker-compose | `/Users/md.nahidhasan/ea-e2e-automation/docker-compose.yml` |

---

## Step 1 — Parse arguments

Split `$ARGUMENTS` into:
- `SLUG` — the widget slug (e.g. `counter`)
- `CHANGE_DESCRIPTION` — what changed (e.g. `"new circular layout option added in free"`)

Derive:
- `SETUP_FILE` → `scripts/setup-{SLUG}-page.php`
- `SPEC_FILE` → `tests/{SLUG}.spec.ts`
- `HOOK_PREFIX` → read from the existing `SETUP_FILE` (look for the first `ea_widget(` call and extract the CSS class prefix, e.g. `test-c`)
- `WIDGET_TYPE` → read from the existing `SETUP_FILE` (second argument of any `ea_widget(` call)

If either file does not exist, stop and tell the user to run `/ea-widget-tests {SLUG}` first.

---

## Step 2 — Read existing files

Read both files completely:
- `scripts/setup-{SLUG}-page.php`
- `tests/{SLUG}.spec.ts`

Note:
- What hook names are already used (e.g. `test-c-default`, `test-c-layout-2`)
- What style maps / const arrays are already defined in the spec
- What `test.describe` sections already exist

---

## Step 3 — Read the widget PHP

```bash
find /Users/md.nahidhasan/ea-plugins/essential-addons-for-elementor-lite/includes/Elements \
  -name "*.php" | xargs grep -l "{PHP_CLASS}\|{SLUG}" 2>/dev/null
```

Read the free PHP file. Also check pro:

```bash
grep -n "{SLUG}\|{WIDGET_TYPE}" \
  /Users/md.nahidhasan/ea-plugins/essential-addons-elementor/includes/Traits/Extender.php \
  | head -80
```

Focus on controls that match `CHANGE_DESCRIPTION`. Find the specific `add_control()` /
`add_responsive_control()` calls for the new option — note:
- `control_id`
- `TYPE` (SELECT, SWITCHER, CHOOSE, etc.)
- `options` / `choices` (all possible values)
- Whether it is free or pro-gated

---

## Step 4 — Design new test configurations

Based on the new control found in Step 3, decide what new widget instances are needed.

Rules:
- **SELECT / CHOOSE** with N options → one instance per option value (skip `default` if already covered)
- **SWITCHER** → one instance with it ON, one with it OFF (if not already covered)
- **Responsive / style controls** → one instance showing the effect
- Name new hooks by extending the existing prefix, e.g. `{HOOK_PREFIX}-circular`, `{HOOK_PREFIX}-pro-glass`

Do NOT duplicate hooks that already exist in `SETUP_FILE`.

---

## Step 5 — Update the PHP setup script

Open `scripts/setup-{SLUG}-page.php` and append new widget instances **before** the
`ea_save_elementor_data(` call.

Add a section heading first:

```php
    // ══════════════════════════════════════════════════════════════════════
    // {Section name describing the new feature}
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── {Section name} ──', 'h2' ),
```

Then one `ea_heading()` + `ea_widget()` pair per new configuration:

```php
    ea_heading( '{Description of this config}' ),
    ea_widget( '{HOOK_PREFIX}-{variant}', '{WIDGET_TYPE}',
        [
            '{control_id}' => '{value}',
        ]
    ),
```

Rules:
- Only include settings that **differ from the control's default**
- For icon controls use `[ 'value' => 'eicon-arrow-right', 'library' => 'eicons' ]`
- For link controls use `[ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ]`

---

## Step 6 — Update the Playwright spec

Open `tests/{SLUG}.spec.ts` and add new test coverage for the new option.

### If the new option is a style/preset (SELECT or CHOOSE):

Add the new values to the existing style map constant, or create a new one if the
existing map doesn't apply:

```ts
// If extending existing map:
const FREE_STYLES = { ...existing values..., "{new-hook}": "{new-value}" } as const;

// If it's a new separate group, add a new const:
const CIRCULAR_STYLES = { "{HOOK_PREFIX}-circular": "circular" } as const;
```

Then add a new `test.describe` block:

```ts
test.describe("{Feature name}", () => {
  test("{description}", async ({ page }) => {
    await openPage(page);
    // assertion for the new option
  });
});
```

### If the new option is a SWITCHER:

```ts
test.describe("{Feature} toggle", () => {
  test("enabled: {feature} is visible", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(".{HOOK_PREFIX}-{variant}-on .{selector}")).toBeVisible();
  });

  test("disabled: {feature} is not present", async ({ page }) => {
    await openPage(page);
    await expect(page.locator(".{HOOK_PREFIX}-{variant}-off .{selector}")).toHaveCount(0);
  });
});
```

### Coding conventions (same as ea-widget-tests)
- `for...of Object.entries(styleMap)` — no `forEach`
- Every test calls `openPage(page)` first
- No `await page.waitForTimeout()` except inside hover loops (150 ms)
- Use `toBeVisible()` for elements that should appear on screen; use `toBeAttached()` only for elements that may be off-screen or hidden by CSS

---

## Step 7 — Re-seed the page

Run the updated setup script in the running Docker container:

```bash
docker compose -f /Users/md.nahidhasan/ea-e2e-automation/docker-compose.yml \
  run --rm wpcli \
  wp --path=/var/www/html --allow-root \
  eval-file /scripts/setup-{SLUG}-page.php
```

Then refresh the Elementor revision:

```bash
docker compose -f /Users/md.nahidhasan/ea-e2e-automation/docker-compose.yml \
  run --rm wpcli \
  wp --path=/var/www/html --allow-root eval '
$page = get_page_by_path("{SLUG}");
if ($page) {
    wp_save_post_revision($page->ID);
    delete_post_meta($page->ID, "_elementor_element_cache");
    echo "Revision refreshed for page " . $page->ID . "\n";
}
'
```

### Verify

```bash
docker compose -f /Users/md.nahidhasan/ea-e2e-automation/docker-compose.yml \
  run --rm wpcli \
  wp --path=/var/www/html --allow-root \
  post meta get $(wp --path=/var/www/html --allow-root post list \
    --post_type=page --name={SLUG} --field=ID --format=ids) \
  _elementor_data \
| python3 -c "
import sys, json
data = json.load(sys.stdin)
w = h = 0
for s in data:
    for col in s.get('elements',[]):
        for n in col.get('elements',[]):
            if n.get('widgetType') == '{WIDGET_TYPE}': w += 1
            if n.get('widgetType') == 'heading': h += 1
print(f'widgets={w} headings={h}')
"
```

The widget count must match the total `ea_widget()` calls in the PHP file (old + new).

---

## Output checklist

Before finishing, confirm:

- [ ] `scripts/setup-{SLUG}-page.php` — new `ea_widget()` + `ea_heading()` calls appended, no existing instances removed or modified
- [ ] `tests/{SLUG}.spec.ts` — new `test.describe` block(s) added, every new test calls `openPage(page)` first
- [ ] No existing tests or widget instances were changed
- [ ] Docker re-seed ran without PHP fatal errors
- [ ] Verify command shows increased widget count matching the new total
