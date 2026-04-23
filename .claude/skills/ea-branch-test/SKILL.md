---
name: ea-branch-test
description: Review a Git branch for EA widget changes, build a targeted Elementor test page that exercises the affected feature, and produce a manual verification checklist. Invoke as /ea-branch-test <branch-name> [issue summary]. Does NOT write Playwright specs — the output is a seeded WP page and a what-to-check list.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash(git *)
  - Bash(find *)
  - Bash(grep *)
  - Bash(mkdir *)
  - Bash(docker compose *)
  - Bash(python3 *)
---

# /ea-branch-test — Branch Review & Test Page Generator

Inspects a Git branch to understand what EA widget code changed, seeds a targeted
Elementor test page that reproduces or exercises the affected feature, and prints
a manual verification checklist. **No Playwright spec is written.**

**Arguments:** `$ARGUMENTS` — `<branch-name>` and an optional one-line description
of the issue/feature. Examples:
- `fix/progress-bar-colors`
- `feature/flip-box-animation "flip direction not applied on mobile"`

---

## Fixed paths — never ask the user for these

| Name | Path |
|---|---|
| Free plugin root | `/Users/md.nahidhasan/ea-plugins/essential-addons-for-elementor-lite` |
| Pro plugin root | `/Users/md.nahidhasan/ea-plugins/essential-addons-elementor` |
| Free Elements dir | `{FREE_ROOT}/includes/Elements/` |
| Automation repo | `/Users/md.nahidhasan/ea-e2e-automation` |
| Scripts dir | `/Users/md.nahidhasan/ea-e2e-automation/scripts/` |
| docker-compose | `/Users/md.nahidhasan/ea-e2e-automation/docker-compose.yml` |
| .env | `/Users/md.nahidhasan/ea-e2e-automation/.env` |
| .env.example | `/Users/md.nahidhasan/ea-e2e-automation/.env.example` |
| setup-test-pages.sh | `/Users/md.nahidhasan/ea-e2e-automation/scripts/setup-test-pages.sh` |

---

## Step 1 — Parse arguments

Split `$ARGUMENTS` on the first space (or first quoted segment boundary):

```
BRANCH  = first token            e.g. fix/progress-bar-colors
SUMMARY = remainder (optional)   e.g. "flip direction not applied on mobile"
```

If no branch is given, tell the user and stop.

---

## Step 2 — Understand what changed on the branch

Run the following commands **in the plugin repos** (not the automation repo):

```bash
# Show the list of changed files between the branch and its merge-base with main/master
git -C /Users/md.nahidhasan/ea-plugins/essential-addons-for-elementor-lite \
  diff --name-only origin/main...origin/{BRANCH} 2>/dev/null \
  || git -C /Users/md.nahidhasan/ea-plugins/essential-addons-for-elementor-lite \
       diff --name-only main...{BRANCH} 2>/dev/null

git -C /Users/md.nahidhasan/ea-plugins/essential-addons-elementor \
  diff --name-only origin/main...origin/{BRANCH} 2>/dev/null \
  || git -C /Users/md.nahidhasan/ea-plugins/essential-addons-elementor \
       diff --name-only main...{BRANCH} 2>/dev/null
```

If neither repo has the branch, fall back to local:

```bash
git -C /Users/md.nahidhasan/ea-plugins/essential-addons-for-elementor-lite \
  diff --name-only HEAD 2>/dev/null
```

Also show the commit log for context:

```bash
git -C /Users/md.nahidhasan/ea-plugins/essential-addons-for-elementor-lite \
  log --oneline origin/main..origin/{BRANCH} 2>/dev/null | head -20
```

From the changed file list, identify:
- Which widget PHP files changed (under `includes/Elements/`)
- Which asset/CSS/JS files changed (note them for the checklist)
- Whether changes are in free or pro plugin (or both)

If no widget PHP files changed (only CSS/JS/config), derive the widget slug from
the CSS/JS filename and proceed with a minimal layout test.

---

## Step 3 — Read the diff for the changed widget file(s)

For each changed widget PHP file found:

```bash
git -C /Users/md.nahidhasan/ea-plugins/essential-addons-for-elementor-lite \
  diff origin/main...origin/{BRANCH} -- {RELATIVE_FILE_PATH} 2>/dev/null
```

Read this diff carefully. Identify:

| What changed | How it affects the test page |
|---|---|
| New/modified `add_control()` | Add a widget variant that exercises that control's new value |
| Changed `render()` DOM output | Capture the new selectors/classes in the checklist |
| New style/preset option added | Add one widget per new option |
| Bug fix in a conditional block | Add at least two variants — one that triggered the bug, one that didn't |
| CSS/JS only change | Add a single default widget and note the visual check |

---

## Step 4 — Derive all names from the widget slug

From the changed file path, extract the widget slug:

| Derived name | Rule | Example |
|---|---|---|
| `SLUG` | kebab-case filename without .php | `progress-bar` |
| `PAGE_TITLE` | Title Case, hyphens → spaces | `Progress Bar` |
| `PHP_CLASS` | Title Case, hyphens → underscores | `Progress_Bar` |
| `WIDGET_TYPE` | from `get_name()` in PHP file | `eael-progress-bar` |
| `HOOK_PREFIX` | `test-` + initials of each word | `test-pb` |
| `ENV_VAR` | upper-snake-case + `_PAGE_SLUG` | `PROGRESS_BAR_PAGE_SLUG` |
| `SETUP_FILE` | `scripts/setup-{SLUG}-branch-test.php` | `scripts/setup-progress-bar-branch-test.php` |
| `PAGE_SLUG` | `{SLUG}-branch-test` | `progress-bar-branch-test` |

Always read the free PHP file to confirm the exact `WIDGET_TYPE` from `get_name()`.

---

## Step 5 — Design targeted test configurations

Based on the diff analysis from Step 3, produce a focused set of widget
configurations. Think like a QA engineer reviewing the fix:

**Always include:**
- `{HOOK_PREFIX}-default` — baseline, all defaults, confirms nothing is broken
- One variant per changed control option / preset / style that was modified

**For bug fixes — add the reproduced scenario:**
- `{HOOK_PREFIX}-bug-repro` — the exact settings that previously triggered the bug
  (use the diff to reconstruct the state)
- `{HOOK_PREFIX}-fixed-state` — the settings that should now work correctly

**For new features — add coverage of the new options:**
- One widget per new choice/value added to a SELECT control
- One widget showing the new SWITCHER on, one with it off

**Do NOT add variants that are unrelated to the branch changes.** Keep the page
focused so manual review is fast.

---

## Step 6 — Write the PHP setup script

Create `scripts/setup-{SLUG}-branch-test.php`.

Use this exact helpers block (guarded with `function_exists` so multiple scripts
can run in the same WP-CLI process without fatal errors):

```php
<?php
/**
 * Branch test page: {PAGE_TITLE} — {BRANCH}
 * Issue: {SUMMARY}
 * Run via: wp eval-file /scripts/setup-{SLUG}-branch-test.php
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

After the helpers, write the page section:

```php
// ── {PAGE_TITLE} branch test ({BRANCH}) ────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- {PAGE_TITLE} Branch Test ({BRANCH}) ---' );

$slug    = getenv( '{ENV_VAR}' ) ?: '{PAGE_SLUG}';
$page_id = ea_upsert_page( $slug, '{PAGE_TITLE} (Branch Test)' );

$widgets = [

    ea_heading( 'Branch: {BRANCH}', 'h2' ),
    ea_heading( 'Issue: {SUMMARY}', 'h3' ),

    // ══════════════════════════════════════════════════════════════════════
    // Baseline
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Baseline ──', 'h2' ),

    ea_heading( 'Default {PAGE_TITLE}' ),
    ea_widget( '{HOOK_PREFIX}-default', '{WIDGET_TYPE}',
        [
            // minimal settings — rely on widget defaults
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Changed / Fixed Scenarios
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Changed / Fixed Scenarios ──', 'h2' ),

    // ... one ea_heading() + ea_widget() pair per scenario derived from the diff ...

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

WP_CLI::success( '{PAGE_TITLE} branch test page ready → /{PAGE_SLUG}/' );
```

### Widget settings rules (same as ea-widget-tests)
- Only include settings that **differ from the control's default**.
- For repeater controls, use 2-3 items with distinct, verifiable text.
- For icon controls, use `[ 'value' => 'eicon-arrow-right', 'library' => 'eicons' ]`.
- For link controls, use `[ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ]` as the safe default.

---

## Step 7 — Update .env files

Append to both `.env.example` and `.env`:

```
{ENV_VAR}={PAGE_SLUG}
```

Only append if the line is not already present.

---

## Step 8 — Update setup-test-pages.sh

Open `scripts/setup-test-pages.sh` and append before the final `log "Test pages ready."` line:

```bash
command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-{SLUG}-branch-test.php
```

Only add this line if it is not already present.

---

## Step 9 — Seed the page

Run the setup script in the running Docker container:

```bash
docker compose -f /Users/md.nahidhasan/ea-e2e-automation/docker-compose.yml \
  run --rm wpcli \
  wp --path=/var/www/html --allow-root \
  eval-file /scripts/setup-{SLUG}-branch-test.php
```

Then refresh the Elementor revision:

```bash
docker compose -f /Users/md.nahidhasan/ea-e2e-automation/docker-compose.yml \
  run --rm wpcli \
  wp --path=/var/www/html --allow-root eval '
$page = get_page_by_path("{PAGE_SLUG}");
if ($page) {
    wp_save_post_revision($page->ID);
    delete_post_meta($page->ID, "_elementor_element_cache");
    echo "Revision refreshed for page " . $page->ID . "\n";
}
'
```

### Verify widget count

```bash
docker compose -f /Users/md.nahidhasan/ea-e2e-automation/docker-compose.yml \
  run --rm wpcli \
  wp --path=/var/www/html --allow-root \
  post meta get $(wp --path=/var/www/html --allow-root post list \
    --post_type=page --name={PAGE_SLUG} --field=ID --format=ids) \
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

## Step 10 — Print the manual verification checklist

After seeding succeeds, output the following block **as plain text in your response**
(do not write it to a file):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANUAL VERIFICATION CHECKLIST
Branch : {BRANCH}
Issue  : {SUMMARY}
Page   : http://localhost:8888/{PAGE_SLUG}/
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1 — Open the page
  □ Navigate to http://localhost:8888/{PAGE_SLUG}/
  □ No PHP fatal errors ("Fatal error" or "Parse error" text visible)
  □ No JavaScript errors in the browser console (F12 → Console)

STEP 2 — Baseline widget
  □ The "Default {PAGE_TITLE}" widget renders without errors
  □ DOM structure matches expected: .{WIDGET_TYPE} → [...derived from render()]
  □ No visual regressions compared to the main branch

STEP 3 — Bug / Feature scenarios  (one item per ea_widget() added in Step 6)
  [list each scenario with its CSS hook, what to look for, and what the
   expected result should be — derived directly from the diff analysis]

STEP 4 — Cross-check on main branch (optional but recommended)
  □ Switch the plugin to the main branch
  □ Reload http://localhost:8888/{PAGE_SLUG}/
  □ Confirm the bug is reproducible on main and absent on {BRANCH}

STEP 5 — Edge cases noted in the diff
  [list any edge cases spotted while reading the diff — e.g. null checks
   added, RTL handling, specific Elementor version conditions]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Files changed on this branch:
  [list each changed file path]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Fill in every `[...]` placeholder from your actual diff analysis. The checklist
must be specific to the branch — no generic placeholders left in the output.

---

## Output checklist (internal — do not show to user)

Before finishing, confirm:

- [ ] `scripts/setup-{SLUG}-branch-test.php` — complete, CSS regeneration at end
- [ ] `.env` and `.env.example` — `{ENV_VAR}={PAGE_SLUG}` appended
- [ ] `scripts/setup-test-pages.sh` — new eval-file line added (not duplicated)
- [ ] Docker seed ran without PHP fatal errors
- [ ] Widget count verified via python3 verify command
- [ ] Manual verification checklist printed in response (not saved to file)
