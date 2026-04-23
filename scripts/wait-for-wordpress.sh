#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8888}"
MAX_WAIT=180
WAITED=0
INTERVAL=5

echo "Waiting for WordPress at ${BASE_URL}..."

until curl -s --max-time 5 -o /dev/null -w "%{http_code}" "${BASE_URL}" \
  | grep -qE "^(200|301|302)$"; do

  if [ "${WAITED}" -ge "${MAX_WAIT}" ]; then
    echo "ERROR: WordPress did not respond within ${MAX_WAIT}s"
    docker compose logs wordpress --tail 30
    exit 1
  fi

  echo "  Not ready yet... (${WAITED}s / ${MAX_WAIT}s)"
  sleep "${INTERVAL}"
  WAITED=$((WAITED + INTERVAL))
done

echo "WordPress is ready at ${BASE_URL}"
