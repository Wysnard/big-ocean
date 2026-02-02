#!/bin/sh
set -e

echo "🔧 Rebuilding esbuild for Linux platform..."
pnpm rebuild esbuild

echo "✅ Esbuild rebuild complete"
echo "🚀 Starting development server..."

# Execute the main command
exec "$@"
