#!/usr/bin/env bash
set -euo pipefail

echo "Stopping Docker containers..."
docker compose down

echo ""
echo "Containers stopped. Volumes are preserved."
echo ""
echo "To also destroy all data (full reset), run:"
echo "  docker compose down -v"
