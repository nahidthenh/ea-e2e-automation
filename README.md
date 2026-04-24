# EA E2E Automation

End-to-end test suite for [Essential Addons for Elementor](https://essential-addons.com/) widgets, built with [Playwright](https://playwright.dev/) and TypeScript. Tests run against a local WordPress instance managed via Docker Compose.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Running Tests](#running-tests)
- [Teardown](#teardown)
- [CI/CD (GitHub Actions)](#cicd-github-actions)
- [Project Structure](#project-structure)
- [Adding New Widget Tests](#adding-new-widget-tests)
- [Slack Notifications](#slack-notifications)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Make sure the following tools are installed on your machine before you begin.

| Tool | Minimum Version | Check |
|------|-----------------|-------|
| [Node.js](https://nodejs.org/) | 20.x | `node -v` |
| [npm](https://www.npmjs.com/) | 10.x | `npm -v` |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Latest | `docker -v` |
| [Git](https://git-scm.com/) | Any | `git --version` |

> **macOS tip:** Docker Desktop must be running in the background before you start.

---

## Local Setup

Follow these steps exactly, in order.

### Step 1 — Clone the repository

```bash
git clone https://github.com/WPDeveloper/ea-e2e-automation.git
cd ea-e2e-automation
```

### Step 2 — Install Node dependencies

```bash
npm install
```

This also installs the required Playwright browser binaries automatically via a `postinstall` hook.

If Playwright browsers are not downloaded, run:

```bash
npx playwright install chromium
```

### Step 3 — Create your environment file

Copy the example env file and fill in your local values:

```bash
cp .env.example .env
```

Open `.env` in your editor. The most important variable to set is **`EA_PLUGINS_PATH`** — the absolute path to the directory on your machine that contains the EA plugin source code folders.

```dotenv
# Absolute path to the directory that holds ea-free and ea-pro plugin folders
EA_PLUGINS_PATH=/Users/your-username/path-to-ea-plugins
```

The directory pointed to by `EA_PLUGINS_PATH` should look like this:

```
ea-plugins/
├── essential-addons-for-elementor-lite/   # EA Free plugin
└── essential-addons-elementor-pro/        # EA Pro plugin
```

> You do **not** need to change any other value in `.env` for a basic local run. The defaults work out of the box.

### Step 4 — Start the WordPress environment

```bash
npm run setup
```

This single command will:

1. Start the MySQL and WordPress Docker containers
2. Wait until WordPress is fully reachable on `http://localhost:8888`
3. Install and activate the EA Free and Pro plugins via WP-CLI
4. Create an admin user and seed all Elementor test pages

The first run takes **3–5 minutes** because Docker pulls the base images. Subsequent runs start in under a minute.

When setup finishes you will see a message with the WordPress URL and admin credentials:

```
WordPress is ready at http://localhost:8888
Admin: admin / admin123
```

### Step 5 — Verify the environment

Open `http://localhost:8888` in your browser and confirm that the WordPress homepage loads. Log in to `http://localhost:8888/wp-admin/` with `admin` / `admin123` to make sure the admin panel works.

---

## Running Tests

All Playwright commands are run from the root of the repository.

### Run the full test suite (headless)

```bash
npm test
```

### Run tests with the browser visible

```bash
npm run test:headed
```

### Open Playwright UI mode (recommended for local development)

```bash
npm run test:ui
```

UI mode lets you filter, run individual tests, see traces, and watch tests execute step-by-step in a live browser.

### Run a single spec file

```bash
npx playwright test tests/creative-button.spec.ts
```

### Run tests matching a specific title

```bash
npx playwright test --grep "Code Snippet"
```

### Debug a test interactively

```bash
npm run test:debug
```

### View the HTML test report after a run

```bash
npm run report
```

---

## Teardown

When you are done, stop the Docker containers to free resources:

```bash
npm run teardown
```

This stops the containers but **preserves all data** (MySQL database, WordPress files). The next time you run `npm run setup` it will start much faster.

To completely wipe all Docker data and start fresh:

```bash
docker compose down -v
```

> Use `down -v` when you want a clean slate, for example after a major plugin update.

---

## CI/CD (GitHub Actions)

The workflow file is at [.github/workflows/e2e.yml](.github/workflows/e2e.yml).

### Triggers

| Trigger | Schedule |
|---------|----------|
| Manual dispatch | Any time via the GitHub Actions UI |
| Scheduled | Every Monday at 08:00 BDT (02:00 UTC) |

### Required Repository Secrets

Go to **Settings → Secrets and variables → Actions** in the GitHub repository and add:

| Secret | Description |
|--------|-------------|
| `PLUGIN_REPO_TOKEN` | GitHub Personal Access Token with `repo` scope, used to clone the private EA plugin repositories |
| `SLACK_BOT_TOKEN` | (Optional) Slack bot token for test result notifications |
| `SLACK_CHANNEL_ID` | (Optional) Slack channel ID to post notifications to |

### What the workflow does

1. Checks out the repository
2. Clones EA Free and EA Pro plugins using `PLUGIN_REPO_TOKEN`
3. Starts the Docker services and waits for WordPress to be ready
4. Runs WP-CLI to configure WordPress and seed test pages
5. Installs Node.js dependencies and caches Playwright browsers
6. Runs the full Playwright test suite
7. Posts results to Slack (if token is configured)
8. Publishes the HTML report to GitHub Pages
9. Uploads screenshots and videos for failed tests as artifacts (retained 7 days)

---

## Project Structure

```
ea-e2e-automation/
├── .github/
│   └── workflows/
│       └── e2e.yml                  # GitHub Actions workflow
├── config/
│   └── mysql.cnf                    # MySQL configuration
├── ea-plugins/                      # Mounted EA plugin source (not committed)
├── playwright/
│   └── .auth/
│       └── admin.json               # Saved auth state (generated, not committed)
├── playwright-report/               # HTML report output (generated)
├── scripts/
│   ├── configure-wordpress.sh       # WP-CLI: install plugins, configure settings
│   ├── wait-for-wordpress.sh        # Polls until WordPress HTTP endpoint is ready
│   ├── setup-test-pages.sh          # Orchestrates PHP page-seeding scripts
│   ├── setup-code-snippet-page.php  # Seeds Elementor page for Code Snippet widget
│   ├── setup-counter-page.php       # Seeds Elementor page for Counter widget
│   ├── setup-info-box-page.php      # Seeds Elementor page for Info Box widget
│   └── setup-test-pages.php         # Master page setup entry point
├── test-results/                    # Failure artifacts: screenshots, videos (generated)
├── tests/
│   ├── auth.setup.ts                # Login once and save session to playwright/.auth/
│   ├── creative-button.spec.ts      # Creative Button widget tests
│   ├── code-snippet.spec.ts         # Code Snippet widget tests
│   ├── counter.spec.ts              # Counter widget tests (Pro)
│   ├── info-box.spec.ts             # Info Box widget tests
│   └── fixtures/
│       └── wp-admin.ts              # Custom fixture: navigates to /wp-admin/
├── .env.example                     # Environment variable template
├── docker-compose.yml               # MySQL + WordPress + WP-CLI services
├── package.json
├── playwright.config.ts             # Playwright configuration
├── setup.sh                         # Main setup script (called by npm run setup)
├── teardown.sh                      # Stop Docker containers
└── tsconfig.json
```

---

## Adding New Widget Tests

Follow these steps to add tests for a new EA widget.

### 1. Create an Elementor test page

Add a PHP seeding script inside `scripts/` (copy an existing one as a template, e.g. `setup-info-box-page.php`). The script should:

- Create a WordPress page with a unique slug
- Insert raw Elementor JSON data with the widget configured in every variant you want to test
- Assign a stable CSS class to each widget instance using Elementor's `_css_classes` setting

Register the new slug in `.env.example`:

```dotenv
MY_WIDGET_PAGE_SLUG=my-widget-test
```

### 2. Wire up the seeding script

Add a call to your new PHP script inside `scripts/setup-test-pages.sh` so it runs during setup.

### 3. Write the spec file

Create `tests/my-widget.spec.ts`. Use an existing spec as a reference. A typical spec covers:

- **Page health** — HTTP 200, no PHP errors in source, no JS console errors
- **Element structure** — correct tags, attributes, CSS classes rendered in the DOM
- **Variant coverage** — one test block per meaningful widget configuration
- **Interactions** — click, hover, keyboard focus — assert no JS errors are thrown

```typescript
import { test, expect } from '@playwright/test';

const PAGE_URL = `/${process.env.MY_WIDGET_PAGE_SLUG ?? 'my-widget-test'}/`;

test.describe('My Widget', () => {
  test('page loads without errors', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page).toHaveTitle(/.+/);
  });

  test('renders default layout', async ({ page }) => {
    await page.goto(PAGE_URL);
    const widget = page.locator('.my-widget-default');
    await expect(widget).toBeVisible();
  });
});
```

### 4. Run your new tests

```bash
npx playwright test tests/my-widget.spec.ts --headed
```

---

## Slack Notifications

To receive test results in a Slack channel:

1. Create a Slack app and add the `chat:write` bot scope.
2. Install the app to your workspace and copy the **Bot User OAuth Token**.
3. Invite the bot to the target channel and copy the **Channel ID** (right-click the channel → View channel details).
4. Add to your `.env`:

```dotenv
SLACK_BOT_TOKEN=xoxb-your-token-here
SLACK_CHANNEL_ID=C0XXXXXXXXX
```

When these variables are set, the Playwright Slack reporter automatically posts a summary after each run.

---

## Troubleshooting

### Docker containers fail to start

```bash
docker compose down -v   # wipe everything
npm run setup            # start fresh
```

### WordPress is unreachable at http://localhost:8888

Check if something else is using port 8888:

```bash
lsof -i :8888
```

Change the port by setting `WP_PORT` in `.env` and updating `BASE_URL` to match.

### Tests fail with "Page not found" (404)

The test page was not seeded correctly. Re-run the setup:

```bash
npm run teardown
npm run setup
```

### `npm run setup` fails with "ea-plugins directory not found"

Make sure `EA_PLUGINS_PATH` in `.env` points to a directory that actually exists and contains the EA plugin folders.

### Auth state missing — login redirects unexpectedly

Delete the cached auth file and re-run tests (the setup project will recreate it):

```bash
rm -f playwright/.auth/admin.json
npm test
```

### Playwright browsers not installed

```bash
npx playwright install chromium
```

### View Docker logs for debugging

```bash
# All services
docker compose logs -f

# WordPress only
docker compose logs -f wordpress

# WP-CLI output
docker compose logs wpcli
```
