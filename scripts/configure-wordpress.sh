#!/usr/bin/env bash
set -euo pipefail

WP_PATH=/var/www/html

# ── helpers ────────────────────────────────────────────────────────────────────

log()  { echo "[configure] $*"; }
wp()   { command wp --path="${WP_PATH}" --allow-root "$@"; }

wait_for_file() {
  local file="$1"
  local timeout=120
  local waited=0
  until [ -f "${file}" ]; do
    if [ "${waited}" -ge "${timeout}" ]; then
      log "ERROR: Timed out waiting for ${file}"
      exit 1
    fi
    log "Waiting for ${file}... (${waited}s)"
    sleep 3
    waited=$((waited + 3))
  done
}

wait_for_db() {
  local timeout=60
  local waited=0
  local db_host="${WORDPRESS_DB_HOST:-db}"
  local db_user="${WORDPRESS_DB_USER:-wordpress}"
  local db_pass="${WORDPRESS_DB_PASSWORD:-wordpress}"
  local db_name="${WORDPRESS_DB_NAME:-wordpress}"

  log "Waiting for database at ${db_host}..."
  until php -r "
    mysqli_report(MYSQLI_REPORT_OFF);
    \$m = @new mysqli('${db_host}', '${db_user}', '${db_pass}', '${db_name}');
    exit(\$m->connect_errno ? 1 : 0);
  " 2>/dev/null; do
    if [ "${waited}" -ge "${timeout}" ]; then
      log "ERROR: Database not reachable after ${timeout}s"
      exit 1
    fi
    sleep 3
    waited=$((waited + 3))
  done
  log "Database is ready."
}

install_plugin_from_org() {
  local slug="$1"
  if wp plugin is-installed "${slug}" 2>/dev/null; then
    log "Plugin already installed: ${slug}"
  else
    log "Downloading plugin from WordPress.org: ${slug}"
    wp plugin install "${slug}"
  fi
  wp plugin activate "${slug}"
  log "Activated: ${slug}"
}

# ── wait for WordPress files ───────────────────────────────────────────────────

wait_for_file "${WP_PATH}/wp-config.php"
wait_for_db

# ── core install ───────────────────────────────────────────────────────────────

if wp core is-installed 2>/dev/null; then
  log "WordPress already installed — skipping core install."
else
  log "Installing WordPress core..."
  wp core install \
    --url="${WP_URL:-http://localhost:8888}" \
    --title="${WP_TITLE:-EA E2E Test Site}" \
    --admin_user="${WP_ADMIN_USER:-admin}" \
    --admin_password="${WP_ADMIN_PASSWORD:-admin123}" \
    --admin_email="${WP_ADMIN_EMAIL:-admin@example.com}" \
    --skip-email
  log "WordPress core installed."
fi

# ── permalink ──────────────────────────────────────────────────────────────────

log "Setting permalink structure to /%postname%/..."
wp rewrite structure '/%postname%/'
wp rewrite flush

# ── free plugins from WordPress.org ───────────────────────────────────────────

install_plugin_from_org "elementor"
install_plugin_from_org "woocommerce"

# ── theme ──────────────────────────────────────────────────────────────────────

log "Installing and activating Hello Elementor theme..."
wp theme install hello-elementor --activate
log "Theme: hello-elementor activated"

# ── local plugins from ./ea-plugins ───────────────────────────────────────────

PLUGINS_SRC="/tmp/ea-plugins"
PLUGINS_DEST="${WP_PATH}/wp-content/plugins"

if [ -d "${PLUGINS_SRC}" ]; then
  # Plugin directories
  for item in "${PLUGINS_SRC}"/*/; do
    [ -d "${item}" ] || continue
    slug=$(basename "${item}")
    dest="${PLUGINS_DEST}/${slug}"

    if [ -d "${dest}" ]; then
      log "Updating local plugin directory: ${slug}"
      cp -rf "${item}" "${PLUGINS_DEST}/"
    else
      log "Installing local plugin directory: ${slug}"
      cp -r "${item}" "${PLUGINS_DEST}/"
    fi

    wp plugin activate "${slug}"
    log "Activated local plugin: ${slug}"
  done

  # Plugin zip files
  for zip_file in "${PLUGINS_SRC}"/*.zip; do
    [ -f "${zip_file}" ] || continue
    log "Installing plugin from zip: $(basename "${zip_file}")"
    wp plugin install "${zip_file}" --activate --force
  done
fi

# ── summary ────────────────────────────────────────────────────────────────────

log ""
log "=========================================="
log " WordPress setup complete"
log "=========================================="
log " Site URL : ${WP_URL:-http://localhost:8888}"
log " Admin    : ${WP_URL:-http://localhost:8888}/wp-admin"
log " Username : ${WP_ADMIN_USER:-admin}"
log " Password : ${WP_ADMIN_PASSWORD:-admin123}"
log "=========================================="

wp plugin list
