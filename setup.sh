#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load env defaults if .env exists
if [ -f "${SCRIPT_DIR}/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${SCRIPT_DIR}/.env"
  set +a
fi

echo "=========================================="
echo " EA E2E Automation — Environment Setup"
echo "=========================================="

# ── 1. Validate ea-plugins directory ──────────────────────────────────────────

if [ ! -d "${SCRIPT_DIR}/ea-plugins" ]; then
  echo "ERROR: ./ea-plugins directory not found."
  echo "Create it and place your local plugin files inside."
  exit 1
fi

# ── 2. Start database and WordPress ───────────────────────────────────────────

echo ""
echo "[1/3] Starting Docker services..."
docker compose up -d db wordpress

# ── 3. Wait for WordPress HTTP endpoint ───────────────────────────────────────

echo ""
echo "[2/3] Waiting for WordPress to be reachable..."
bash "${SCRIPT_DIR}/scripts/wait-for-wordpress.sh"

# ── 4. Run WP-CLI configuration ───────────────────────────────────────────────

echo ""
echo "[3/3] Configuring WordPress..."
docker compose run --rm wpcli bash /scripts/configure-wordpress.sh

# ── Done ──────────────────────────────────────────────────────────────────────

echo ""
echo "=========================================="
echo " Setup complete!"
echo "=========================================="
echo " WordPress : http://localhost:${WP_PORT:-8888}"
echo " Admin     : http://localhost:${WP_PORT:-8888}/wp-admin"
echo " Username  : ${WP_ADMIN_USER:-admin}"
echo " Password  : ${WP_ADMIN_PASSWORD:-admin123}"
echo ""
echo " Next steps:"
echo "   npm install"
echo "   npx playwright install chromium"
echo "   npm test"
echo "=========================================="
