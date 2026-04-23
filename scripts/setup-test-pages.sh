#!/usr/bin/env bash
set -euo pipefail

WP_PATH=/var/www/html

log() { echo "[setup-pages] $*"; }

log "Creating and configuring test pages..."

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-test-pages.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-code-snippet-page.php

log "Test pages ready."
