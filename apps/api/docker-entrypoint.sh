#!/bin/sh
set -e

echo "📦 Installing dependencies after volume mounts..."
pnpm install --frozen-lockfile

echo "🔧 Rebuilding esbuild for Linux platform..."
pnpm add -D -w @esbuild/linux-arm64@0.27.2 --ignore-scripts
pnpm rebuild esbuild

echo "✅ Setup complete"
echo "🚀 Starting development server..."

# Execute the main command
exec "$@"
