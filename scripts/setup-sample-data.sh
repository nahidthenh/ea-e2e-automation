#!/usr/bin/env bash
set -euo pipefail

WP_PATH=/var/www/html

log() { echo "[setup-data] $*"; }

log "Seeding sample data..."

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-sample-products.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-sample-posts.php

log "Sample data ready."
