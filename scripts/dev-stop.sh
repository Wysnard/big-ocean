#!/bin/bash

# Stop big-ocean development environment
# Usage: ./scripts/dev-stop.sh
# Keeps data intact - use dev-reset.sh for clean slate

set -e

echo "⏹️  Stopping big-ocean development environment..."
docker compose --env-file .env.local stop
echo "✅ Services stopped (data preserved)"
echo ""
echo "To restart: ./scripts/dev.sh"
echo "To reset: ./scripts/dev-reset.sh"
