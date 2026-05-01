#!/usr/bin/env bash
set -euo pipefail

base_ref="${1:-${BASE_REF:-origin/master}}"

if ! git rev-parse --verify "$base_ref" >/dev/null 2>&1; then
	echo "[test-changed] Base ref '$base_ref' not found; running full test suite"
	pnpm test:run
	exit 0
fi

changed_files="$(git diff --name-only "$base_ref"...HEAD || true)"

if [ -z "$changed_files" ]; then
	echo "[test-changed] No changed files detected; running full test suite"
	pnpm test:run
	exit 0
fi

echo "[test-changed] Changed files:"
echo "$changed_files" | sed 's/^/  - /'

if echo "$changed_files" | rg -q '(^package\.json$|^pnpm-lock\.yaml$|^turbo\.json$|^\.github/workflows/|vitest\.config|playwright\.config)'; then
	echo "[test-changed] Critical test or dependency config changed; running full test suite"
	pnpm test:run
	exit 0
fi

if echo "$changed_files" | rg -q '^(apps|packages)/.*\.(ts|tsx)$'; then
	echo "[test-changed] Application TypeScript changed; running full test suite"
	pnpm test:run
	exit 0
fi

if echo "$changed_files" | rg -q '^e2e/.*\.(ts|tsx)$'; then
	if [ ! -f ".env.e2e" ]; then
		echo "[test-changed] E2E files changed but .env.e2e is missing; skipping local E2E run"
		exit 0
	fi

	echo "[test-changed] E2E files changed; running Playwright suite"
	pnpm test:e2e
	exit 0
fi

echo "[test-changed] No test-relevant changes detected"
