#!/bin/sh
set -e

echo "[entrypoint] Installing dependencies..."
pnpm install --frozen-lockfile

echo "[entrypoint] Starting dev server..."
exec "$@"
