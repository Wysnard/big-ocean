#!/usr/bin/env bash
set -euo pipefail

echo "[ci-local] Installing dependencies"
pnpm install --frozen-lockfile

echo "[ci-local] Checking native optional dependencies"
node -e "require('@rollup/rollup-linux-x64-gnu')" 2>/dev/null && echo "[ci-local] rollup native binary OK" || {
	echo "[ci-local] rollup native binary missing, reinstalling"
	pnpm install --force --frozen-lockfile
}

echo "[ci-local] Running lint"
pnpm lint

echo "[ci-local] Running typecheck"
pnpm typecheck

echo "[ci-local] Running build"
pnpm build

echo "[ci-local] Running unit and integration tests"
pnpm test:run

if [ "${RUN_E2E:-false}" = "true" ]; then
	if [ ! -f ".env.e2e" ]; then
		echo "[ci-local] RUN_E2E=true requires .env.e2e"
		exit 1
	fi

	echo "[ci-local] Installing Playwright browsers"
	pnpm --filter=@workspace/e2e exec playwright install --with-deps chromium

	echo "[ci-local] Running E2E tests"
	pnpm test:e2e
fi

if [ "${RUN_BURN_IN:-false}" = "true" ]; then
	echo "[ci-local] Running burn-in"
	"$(dirname "$0")/burn-in.sh"
fi
