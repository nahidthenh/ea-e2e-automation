#!/usr/bin/env bash
set -euo pipefail

WP_PATH=/var/www/html

log() { echo "[setup-pages] $*"; }

log "Creating and configuring test pages..."

# ── Sample data (must run before any widget that depends on posts/products) ──

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-sample-posts.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-sample-products.php

# ── Widget pages ──────────────────────────────────────────────────────────────

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-test-pages.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-code-snippet-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-info-box-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-counter-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-progress-bar-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-flip-box-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-advanced-accordion-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-tooltip-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-advanced-tabs-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-breadcrumbs-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-cta-box-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-feature-list-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-fancy-text-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-filterable-gallery-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-dual-color-heading-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-simple-menu-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-advanced-menu-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-content-ticker-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-svg-draw-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-team-member-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-price-menu-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-pricing-slider-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-image-accordion-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-image-comparison-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-image-hot-spots-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-testimonial-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-countdown-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-team-member-carousel-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-pricing-table-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-multicolumn-pricing-table-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-divider-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-toggle-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-one-page-navigation-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-interactive-circle-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-interactive-card-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-interactive-promo-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-logo-carousel-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-lightbox-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-offcanvas-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-post-list-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-woo-product-list-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-testimonial-slider-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-static-product-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-stacked-cards-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-protected-content-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-flip-carousel-page.php

command wp \
  --path="${WP_PATH}" \
  --allow-root \
  eval-file /scripts/setup-image-scroller-page.php

log "Test pages ready."
