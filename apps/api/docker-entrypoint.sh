#!/bin/sh
set -e

echo "📦 Installing dependencies after volume mounts..."
pnpm install --frozen-lockfile

echo "🔧 Rebuilding esbuild for Linux platform..."
pnpm rebuild esbuild

echo "🗃️ Running database migrations..."
pnpm -C /app db:migrate

echo "✅ Setup complete"
echo "🚀 Starting development server..."

# Execute the main command
exec "$@"
