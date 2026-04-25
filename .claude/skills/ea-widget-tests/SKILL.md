---
name: ea-widget-tests
description: Generate a WordPress Elementor test page and Playwright spec for any Essential Addons (EA) widget. Invoke as /ea-widget-tests <widget-slug>, e.g. /ea-widget-tests advanced-accordion. Reads free and pro EA codebases, writes setup PHP + Playwright spec, and seeds the page into the running WordPress container.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash(find *)
  - Bash(grep *)
  - Bash(mkdir *)
  - Bash(docker compose *)
  - Bash(python3 *)
---

# /ea-widget-tests — EA Widget Test Generator

Generates a complete test harness for any Essential Addons Elementor widget:
a WP-CLI page-setup PHP script and a Playwright spec file.

**Arguments:** `$ARGUMENTS` — the widget slug in kebab-case, e.g. `advanced-accordion`, `progress-bar`, `flip-box`

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
| .env | `/Users/md.nahidhasan/ea-e2e-automation/.env` |
| .env.example | `/Users/md.nahidhasan/ea-e2e-automation/.env.example` |
| setup-test-pages.sh | `/Users/md.nahidhasan/ea-e2e-automation/scripts/setup-test-pages.sh` |

---

## Step 1 — Derive all names from the slug

Given the slug from `$ARGUMENTS` (e.g. `advanced-accordion`):

| Derived name | Rule | Example |
|---|---|---|
| `SLUG` | as-is | `advanced-accordion` |
| `PAGE_TITLE` | Title Case, hyphens → spaces | `Advanced Accordion` |
| `PHP_CLASS` | Title Case, hyphens → underscores | `Advanced_Accordion` |
| `WIDGET_TYPE` | prefix `eael-` (verify in Step 3) | `eael-advanced-accordion` |
| `HOOK_PREFIX` | `test-` + initials of each word | `test-aa` |
| `ENV_VAR` | upper-snake-case + `_PAGE_SLUG` | `ADVANCED_ACCORDION_PAGE_SLUG` |
| `SETUP_FILE` | `scripts/setup-{SLUG}-page.php` | `scripts/setup-advanced-accordion-page.php` |
| `SPEC_FILE` | `tests/{SLUG}.spec.ts` | `tests/advanced-accordion.spec.ts` |

---

## Step 2 — Find the free widget PHP file

```bash
find /Users/md.nahidhasan/ea-plugins/essential-addons-for-elementor-lite/includes/Elements \
  -name "*.php" | xargs grep -l "{PHP_CLASS}\|{SLUG}" 2>/dev/null
```

If multiple hits, prefer the file whose name most closely matches `{PHP_CLASS}.php`.
**Read the entire file.** If nothing is found, tell the user and stop.

---

## Step 3 — Extract the canonical widget type name

In the free PHP file, find the `get_name()` method:

```php
public function get_name() {
    return 'eael-advanced-accordion';
}
```

Use this exact return value as `WIDGET_TYPE` for all Elementor data.

---

## Step 4 — Find pro extensions

```bash
grep -n "{SLUG}\|{PHP_CLASS}\|{WIDGET_TYPE}" \
  /Users/md.nahidhasan/ea-plugins/essential-addons-elementor/includes/Traits/Extender.php \
  | head -80
```

Also check:
```bash
find /Users/md.nahidhasan/ea-plugins/essential-addons-elementor/includes/Elements \
  -iname "*{SLUG}*" 2>/dev/null
```

Read any pro files found. Note what is gated by `apply_filters('eael/pro_enabled', false)`.

---

## Step 5 — Build the controls inventory

Read through both free and pro PHP. For each `add_control()` / `add_responsive_control()` / `add_group_control()` call, record:

```
control_id | TYPE | options/choices | free or pro
```

Classify controls into groups:
- **Layout / style presets** — `SELECT` or `CHOOSE` controls that change the widget's visual style (these become separate widget instances)
- **Content toggles** — `SWITCHER` controls (icon on/off, title on/off, etc.)
- **Link/URL settings** — target, nofollow, custom URL
- **Alignment** — wrapper justify-content, text alignment
- **Repeater items** — for widgets with multiple child items (accordion items, tabs, etc.)

---

## Step 6 — Read the render() method

In the free PHP file find `render()` or `render_content()`. Map the DOM:

```
.elementor-widget-{WIDGET_TYPE}         ← Elementor outer wrapper ({{WRAPPER}})
  .eael-{widget-slug}-wrapper           ← EA wrapper (typical pattern)
    .eael-{widget-slug}-item            ← per-item node (if repeater)
      ...
```

Record the exact class names used — tests will select on these.
Also record any `data-*` attributes set on elements.

---

## Step 7 — Design test configurations

Produce a list of configurations that cover all important widget features.
Always include at minimum:

| Hook | What it tests |
|---|---|
| `{HOOK_PREFIX}-default` | All defaults — baseline smoke test |
| `{HOOK_PREFIX}-{style}` | One instance per major style/preset option (free) |
| `{HOOK_PREFIX}-pro-{style}` | One instance per major pro style/preset (if pro exists) |
| `{HOOK_PREFIX}-icon-on` / `-icon-off` | SWITCHER for icon (if widget has icons) |
| `{HOOK_PREFIX}-link-external` | External link (target=_blank) |
| `{HOOK_PREFIX}-link-nofollow` | Nofollow link |
| `{HOOK_PREFIX}-align-{value}` | Alignment variants |

For repeater widgets (accordion, tabs, etc.) use items with distinct, verifiable text values.

---

## Step 8 — Write the PHP setup script

Create `scripts/setup-{SLUG}-page.php`.

Use this exact template for the helpers block (guarded with `function_exists` so
multiple setup scripts can run in the same WP-CLI process without fatal errors):

```php
<?php
/**
 * Test page: {PAGE_TITLE}
 * Run via: wp eval-file /scripts/setup-{SLUG}-page.php
 */

if ( ! function_exists( 'ea_make_id' ) ) {
    function ea_make_id(): string {
        return substr( md5( uniqid( '', true ) ), 0, 8 );
    }
}
if ( ! function_exists( 'ea_upsert_page' ) ) {
    function ea_upsert_page( string $slug, string $title ): int {
        $existing = get_page_by_path( $slug, OBJECT, 'page' );
        if ( $existing ) {
            WP_CLI::log( "  exists : {$title} (ID {$existing->ID})" );
            return (int) $existing->ID;
        }
        $id = wp_insert_post( [
            'post_type' => 'page', 'post_status' => 'publish',
            'post_title' => $title, 'post_name' => $slug,
        ], true );
        if ( is_wp_error( $id ) ) WP_CLI::error( $id->get_error_message() );
        WP_CLI::log( "  created: {$title} (ID {$id})" );
        return (int) $id;
    }
}
if ( ! function_exists( 'ea_widget' ) ) {
    function ea_widget( string $css_class, string $widget_type, array $settings ): array {
        return [
            'id' => ea_make_id(), 'elType' => 'widget', 'widgetType' => $widget_type,
            'settings' => array_merge( [ '_css_classes' => $css_class ], $settings ),
            'elements' => [],
        ];
    }
}
if ( ! function_exists( 'ea_heading' ) ) {
    function ea_heading( string $title, string $tag = 'h4' ): array {
        return [
            'id' => ea_make_id(), 'elType' => 'widget', 'widgetType' => 'heading',
            'settings' => [ 'title' => $title, 'header_size' => $tag ],
            'elements' => [],
        ];
    }
}
if ( ! function_exists( 'ea_build_elementor_data' ) ) {
    function ea_build_elementor_data( array $widgets ): array {
        return [ [
            'id' => ea_make_id(), 'elType' => 'section', 'isInner' => false,
            'settings' => [], 'elements' => [ [
                'id' => ea_make_id(), 'elType' => 'column', 'isInner' => false,
                'settings' => [ '_column_size' => 100 ], 'elements' => $widgets,
            ] ],
        ] ];
    }
}
if ( ! function_exists( 'ea_save_elementor_data' ) ) {
    function ea_save_elementor_data( int $page_id, array $widgets ): void {
        $data = ea_build_elementor_data( $widgets );
        update_post_meta( $page_id, '_elementor_data', wp_json_encode( $data ) );
        update_post_meta( $page_id, '_elementor_edit_mode', 'builder' );
        update_post_meta( $page_id, '_elementor_version', '3.0.0' );
        delete_post_meta( $page_id, '_elementor_css' );
    }
}
```

After the helpers, write the widget section:

```php
// ── {PAGE_TITLE} page ──────────────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- {PAGE_TITLE} page ---' );

$slug    = getenv( '{ENV_VAR}' ) ?: '{SLUG}';
$page_id = ea_upsert_page( $slug, '{PAGE_TITLE}' );

$widgets = [

    // ══════════════════════════════════════════════════════════════════════
    // {Section name, e.g. "Styles / Presets"}
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── {Section name} ──', 'h2' ),

    ea_heading( 'Default {PAGE_TITLE}' ),
    ea_widget( '{HOOK_PREFIX}-default', '{WIDGET_TYPE}',
        [
            // ... minimum settings to render the widget, using defaults ...
        ]
    ),

    // ... one ea_heading() + ea_widget() pair per test configuration ...

];

ea_save_elementor_data( $page_id, $widgets );
WP_CLI::log( '  widgets : ' . count( $widgets ) . ' nodes written (includes headings)' );

if ( class_exists( '\Elementor\Core\Files\CSS\Post' ) ) {
    ( new \Elementor\Core\Files\CSS\Post( $page_id ) )->update_file();
    WP_CLI::log( '  CSS     : Elementor CSS regenerated for page ' . $page_id );
} elseif ( class_exists( '\Elementor\Plugin' ) && isset( \Elementor\Plugin::$instance->files_manager ) ) {
    \Elementor\Plugin::$instance->files_manager->clear_cache();
    WP_CLI::log( '  CSS     : cache cleared' );
}

WP_CLI::success( '{PAGE_TITLE} page ready → /{SLUG}/' );
```

### Widget settings rules
- Only include settings that **differ from the control's default** — Elementor's PHP renderer fills in the rest.
- For repeater controls, provide 2-3 items with distinct, verifiable text so tests can assert item content.
- For icon controls, use `[ 'value' => 'eicon-arrow-right', 'library' => 'eicons' ]` — eicons is always registered on the frontend; Font Awesome may not be loaded.
- For link controls, use `[ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ]` as the safe default.

### Heading label conventions
- h2 banner per section: `'── Free Styles ──'`, `'── Pro Styles ──'`, `'── Icon Variants ──'`, etc.
- h4 label per widget: describe the exact configuration, e.g.  
  `'Default {PAGE_TITLE}'`, `'Style: Classic'`, `'Pro Style: Minimal'`,  
  `'{PAGE_TITLE} | Icon: Left'`, `'{PAGE_TITLE} | External Link (target=_blank)'`

---

## Step 9 — Update .env files

Append to both `.env.example` and `.env`:

```
{ENV_VAR}={SLUG}
```

Only append if the line is not already present.

---

## Step 10 — Update setup-test-pages.sh

Open `scripts/setup-test-pages.sh` and append before the final `log "Test pages ready."` line:

```bash
command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-{SLUG}-page.php
```

---

## Step 11 — Seed the page

Run the setup script in the running Docker container:

```bash
docker compose -f /Users/md.nahidhasan/ea-e2e-automation/docker-compose.yml \
  run --rm wpcli \
  wp --path=/var/www/html --allow-root \
  eval-file /scripts/setup-{SLUG}-page.php
```

Then refresh the WordPress revision so the Elementor editor shows the new data:

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

The widget count must match the number of `ea_widget()` calls in the PHP file.

---

## Step 12 — Write the Playwright spec

Create `tests/{SLUG}.spec.ts`. Model the structure exactly on `tests/creative-button.spec.ts`:

```ts
import { test, expect, Page } from "@playwright/test";

const PAGE_URL = `/${process.env.{ENV_VAR} ?? "{SLUG}"}/`;

// ── selectors ─────────────────────────────────────────────────────────────
// DOM shape (from {PHP_CLASS}::render()):
//   .{hook}                    ← elementor-widget wrapper
//     .eael-{slug}-wrapper     ← (update with actual class names)
//       ...

const widget = (hook: string) => `.${hook} .{MAIN_WIDGET_SELECTOR}`;
// Add more selector helpers as needed based on the DOM structure found in Step 6

// ── known style/preset values ─────────────────────────────────────────────
const FREE_STYLES = [ /* values found in Step 5 */ ] as const;
const PRO_STYLES  = [ /* pro values found in Step 5 */ ] as const;

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
```

> **Every test must call `openPage(page)` first** — this ensures no test proceeds
> if a PHP fatal error is present on the page.

### Required test sections

**1. Page health**
```ts
test.describe("Page health", () => {
  test("returns HTTP 200", ...);
  test("no PHP fatal errors", ...);
  test("no JavaScript errors on load", ...);
});
```

**2. {Widget} styles (free)**  
Iterate over the free style map (hook → style-value). For each:
- button/element is visible
- correct CSS class or `data-*` attribute is applied
- primary text/content renders

**3. {Widget} styles (pro)** *(omit section if no pro styles)*  
Same pattern as section 2, using the pro style map.

**4. Per-feature describes** — one `test.describe` per feature group found:
- Icon configuration (left/right, present/absent)
- Link behaviour (external, nofollow, href value)
- Alignment (justify-content computed style)
- Any widget-specific feature (e.g. accordion expand/collapse, tab switching)

**5. Element structure**
- Rendered as the correct HTML tag
- Selector helper targets the right element

**6. Interaction**
- Widget is keyboard-focusable (if interactive)
- Hover on each instance triggers no JS errors
- Click on default instance causes no JS errors

### Coding conventions (follow exactly)
- `for...of Object.entries(styleMap)` — no `forEach`
- Test name includes the value: `` `${styleClass} is visible` ``
- No `await page.waitForTimeout()` except inside the hover loop (keep at 150 ms)
- `getComputedStyle(el).{property}` for CSS assertions
- `toBeAttached()` for structural assertions where visibility is not guaranteed

---

## Step 13 — Update COVERAGE.md

Open `/Users/md.nahidhasan/ea-e2e-automation/COVERAGE.md` if it exists.
If it does not exist, skip this step (COVERAGE.md is generated separately).

If it exists, find the row for `{SLUG}` and mark it as covered:

```markdown
| {SLUG} | ✅ |
```

If no row exists for `{SLUG}`, append one under the appropriate section.

---

## Output checklist

Before finishing, confirm:

- [ ] `scripts/setup-{SLUG}-page.php` — complete, all `ea_widget()` + `ea_heading()` calls present, CSS regeneration at end
- [ ] `tests/{SLUG}.spec.ts` — all 6 sections, no placeholder `TODO` strings
- [ ] `.env` and `.env.example` — `{ENV_VAR}={SLUG}` appended
- [ ] `scripts/setup-test-pages.sh` — new eval-file line added
- [ ] Docker setup ran without PHP fatal errors (warnings about Array-to-string from Elementor internals are acceptable)
- [ ] Verify command confirms `widgets=N headings=M` with correct N
- [ ] `openPage()` includes PHP fatal error check — every test calls it before any assertion
- [ ] `COVERAGE.md` updated if the file exists
