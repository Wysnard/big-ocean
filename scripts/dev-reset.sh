#!/bin/bash

# Reset big-ocean development environment
# Usage: ./scripts/dev-reset.sh
# WARNING: Removes all volumes and data!

set -e

echo "🗑️  Resetting big-ocean development environment..."
echo "⚠️  WARNING: This will DELETE all database data and volumes"
echo ""
read -p "Are you sure? Type 'yes' to confirm: " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Reset cancelled"
    exit 1
fi

echo ""
echo "Stopping and removing containers, networks, and volumes..."
docker compose --env-file .env down -v --remove-orphans

# Remove the network explicitly in case other compose projects kept it alive
docker network rm bigocean-network 2>/dev/null || true

echo ""
echo "✅ Development environment reset"
echo ""
echo "To start fresh: ./scripts/dev.sh"
